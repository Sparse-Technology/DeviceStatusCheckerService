using DeviceStatusCheckerService.Models;
using Rssdp;
using System.Net.NetworkInformation;

namespace DeviceStatusCheckerService.Services
{
    public class CheckerService : IDisposable
    {
        public readonly string ServiceGUID = Guid.NewGuid().ToString();

        private readonly ILogger<CheckerService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        private CancellationTokenSource ThreadCancellationTokenSource = new CancellationTokenSource();
        private Thread? PingThread;
        private Thread? StreamTestThread;

        private SsdpDevicePublisher _Publisher;
        private DiscoveryService? _discoveryService;
        private DeviceManager _deviceManager;

        public CheckerService(ILogger<CheckerService> logger, IConfiguration configuration,
            IWebHostEnvironment hostingEnvironment,
            HttpClient httpClient, DeviceManager deviceManager)
        {
            _logger = logger;
            _httpClient = httpClient;
            _configuration = configuration;
            _deviceManager = deviceManager;

            #region SSDP
            var device = Helper.SsdpRootDevice(configuration);
            File.WriteAllText(Path.Combine(hostingEnvironment.WebRootPath, "descriptiondocument.xml"), device.ToDescriptionDocument());
            _Publisher = new SsdpDevicePublisher();
            _Publisher.AddDevice(device);
            #endregion

            try
            {
                if (NetworkInterface.GetIsNetworkAvailable() &&
                _configuration.GetValue<bool>("AppConfiguration:EnableDiscovery"))
                {
                    var iface = _configuration.GetValue<string>("AppConfiguration:NetworkInterface");
                    var bindIp = Helper.GetIPAddress(iface);

                    var timeout = _configuration.GetValue<int>("AppConfiguration:DiscoveryTimeout");
                    if (timeout <= 0)
                        timeout = 60000;
                    _discoveryService = new DiscoveryService();
                    _logger.LogInformation($"StartDiscovery: {bindIp?.ToString() ?? ""}");
                    _discoveryService.StartDiscovery(bindIp?.ToString() ?? "", OnDiscoveredDevice, timeout, ThreadCancellationTokenSource.Token);
                    _logger.LogInformation($"StartDiscovery: {bindIp?.ToString() ?? ""} - Done");
                }
                
                // TODO: Load static devices from file
                // var devicesFile = _configuration.GetValue<string>("AppConfiguration:DefaultDeviceJsonPath");
                // if (!string.IsNullOrEmpty(devicesFile) && File.Exists(devicesFile))
                //     _deviceManager.LoadStaticDevices(devicesFile);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message}");
            }
            PingThread = new Thread(new ThreadStart(PingLoop));
            PingThread.Start();

            StreamTestThread = new Thread(new ThreadStart(StreamTestLoop));
            StreamTestThread.Start();
        }

        private string GetThumbnailPath(string uuid)
        {
            var thumbnailPath = _configuration.GetValue<string>("AppConfiguration:ThumbnailsPath")?.Trim();
            if (string.IsNullOrEmpty(thumbnailPath))
                thumbnailPath = Path.Combine(Path.GetTempPath(), "thumbnails");

            thumbnailPath = Path.Combine(thumbnailPath, uuid);
            if (!Directory.Exists(thumbnailPath))
                Directory.CreateDirectory(thumbnailPath);

            return thumbnailPath;
        }

        private async Task TryAddDevice(DeviceAvailableEventArgs e)
        {
            _logger.LogDebug($"TryAddDevice: {e.DiscoveredDevice?.DescriptionLocation.AbsoluteUri}");
            try
            {
                Uri? u;
                if (Uri.TryCreate(e?.DiscoveredDevice?.DescriptionLocation.AbsoluteUri, UriKind.RelativeOrAbsolute, out u))
                {
                    var dev = new DeviceModel()
                    {
                        IP = u.Host,
                        Notes = "Discovered Device",
                        Hostname = u.Host,
                        DescriptionLocation = u.ToString(),
                    };

                    Helper.FillInfos(dev, _httpClient);
                    try
                    {
                        Uri? uu;
                        if (Uri.TryCreate(dev.PresentationURL, UriKind.Absolute, out uu))
                        {
                            foreach (var c in _configuration.GetSection("AppConfiguration:EstimatedAuths").GetChildren())
                            {
                                var user = c.GetValue<string>("user");
                                var pass = c.GetValue<string>("pass");
                                if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
                                    continue;

                                _logger.LogDebug($"Try auth: {uu.Host}:{uu.Port} [{user}, {pass}]");
                                var streamSetups = await Helper.GetStreamInformationAsync($"{uu.Host}:{uu.Port}", user, pass);
                                if (streamSetups == null)
                                    continue;

                                // Set the first auth that works
                                dev.User = user;
                                dev.Password = pass;
                                _logger.LogInformation($"Try auth: {uu.Host}:{uu.Port} [{user}, {pass}] - Done");

                                // Set the first stream setup that works
                                dev.Streams = streamSetups;

                                // Set the first system date and time that works
                                var dt = await Helper.GetSystemDateAndTimeAsync($"{uu.Host}:{uu.Port}", user, pass);
                                dev.TimeZone = dt.TimeZone.TZ;
                                dev.DateTimeType = dt.DateTimeType.ToString();
                                dev.DaylightSavings = dt.DaylightSavings;
                                dev.UTCDateTime = Helper.GetDateTimeOffset(dt.UTCDateTime).ToUnixTimeMilliseconds();
                                dev.LocalDateTime = Helper.GetDateTimeOffset(dt.LocalDateTime).ToUnixTimeMilliseconds();

                                break;
                            };
                        }
                        else
                        {
                            _logger.LogError($"TryAddDevice: {e.DiscoveredDevice?.DescriptionLocation.AbsoluteUri} - Invalid PresentationURL");
                        }
                    }
                    catch (Exception err)
                    {
                        _logger.LogError($"GetStreamSetups [{dev.PresentationURL}, {dev}] {err.Message}");
                    }
                    _deviceManager.TryAddOrUpdateDevice(dev);
                }
            }
            catch (Exception err)
            {
                _logger.LogError($"FillInfos [{e?.DiscoveredDevice?.DescriptionLocation.AbsoluteUri}] {err.Message}");
            }
        }

        private void OnDiscoveredDevice(object? sender, DeviceAvailableEventArgs e)
        {
            if (!e.IsNewlyDiscovered)
                return;
            _logger.LogDebug($"Discovered Device: {e.DiscoveredDevice?.DescriptionLocation.AbsoluteUri}");
            _ = Task.Run(() => TryAddDevice(e), ThreadCancellationTokenSource.Token);
        }

        private void StreamTestLoop()
        {
            while (!ThreadCancellationTokenSource.IsCancellationRequested)
            {
                foreach (var device in _deviceManager.Devices)
                {
                    if (device.DeviceActiveStatus != DeviceActiveStatus.ONLINE)
                        continue;
                    ThreadPool.QueueUserWorkItem(w =>
                    {
                        int linkId = 0;
                        foreach (var stream in device.Streams)
                        {
                            if (stream.Status == StreamStatus.OK)
                            {
                                _logger.LogTrace($"Skip trial stream for status OK.");
                                continue;
                            }

                            if (string.IsNullOrEmpty(stream.SnapshotUri))
                            {
                                _logger.LogTrace($"Skip empty URI");
                                continue;
                            }

                            try
                            {
                                var thumbnailPath = _configuration.GetValue<string>("AppConfiguration:ThumbnailsPath")?.Trim();
                                if (string.IsNullOrEmpty(thumbnailPath))
                                    thumbnailPath = Path.Combine(Path.GetTempPath(), "thumbnails");

                                thumbnailPath = Path.Combine(thumbnailPath, device.UUID);
                                if (!Directory.Exists(thumbnailPath))
                                    Directory.CreateDirectory(thumbnailPath);

                                var thumbnailFilePath = Path.Combine(thumbnailPath, $"stream_{linkId}.jpeg");
                                FileInfo fi = new FileInfo(thumbnailFilePath);
                                if (fi.Exists && fi.CreationTimeUtc.AddMinutes(1) > DateTime.UtcNow)
                                {
                                    _logger.LogTrace($"Skip trial stream for recent thumbnail.");
                                    device.Streams[linkId].Status = StreamStatus.OK;
                                    continue;
                                }

                                var tmpLink = stream.SnapshotUri.Replace("http://", $"http://{device.User}:{device.Password}@");
                                try
                                {
                                    _logger.LogDebug($"StreamTest: {device.IP} [{tmpLink}]");
                                    var data = Helper.GetSnapshotAsync(tmpLink, device.User, device.Password, ThreadCancellationTokenSource.Token);
                                    File.WriteAllBytes(thumbnailFilePath, data.Result);
                                    device.Streams[linkId].Status = StreamStatus.OK;
                                    _logger.LogDebug($"StreamTest: {device.IP} [{tmpLink}] - Done");
                                }
                                catch (Exception err)
                                {
                                    _logger.LogError($"StreamTest: {device.IP} [{tmpLink}] {err.Message}");
                                    device.Streams[linkId].Status = StreamStatus.ERROR;
                                }
                            }
                            catch (Exception err)
                            {
                                _logger.LogError($"ThumbnailsPath: {err.Message}");
                                device.Streams[linkId].Status = StreamStatus.ERROR;
                            }

                            linkId++;
                        }
                        _deviceManager.TryAddOrUpdateDevice(device);
                    });
                }

                _logger.LogDebug($"[{Thread.CurrentThread.ManagedThreadId}] ---------------------- Stream Test Loop end ------------------");
                GC.Collect();
                Thread.Sleep(60000);
            }
        }

        private void PingLoop()
        {
            while (!ThreadCancellationTokenSource.IsCancellationRequested)
            {
                _logger.LogDebug($"[{Thread.CurrentThread.ManagedThreadId}] ---------------------- Ping Loop start ------------------");
                foreach (var device in _deviceManager.Devices)
                {
                    ThreadPool.QueueUserWorkItem(w =>
                    {
                        var isPing = Helper.PingHost(device.IP);
                        device.DeviceActiveStatus = isPing ? DeviceActiveStatus.ONLINE : DeviceActiveStatus.OFFLINE;
                        _deviceManager.TryAddOrUpdateDevice(device);
                    });
                }

                _logger.LogDebug($"[{Thread.CurrentThread.ManagedThreadId}] ---------------------- Ping Loop end ------------------");
                GC.Collect();
                Thread.Sleep(30000);
            }
        }

        public void Dispose()
        {
            ThreadCancellationTokenSource.Cancel();
            PingThread?.Join();
            StreamTestThread?.Join();
            ThreadCancellationTokenSource.Dispose();
        }
    }
}
