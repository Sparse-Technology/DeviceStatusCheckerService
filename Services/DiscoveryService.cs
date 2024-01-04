using Rssdp;

namespace DeviceStatusCheckerService.Services
{
    public class DiscoveryService : IDisposable
    {
        private SsdpDeviceLocator? _deviceLocator;

        public void StartDiscovery(string bindIp, EventHandler<DeviceAvailableEventArgs> cb, int timeout = 60000)
        {
            _deviceLocator = new SsdpDeviceLocator(bindIp) { NotificationFilter = "upnp:rootdevice" };
            _deviceLocator.DeviceAvailable += cb;
            _deviceLocator.StartListeningForNotifications();

            new Thread(() =>
            {
                while (true) {
                    Console.WriteLine("***************************\n** Searching for devices **\n***************************");
                    _ = _deviceLocator.SearchAsync();
                    Thread.Sleep(timeout);
                }
            }).Start();
        }

        public void Dispose()
        {
            _deviceLocator?.StopListeningForNotifications();
            _deviceLocator?.Dispose();
        }
    }
}