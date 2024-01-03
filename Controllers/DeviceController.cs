using DeviceStatusCheckerService.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeviceStatusCheckerService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeviceController : ControllerBase
    {
        private readonly ILogger<DeviceController> _logger;
        private readonly DeviceManager _deviceManager;

        public DeviceController(ILogger<DeviceController> logger, DeviceManager deviceManager)
        {
            _logger = logger;
            _deviceManager = deviceManager;
        }

        [HttpGet("ListDevices")]
        public async Task<List<Models.DeviceModel>> ListDevices()
        {
            return await Task.Run(() => _deviceManager.Devices);
        }
    }
}