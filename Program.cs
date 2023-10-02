using DeviceStatusCheckerService.Services;
using Microsoft.Extensions.FileProviders;

ThreadPool.SetMaxThreads(64, 128);
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<DeviceManager>();
builder.Services.AddSingleton<CheckerService>();
builder.Services.AddHttpClient();
builder.Services.AddRazorPages();

var app = builder.Build();
app.Services.GetRequiredService<DeviceManager>();
app.Services.GetRequiredService<CheckerService>();
app.UseExceptionHandler("/Error");

var thumbnailsPath = builder.Configuration.GetValue<string>("AppConfiguration:ThumbnailsPath")?.Trim();
if (string.IsNullOrEmpty(thumbnailsPath))
    thumbnailsPath = Path.Combine(Path.GetTempPath(), "thumbnails");

if (!Directory.Exists(thumbnailsPath))
    Directory.CreateDirectory(thumbnailsPath);

app.UseStaticFiles(new StaticFileOptions()
{
    FileProvider = new PhysicalFileProvider(thumbnailsPath),
    RequestPath = "/thumbnails"
});
app.UseRouting();
app.MapRazorPages();
app.Run();