using DeviceStatusCheckerService.Services;
using Microsoft.Extensions.FileProviders;
using System.Net.NetworkInformation;
using System.Text.Json.Serialization;

ThreadPool.SetMaxThreads(64, 128);
var builder = WebApplication.CreateBuilder(args);

#region Configuration
if (Environment.GetEnvironmentVariable("Kestrel_Endpoints_Http_Url") is string kestrelEndpointsHttpUrl)
    builder.Configuration["Kestrel:Endpoints:Http:Url"] = kestrelEndpointsHttpUrl;
if (Environment.GetEnvironmentVariable("ServerDescription_Uuid") is string serverDescription_Uuid)
    builder.Configuration["AppConfiguration:ServerDescription:Uuid"] = serverDescription_Uuid;
if (Environment.GetEnvironmentVariable("ServerDescription_FriendlyName") is string serverDescription_FriendlyName)
    builder.Configuration["AppConfiguration:ServerDescription:FriendlyName"] = serverDescription_FriendlyName;
if (Environment.GetEnvironmentVariable("ServerDescription_Version") is string serverDescription_Version)
    builder.Configuration["AppConfiguration:ServerDescription:Version"] = serverDescription_Version;
if (Environment.GetEnvironmentVariable("ServerDescription_Manufacturer") is string serverDescription_Manufacturer)
    builder.Configuration["AppConfiguration:ServerDescription:Manufacturer"] = serverDescription_Manufacturer;
if (Environment.GetEnvironmentVariable("ServerDescription_ModelName") is string serverDescription_ModelName)
    builder.Configuration["AppConfiguration:ServerDescription:ModelName"] = serverDescription_ModelName;
if (Environment.GetEnvironmentVariable("ServerDescription_SerialNumber") is string serverDescription_SerialNumber)
    builder.Configuration["AppConfiguration:ServerDescription:SerialNumber"] = serverDescription_SerialNumber;
if (Environment.GetEnvironmentVariable("DiscoveryTimeout") is string discoveryTimeout)
    builder.Configuration["AppConfiguration:DiscoveryTimeout"] = discoveryTimeout;
if (Environment.GetEnvironmentVariable("EnableDiscovery") is string enableDiscovery)
    builder.Configuration["AppConfiguration:EnableDiscovery"] = enableDiscovery;
if (Environment.GetEnvironmentVariable("EnableCheckPing") is string enableCheckPing)
    builder.Configuration["AppConfiguration:EnableCheckPing"] = enableCheckPing;
if (Environment.GetEnvironmentVariable("EnableCheckPort") is string enableCheckPort)
    builder.Configuration["AppConfiguration:EnableCheckPort"] = enableCheckPort;
if (Environment.GetEnvironmentVariable("EnableCheckOnvifMedia") is string enableCheckOnvifMedia)
    builder.Configuration["AppConfiguration:EnableCheckOnvifMedia"] = enableCheckOnvifMedia;
if (Environment.GetEnvironmentVariable("EnableCheckRTSPLinks") is string enableCheckRTSPLinks)
    builder.Configuration["AppConfiguration:EnableCheckRTSPLinks"] = enableCheckRTSPLinks;
if (Environment.GetEnvironmentVariable("EnableFFmpegRTSPStreamTest") is string enableFFmpegRTSPStreamTest)
    builder.Configuration["AppConfiguration:EnableFFmpegRTSPStreamTest"] = enableFFmpegRTSPStreamTest;
if (Environment.GetEnvironmentVariable("ThumbnailsPath") is string thumbnailsPath1)
    builder.Configuration["AppConfiguration:ThumbnailsPath"] = thumbnailsPath1;
if (Environment.GetEnvironmentVariable("DefaultDeviceJsonPath") is string defaultDeviceJsonPath)
    builder.Configuration["AppConfiguration:DefaultDeviceJsonPath"] = defaultDeviceJsonPath;
if (Environment.GetEnvironmentVariable("NetworkInterface") is string networkInterface1)
    builder.Configuration["AppConfiguration:NetworkInterface"] = networkInterface1;

var networkInterface = builder.Configuration.GetValue<string>("AppConfiguration:NetworkInterface")?.Trim();
if (Environment.GetEnvironmentVariable("BIND_INTERFACE") is string bindInterface)
{
    networkInterface = bindInterface;
    builder.Configuration["AppConfiguration:NetworkInterface"] = bindInterface;
}

var interfaces = NetworkInterface.GetAllNetworkInterfaces().Where(i => i.OperationalStatus == OperationalStatus.Up);
if (!interfaces.Where(i => i.Name == networkInterface).Any())
{
    Console.WriteLine($"Network interface '{networkInterface}' not found or not up. Please check your appsettings.json file.");
    Console.WriteLine("Available network interfaces:");
    Console.WriteLine($"  {"Name",30}: Description\n----------------------------------------------");
    foreach (var i in interfaces)
        Console.WriteLine($"- {i.Name,30}: {i.Description}");

    const int ERROR_BAD_ARGUMENTS = 0xA0;
    Environment.Exit(ERROR_BAD_ARGUMENTS);
}
Console.WriteLine($"Using configuration: {builder.Configuration.GetDebugView()}");
#endregion

builder.Services.AddSingleton<DeviceManager>();
builder.Services.AddSingleton<CheckerService>();
builder.Services.AddHttpClient();
builder.Services.AddRazorPages();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.Services.GetRequiredService<DeviceManager>();
app.Services.GetRequiredService<CheckerService>();
app.UseExceptionHandler("/Error");

app.UseSwagger();
app.UseSwaggerUI();

var thumbnailsPath = builder.Configuration.GetValue<string>("AppConfiguration:ThumbnailsPath")?.Trim();
if (string.IsNullOrEmpty(thumbnailsPath))
    thumbnailsPath = Path.Combine(Path.GetTempPath(), "thumbnails");

if (!Directory.Exists(thumbnailsPath))
    Directory.CreateDirectory(thumbnailsPath);

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions()
{
    FileProvider = new PhysicalFileProvider(thumbnailsPath),
    RequestPath = "/thumbnails"
});
app.UseRouting();
app.MapRazorPages();
app.MapControllers();
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.Run();