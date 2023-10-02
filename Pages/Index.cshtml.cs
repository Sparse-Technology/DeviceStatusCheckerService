using DeviceStatusCheckerService.Models;
using DeviceStatusCheckerService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace DeviceStatusCheckerService.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        private readonly DeviceManager _deviceManager;

        public IndexModel(ILogger<IndexModel> logger, DeviceManager deviceManager)
        {
            _logger = logger;
            _deviceManager = deviceManager;
        }

        public List<DeviceModel> Devices
        {
            get
            {
                return _deviceManager.Devices;
            }
        }
    }
}