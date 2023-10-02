using System.Drawing;
using System.Runtime.Serialization;

namespace DeviceStatusCheckerService.Models
{
    public enum DeviceActiveStatus
    {
        UNKNOWN = 0,
        ONLINE = 1,
        OFFLINE = 2,
    }

    public enum StreamStatus
    {
        UNKNOWN = 0,
        OK = 1,
        ERROR = 2,
    }

    public class StreamSetup
    {
        public string Name { get; set; } = "";
        public StreamStatus Status { get; set; } = StreamStatus.UNKNOWN;
        public string URI { get; set; } = "";
        public string CodecType { get; set; } = "";
        public Size Resolution { get; set; } = new Size(0, 0);
    }

    public class DeviceModel
    {
        public string UUID { get; set; } = "";
        public string IP { get; set; } = "";
        public string Hostname { get; set; } = "";
        public string FriendlyName { get; set; } = "";
        public string Model { get; set; } = "";
        public string SerialNumber { get; set; } = "";
        public string Manufacturer { get; set; } = "";
        public string User { get; set; } = "";
        public string Password { get; set; } = "";
        public string DescriptionLocation { get; set; } = "";
        public string PresentationURL { get; set; } = "";
        public List<StreamSetup> Streams { get; set; } = new List<StreamSetup>();
        public DeviceActiveStatus DeviceActiveStatus { get; set; } = DeviceActiveStatus.UNKNOWN;
        public string Notes { get; set; } = "";
        public string LastCheckTime
        {
            get
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(LastCheckTimeMs).ToString("MM/dd/yyyy HH:mm:ss.fff");
            }
        }
        public long LastCheckTimeMs { get; set; } = 0;

        public DeviceModel? Clone()
        {
            var obj = System.Text.Json.JsonSerializer.Serialize(this);
            return System.Text.Json.JsonSerializer.Deserialize<DeviceModel>(obj);
        }
    }
}
