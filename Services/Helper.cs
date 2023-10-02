using DeviceStatusCheckerService.Models;
using Rssdp;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Xml;

namespace DeviceStatusCheckerService.Services
{
    public class Helper
    {
        public static System.Net.IPAddress? GetIPAddress(string? iface)
        {
            return NetworkInterface
                .GetAllNetworkInterfaces()
                .Where(i => i.OperationalStatus == OperationalStatus.Up)
                .Where(i => i.Name == iface)
                .Select(i => i.GetIPProperties().UnicastAddresses)
                .SelectMany(u => u)
                .Where(u => u.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                .Select(i => i.Address)
                .FirstOrDefault();
        }

        private static readonly Onvif.Core.Client.Common.StreamSetup rtspStreamSetup = new Onvif.Core.Client.Common.StreamSetup()
        {
            Transport = new Onvif.Core.Client.Common.Transport()
            {
                Protocol = Onvif.Core.Client.Common.TransportProtocol.RTSP
            }
        };

        public static async Task<List<StreamSetup>?> GetStreamSetupsAsync(string ip, string user, string password)
        {
            var list = new List<StreamSetup>();
            try
            {
                var mediaCli = await Onvif.Core.Client.OnvifClientFactory.CreateMediaClientAsync(ip, user, password);
                var profiles = await mediaCli.GetProfilesAsync();

                foreach (var profile in profiles.Profiles)
                {
                    if ((profile.VideoEncoderConfiguration == null) ||
                        (profile.VideoEncoderConfiguration.Encoding != Onvif.Core.Client.Common.VideoEncoding.H264))
                        continue;

                    var streamUri = await mediaCli.GetStreamUriAsync(rtspStreamSetup, profile.token);
                    list.Add(new StreamSetup()
                    {
                        Name = $"{profile.Name}_{profile.token}",
                        URI = streamUri.Uri,
                        Status = StreamStatus.UNKNOWN,
                        CodecType = profile.VideoEncoderConfiguration.Encoding.ToString(),
                        Resolution = new System.Drawing.Size(profile.VideoEncoderConfiguration.Resolution.Width, profile.VideoEncoderConfiguration.Resolution.Height),
                    });
                }
            }
            catch (Exception e)
            {
                //Console.WriteLine($"({ip}, {user}, {password}): {e}");
                return null;
            }

            return list;
        }

        public static (int, string) LinkTest(string rtspUri)
        {
            var query = $"--http0.9 --max-time 3 -s -D - \"{rtspUri.Replace("rtsp://", "http://")}\"";
            var p = new Process();
            p.StartInfo = new ProcessStartInfo("curl", query);
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.WorkingDirectory = Path.GetTempPath();
            p.Start();
            string output = p.StandardOutput.ReadToEnd();
            p.WaitForExit(5000);

            return (p.ExitCode, output);
        }

        public static (int, string) StreamTest(string rtspUri, string thumbnailPath)
        {
            var query = $"-hide_banner -loglevel info -rtsp_transport tcp -y -i \"{rtspUri}\" -ss 00:00:00 -frames:v 1 \"{thumbnailPath}\"";
            var p = new Process();
            p.StartInfo = new ProcessStartInfo("ffmpeg", query);
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.WorkingDirectory = Path.GetTempPath();
            p.Start();
            string output = p.StandardOutput.ReadToEnd();
            p.WaitForExit(5000);

            return (p.ExitCode, output);
        }

        public static bool PingHost(string nameOrAddress)
        {
            bool pingable = false;
            Ping? pinger = null;

            try
            {
                pinger = new Ping();
                PingReply reply = pinger.Send(nameOrAddress);
                pingable = reply.Status == IPStatus.Success;
            }
            catch (PingException)
            {
                // Discard PingExceptions and return false;
            }
            finally
            {
                pinger?.Dispose();
            }
            pinger = null;

            return pingable;
        }

        internal static void FillInfos(DeviceModel dev, HttpClient _httpClient)
        {
            try
            {
                string xmlData = _httpClient.GetStringAsync(dev.DescriptionLocation).Result;

                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xmlData);

                XmlNamespaceManager nsMgr = new XmlNamespaceManager(xmlDoc.NameTable);
                nsMgr.AddNamespace("upnp", "urn:schemas-upnp-org:device-1-0");

                string GetField(string fieldName)
                {
                    return xmlDoc?.SelectSingleNode($"/upnp:root/upnp:device/upnp:{fieldName}", nsMgr)?.InnerText ?? "";
                }

                dev.Model = GetField("modelName");
                dev.FriendlyName = GetField("friendlyName");
                dev.Manufacturer = GetField("manufacturer");
                dev.SerialNumber = GetField("serialNumber");
                dev.PresentationURL = GetField("presentationURL");
            }
            catch { }
        }
    }
}
