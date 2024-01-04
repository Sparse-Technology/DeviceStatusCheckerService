using DeviceStatusCheckerService.Services;
using Microsoft.Extensions.FileProviders;
using System.Net.NetworkInformation;
using System.Text.Json.Serialization;

ThreadPool.SetMaxThreads(64, 128);
var builder = WebApplication.CreateBuilder(args);

var networkInterface = builder.Configuration.GetValue<string>("AppConfiguration:NetworkInterface")?.Trim();
var interfaces = NetworkInterface.GetAllNetworkInterfaces().Where(i => i.OperationalStatus == OperationalStatus.Up);
if (!interfaces.Where(i => i.Name == networkInterface).Any())
{
    Console.WriteLine($"Network interface '{networkInterface}' not found or not up. Please check your appsettings.json file.");
    Console.WriteLine("Available network interfaces:");
    Console.WriteLine($"  {"Name", 30}: Description\n----------------------------------------------");
    foreach (var i in interfaces)
        Console.WriteLine($"- {i.Name, 30}: {i.Description}");

    const int ERROR_BAD_ARGUMENTS = 0xA0;
    Environment.Exit(ERROR_BAD_ARGUMENTS);
}

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