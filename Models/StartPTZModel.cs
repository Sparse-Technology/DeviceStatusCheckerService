namespace DeviceStatusCheckerService.Models
{
    public class StartPTZModel
    {
        public LoginUserModel? auth { set; get; }
        public string? profileToken { set; get; }
        public Onvif.Core.Client.Common.PTZSpeed? ptz { set; get; }
    }

    public class StopPTZModel
    {
        public LoginUserModel? auth { set; get; }
        public string? profileToken { set; get; }
    }

    public class GoToHomePTZModel
    {
        public LoginUserModel? auth { set; get; }
        public string? profileToken { set; get; }
    }
}
