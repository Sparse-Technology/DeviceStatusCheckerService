using Newtonsoft.Json;

namespace DeviceStatusCheckerService.Models;

public class LoginUserModel
{
    [JsonProperty("ip")]
    public string? ip { get; set; }
    [JsonProperty("user")]
    public string? user { get; set; }
    [JsonProperty("pass")]
    public string? pass { get; set; }
}