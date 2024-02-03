using DeviceStatusCheckerService.Models;
using System.Collections.Concurrent;
using System.Text;

namespace DeviceStatusCheckerService.Services
{
    public class DeviceManager
    {
        private readonly ILogger<DeviceManager> _logger;

        private ConcurrentDictionary<string, DeviceModel> _Devices { get; set; }

        public List<DeviceModel> Devices
        {
            get
            {
                var tmp = System.Text.Json.JsonSerializer.Serialize(_Devices.Values);
                return System.Text.Json.JsonSerializer.Deserialize<List<DeviceModel>>(tmp) ?? new List<DeviceModel>();
            }
        }

        public DeviceManager(ILogger<DeviceManager> logger)
        {
            _logger = logger;
            _Devices = new ConcurrentDictionary<string, DeviceModel>();
        }

        public void LoadStaticDevices(string filePath = "device_list.json")
        {
            try
            {
                var json = File.ReadAllText(filePath);
                var devices = System.Text.Json.JsonSerializer.Deserialize<List<DeviceModel>>(json);

                if (devices != null)
                {
                    foreach (var device in devices)
                    {
                        device.Notes = "Static Device";
                        TryAddOrUpdateDevice(device);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"{ex}");
            }
        }

        public void TryAddOrUpdateDevices(List<DeviceModel> devices)
        {
            foreach (var d in devices)
                TryAddOrUpdateDevice(d);
        }

        public void TryAddOrUpdateDevice(DeviceModel device)
        {
            if (string.IsNullOrEmpty(device.IP))
            {
                _logger.LogWarning($"IP cannot null !!!");
                return;
            }

            device.LastCheckTimeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (!_Devices.ContainsKey(device.UUID))
            {
                device.UUID = BitConverter.ToString(Encoding.UTF8.GetBytes(device.IP));
                _Devices.TryAdd(device.UUID, device);

                _logger.LogDebug($"Added new device: {device.IP}");
            }
            else
            {
                _Devices[device.UUID] = device;

                _logger.LogTrace($"Updated device ['{device.UUID}']: {device.IP}");
            }
        }
    }
}