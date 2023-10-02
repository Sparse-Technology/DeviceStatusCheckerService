using Rssdp;

namespace DeviceStatusCheckerService.Services
{
    public class DiscoveryService : IDisposable
    {
        private SsdpDeviceLocator? _deviceLocator;

        public void StartDiscovery(string bindIp, EventHandler<DeviceAvailableEventArgs> cb)
        {
            _deviceLocator = new SsdpDeviceLocator(bindIp) { NotificationFilter = "upnp:rootdevice" };
            _deviceLocator.DeviceAvailable += cb;

            new Thread(() =>
            {
                _deviceLocator.StartListeningForNotifications();
                _deviceLocator.SearchAsync();
            }).Start();
        }

        public void Dispose()
        {
            _deviceLocator?.StopListeningForNotifications();
            _deviceLocator?.Dispose();
        }
    }
}