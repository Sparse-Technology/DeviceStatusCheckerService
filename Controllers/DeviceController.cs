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

        [HttpPost("CheckDevicePTZSupport")]
        public async Task<IActionResult> CheckDevicePTZSupportAsync(Models.LoginUserModel auth)
        {
            try
            {
                if (auth.ip == null || auth.user == null || auth.pass == null)
                    return BadRequest("Required auth parameters are missing");

                if (await Helper.CheckDevicePTZSupportAsync(auth.ip, auth.user, auth.pass))
                    return Ok();
                else
                    return NotFound();
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [HttpPost("ListDeviceOnvifProfiles")]
        public async Task<IActionResult> ListDeviceOnvifProfilesAsync(Models.LoginUserModel auth)
        {
            try
            {
                if (auth.ip == null || auth.user == null || auth.pass == null)
                    return BadRequest("Required auth parameters are missing");

                var profiles = await Helper.GetOnvifProfilesAsync(auth.ip, auth.user, auth.pass);
                if (profiles != null)
                    return Ok(profiles);
                else
                    return NotFound();
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [HttpPost("StartPTZContinuousMove")]
        public async Task<IActionResult> StartPTZContinuousMoveAsync(Models.StartPTZModel model)
        {
            try
            {
                if (model.auth == null || model.ptz == null || string.IsNullOrEmpty(model.profileToken))
                    return BadRequest("Invalid parameters");

                if (model.auth.ip == null || model.auth.user == null || model.auth.pass == null)
                    return BadRequest("Required auth parameters are missing");

                if (await Helper.PTZContinuousMoveAsync(model.auth.ip, model.auth.user, model.auth.pass, model.profileToken, model.ptz))
                    return Ok();
                else
                    return Problem("Cannot start PTZ continuous move");
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [HttpPost("StopPTZContinuousMove")]
        public async Task<IActionResult> StopPTZContinuousMoveAsync(Models.StopPTZModel model)
        {
            try
            {
                if (model.auth == null || string.IsNullOrEmpty(model.profileToken))
                    return BadRequest("Invalid parameters");

                if (model.auth.ip == null || model.auth.user == null || model.auth.pass == null)
                    return BadRequest("Required auth parameters are missing");

                if (await Helper.PTZStopAsync(model.auth.ip, model.auth.user, model.auth.pass, model.profileToken))
                    return Ok();
                else
                    return Problem("Cannot stop PTZ continuous move");
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [HttpPost("GoToHomePosition")]
        public async Task<IActionResult> GoToHomePositionAsync(Models.GoToHomePTZModel model)
        {
            try
            {
                if (model.auth == null || string.IsNullOrEmpty(model.profileToken))
                    return BadRequest("Invalid parameters");

                if (model.auth.ip == null || model.auth.user == null || model.auth.pass == null)
                    return BadRequest("Required auth parameters are missing");

                if (await Helper.GoToPTZHomeAsync(model.auth.ip, model.auth.user, model.auth.pass, model.profileToken))
                    return Ok();
                else
                    return Problem("Cannot go to home position");
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }
    }
}