using DeviceStatusCheckerService.Models;
using DeviceStatusCheckerService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Runtime.Serialization;
using Scriban;
using Onvif.Core.Client.Device;
using Scriban.Runtime;
using System.Text;
using System.Net;
using System.Xml.Linq;

namespace DeviceStatusCheckerService.Pages
{
    public class IndexModel : PageModel
    {
        //FIELDS

        //initializing instances 
        private readonly ILogger<IndexModel> _logger;
        private readonly DeviceManager _deviceManager;

        //Contructor to initialize fields for dependency injection
        public IndexModel(ILogger<IndexModel> logger, DeviceManager deviceManager)
        {
            _logger = logger;
            _deviceManager = deviceManager;
        }

        public class JsonHTML
        {
            public string HTMLContent { get; set; }
        }

        //PROPERTIES
        public List<DeviceModel> Devices
        {
            get
            {
                return _deviceManager.Devices;
            }
        }

        //METHODS
        private string RenderScribanTemplate(List<DeviceModel> selectedDevices, List<string> selectedDynamicKeysArray, List<string> renamedKeysArray)
        {
            try
            {

                //List<string> selectedProperties = selectedDynamicKeysArray;
                List<string> selectedProperties = selectedDynamicKeysArray.Select(MemberRenamer).ToList();

                var _deviceTemplate = Template.Parse(@"
                [

                    {{ for model in models }}
                    {
                        {{- index = 0 -}}
                        {{ for selectedproperty in selectedproperties }}
                            {{if index < arraysize}}

                             {{ if selectedproperty == ""streams"" }}
                                ""Streams"": [
                                    {{for stream in model.streams}}
                                    {
                                        ""Status"": ""{{ stream.status }}"",
                                        ""Uri"": ""{{ stream.uri }}""
                                    },
                                    {{end}}
                                ]
                            {{else}}
                              ""{{renamedkeysarray[index]}}"": ""{{ model[selectedproperty]}}"",
                            {{end}}
                                {{index = index + 1}}
                            {{end}}
                        {{ end }}
                    },
                    {{ end }}
                ]
                ");

                var renderedDevice = _deviceTemplate.Render(new
                {
                    selectedproperties = selectedProperties,
                    selecteddynamickeysarray = selectedDynamicKeysArray,
                    models = selectedDevices,
                    renamedkeysarray = renamedKeysArray,
                    arraysize = selectedDynamicKeysArray.Count(),
                });
                return string.Join("", renderedDevice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering template for device");
                return "Error rendering template for device";
            }
        }


        public JsonResult OnGetExportTemplateDevices(string selectedCheckboxIdsParam, string selectedDynamicKeys, string renamedKeys)
        {

            try
            {
                if (selectedCheckboxIdsParam != null)
                {
                    var selectedDynamicKeysArray = System.Text.Json.JsonSerializer.Deserialize<List<string>>(selectedDynamicKeys);
                    if (selectedDynamicKeysArray.Count == 0)
                    {
                        return new JsonResult(new { error = "No labels are selected." })
                        {
                            StatusCode = (int)HttpStatusCode.BadRequest
                        };
                    }

                    var renamedKeysArray = System.Text.Json.JsonSerializer.Deserialize<List<string>>(renamedKeys);
                    byte[] data = Convert.FromBase64String(selectedCheckboxIdsParam);
                    string selectedUUIDs = System.Text.Encoding.UTF8.GetString(data);
                    string[] uuidArray = System.Text.Json.JsonSerializer.Deserialize<string[]>(selectedUUIDs);

                    var selectedDevices = _deviceManager.Devices
                        .Where(device => uuidArray.Contains(device.UUID))
                        .ToList();


                    // Check if selectedDevices is null or empty
                    if (selectedDevices.Count == 0)
                    {
                        return new JsonResult(new { error = "Please select devices." })
                        {
                            StatusCode = (int)HttpStatusCode.BadRequest
                        };
                    }
                    var selectedDevicesHTML = RenderScribanTemplate(selectedDevices, selectedDynamicKeysArray, renamedKeysArray);

                    var jsonHTML = new JsonHTML
                    {
                        HTMLContent = selectedDevicesHTML
                    };

                    return new JsonResult(jsonHTML);
                }
                else
                {
                    return new JsonResult("No data provided");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data");
                return new JsonResult("Error exporting data");
            }

        }


        public JsonResult OnGetExportDevices(string tpl, string selectedCheckboxIdsParam)
        {
            if (string.IsNullOrEmpty(tpl))
            {
                // Handle the error, throw an exception, or return an appropriate response
                return new JsonResult(new { error = "Please fill the template." })
                {
                    StatusCode = (int)HttpStatusCode.BadRequest
                };
            }
            try
            {
                byte[] data = Convert.FromBase64String(selectedCheckboxIdsParam);
                string selectedUUIDs = System.Text.Encoding.UTF8.GetString(data);
                string[] uuidArray = System.Text.Json.JsonSerializer.Deserialize<string[]>(selectedUUIDs);
                var selectedDevices = _deviceManager.Devices
                    .Where(device => uuidArray.Contains(device.UUID))
                    .ToList();

                if (selectedDevices.Count == 0)
                {
                    return new JsonResult(new { error = "Please select devices." })
                    {
                        StatusCode = (int)HttpStatusCode.BadRequest
                    };
                }

                //TEMPLATE WORKS
                tpl = Encoding.UTF8.GetString(Convert.FromBase64String(tpl));
                var template = Template.Parse(tpl);
                var result = template.Render(new { models = selectedDevices });
                return new JsonResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data");
                return new JsonResult("Error exporting data");
            }
        }


        //MemberRenamer function for scriban
        private static string MemberRenamer(string name)
        {
            var builder = new StringBuilder();
            var previousUpper = false;
            for (var i = 0; i < name.Length; i++)
            {
                var c = name[i];
                if (char.IsUpper(c))
                {
                    if (i > 0 && !previousUpper)
                    {
                        builder.Append("_");
                    }
                    builder.Append(char.ToLowerInvariant(c));
                    previousUpper = true;
                }
                else
                {
                    builder.Append(c);
                    previousUpper = false;
                }
            }
            return builder.ToString();
        }
    }
}