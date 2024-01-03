using DeviceStatusCheckerService.Models;
using Rssdp;
using System.Collections.Concurrent;
using System.Net.NetworkInformation;
using System.Text.RegularExpressions;

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

            try
            {
                if (NetworkInterface.GetIsNetworkAvailable() &&
                _configuration.GetValue<bool>("AppConfiguration:EnableDiscovery"))
                {
                    var iface = _configuration.GetValue<string>("AppConfiguration:NetworkInterface");
                    var bindIp = Helper.GetIPAddress(iface);

                    _discoveryService = new DiscoveryService();
                    _discoveryService.StartDiscovery(bindIp?.ToString() ?? "", OnDiscoveredDevice);
                }

                var devicesFile = _configuration.GetValue<string>("AppConfiguration:DefaultDeviceJsonPath");
                if (!string.IsNullOrEmpty(devicesFile) && File.Exists(devicesFile))
                    _deviceManager.LoadStaticDevices(devicesFile);
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex.Message}");
            }
            PingThread = new Thread(new ThreadStart(PingLoop));
            PingThread.Start();

            StreamTestThread = new Thread(new ThreadStart(StreamTestLoop));
            StreamTestThread.Start();

            #region SSDP
            var device = Helper.SsdpRootDevice(configuration);
            File.WriteAllText(Path.Combine(hostingEnvironment.WebRootPath, "descriptiondocument.xml"), device.ToDescriptionDocument());
            _Publisher = new SsdpDevicePublisher();
            _Publisher.AddDevice(device);
            #endregion
        }

        private async Task TryAddDevice(DeviceAvailableEventArgs e)
        {
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

                                var ss = await Helper.GetStreamSetupsAsync($"{uu.Host}:{uu.Port}", user, pass);
                                if (ss != null)
                                {
                                    dev.User = user;
                                    dev.Password = pass;
                                    dev.Streams = ss;
                                    var dt = await Helper.GetSystemDateAndTimeAsync($"{uu.Host}:{uu.Port}", user, pass);
                                    if (dt != null)
                                    {
                                        dev.TimeZone = dt.TimeZone.TZ;
                                        if (dt.UTCDateTime != null)
                                        {
                                            dev.UTCDateTime = new DateTimeOffset(
                                                dt.UTCDateTime.Date.Year,
                                                dt.UTCDateTime.Date.Month,
                                                dt.UTCDateTime.Date.Day,
                                                dt.UTCDateTime.Time.Hour,
                                                dt.UTCDateTime.Time.Minute,
                                                dt.UTCDateTime.Time.Second, TimeSpan.Zero).ToUnixTimeMilliseconds();
                                        }
                                        if (dt.LocalDateTime != null)
                                        {
                                            dev.LocalDateTime = new DateTimeOffset(
                                                dt.LocalDateTime.Date.Year,
                                                dt.LocalDateTime.Date.Month,
                                                dt.LocalDateTime.Date.Day,
                                                dt.LocalDateTime.Time.Hour,
                                                dt.LocalDateTime.Time.Minute,
                                                dt.LocalDateTime.Time.Second, TimeSpan.Zero).ToUnixTimeMilliseconds();
                                        }
                                        dev.DateTimeType = dt.DateTimeType.ToString();
                                        dev.DaylightSavings = dt.DaylightSavings;
                                    }
                                    break;
                                }
                            };
                        }
                    }
                    catch (Exception err)
                    {
                        _logger.LogError($"GetStreamSetups [{dev.PresentationURL}, {dev}] {err}");
                    }
                    _deviceManager.TryAddOrUpdateDevice(dev);
                }
            }
            catch (Exception err)
            {
                _logger.LogError($"FillInfos [{e?.DiscoveredDevice?.DescriptionLocation.AbsoluteUri}] {err}");
            }
        }

        private void OnDiscoveredDevice(object? sender, DeviceAvailableEventArgs e)
        {
            if (!e.IsNewlyDiscovered)
                return;
            _ = Task.Run(() => TryAddDevice(e));
        }

        private ConcurrentDictionary<string, (int, long)> _tryTimes = new ConcurrentDictionary<string, (int, long)>();

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

                            if (string.IsNullOrEmpty(stream.URI))
                            {
                                _logger.LogTrace($"Skip empty URI");
                                continue;
                            }

                            if (_tryTimes.TryGetValue(device.UUID, out (int, long) time))
                            {
                                if ((DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - time.Item2 < 15000))
                                {
                                    _logger.LogInformation($"Skip trial stream testing. {device.IP} [{stream.URI}]");
                                    continue;
                                }
                            }

                            var tmpLink = stream.URI;
                            if (!Regex.Match(stream.URI, @"^rtsp:\/\/(?:[^@]*@)").Success)
                                tmpLink = stream.URI.Replace("rtsp://", $"rtsp://{device.User}:{device.Password}@");

                            try
                            {
                                var thumbnailPath = _configuration.GetValue<string>("AppConfiguration:ThumbnailsPath")?.Trim();
                                if (string.IsNullOrEmpty(thumbnailPath))
                                    thumbnailPath = Path.Combine(Path.GetTempPath(), "thumbnails");

                                thumbnailPath = Path.Combine(thumbnailPath, device.UUID);
                                if (!Directory.Exists(thumbnailPath))
                                    Directory.CreateDirectory(thumbnailPath);

                                var thumbnailFilePath = Path.Combine(thumbnailPath, $"stream_{linkId}__%01d.jpeg");
                                if (!File.Exists(thumbnailFilePath.Replace("%01d", "1")))
                                {
                                    var streamTestResp = Helper.StreamTest(tmpLink, thumbnailFilePath);
                                    if (streamTestResp.Item1 > 0)
                                        throw new Exception($"Test stream: '{tmpLink}' => [{streamTestResp.Item1}] {streamTestResp.Item2}");
                                    _logger.LogInformation($"Test stream: '{tmpLink}' => [{streamTestResp.Item1}] {streamTestResp.Item2}");
                                }
                                device.Streams[linkId].Status = StreamStatus.OK;
                            }
                            catch (Exception err)
                            {
                                _logger.LogError($"{err}");
                                _tryTimes[device.UUID] = (linkId, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
                                device.Streams[linkId].Status = StreamStatus.ERROR;
                            }

                            linkId++;
                        }
                        _deviceManager.TryAddOrUpdateDevice(device);
                    });
                }

                _logger.LogInformation($"[{Thread.CurrentThread.ManagedThreadId}] ---------------------- Stream Test Loop end ------------------");
                GC.Collect();
                Thread.Sleep(15000);
            }
        }

        private void PingLoop()
        {
            while (!ThreadCancellationTokenSource.IsCancellationRequested)
            {
                foreach (var device in _deviceManager.Devices)
                {
                    ThreadPool.QueueUserWorkItem(w =>
                    {
                        var isPing = Helper.PingHost(device.IP);
                        device.DeviceActiveStatus = isPing ? DeviceActiveStatus.ONLINE : DeviceActiveStatus.OFFLINE;
                        _deviceManager.TryAddOrUpdateDevice(device);
                    });
                }

                _logger.LogInformation($"[{Thread.CurrentThread.ManagedThreadId}] ---------------------- Ping Loop end ------------------");
                GC.Collect();
                Thread.Sleep(5000);
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
