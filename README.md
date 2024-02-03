# DeviceStatusCheckerService
The Device Status Checker Service is a web-based application that allows users to track and manage their devices.
It provides detailed information about each device, including Last Checked Status, IP address, Host Name, Serial Number, Model Name, Status, and Streams.

## Features

### Filtering
  - Users can filter devices using the filter button based on keywords or partial keywords, enabling efficient and customized searches.

### Export Menu for Standard Users
  - Device Selection: Users can select single or multiple devices by clicking Export Buttons on each device card.
  - Label Customization: Users can choose labels for selected devices, with the option to customize label names.
  - Export Formats: The selected devices and labels can be exported in JSON array format.
  - Bulk Actions: Selecting and unselecting visible devices is made easy, with options for resetting label fields individually or all at once.

### Export Menu for Advanced Users
  - Advanced Export Options: Advanced users can access a template engine for manual customization of label parts.
  - Template Engine: Input the desired template, select devices, and customize label parts for a tailored JSON output.

### Start with options

Set up the project by running the following environment variables:

```bash
export Kestrel_Endpoints_Http_Url="http://*:80"
export ServerDescription_Uuid="00000000-0000-0000-0000-000000000000"
export ServerDescription_FriendlyName="Device Status Checker"
export ServerDescription_Version="v0.0.1"
export ServerDescription_Manufacturer="Sparse Lab"
export ServerDescription_ModelName="Device Status Checker"
export ServerDescription_SerialNumber="00000000"
export DiscoveryTimeout=60000
export EnableDiscovery=true
export EnableCheckPing=true
export EnableCheckPort=true
export EnableCheckOnvifMedia=true
export EnableCheckRTSPLinks=true
export EnableFFmpegRTSPStreamTest=true
export ThumbnailsPath="/tmp/thumbnails/"
export DefaultDeviceJsonPath="device_list.json"
export NetworkInterface="eth0"
export BIND_INTERFACE="eth0"
```