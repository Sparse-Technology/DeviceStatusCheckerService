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
        private readonly CheckerService _checkerService;

        public DeviceController(ILogger<DeviceController> logger, DeviceManager deviceManager, CheckerService checkerService)
        {
            _logger = logger;
            _deviceManager = deviceManager;
            _checkerService = checkerService;
        }

        [HttpGet("ListDevices")]
        public async Task<List<Models.DeviceModel>> ListDevices()
        {
            return await Task.Run(() => _deviceManager.Devices);
        }

        [HttpPost("SetLoginUsers")]
        public IActionResult SetEstimatedAuths(List<Models.LoginUserModel> users)
        {
            _checkerService.SetLoginUsers(users);
            return Ok();
        }
    }
}