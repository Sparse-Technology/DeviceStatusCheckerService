import "bootstrap/dist/css/bootstrap.min.css";
import "highlight.js/styles/intellij-light.css";
import { Tooltip, Toast, Popover } from "bootstrap";
import fontawesome from "@fortawesome/fontawesome-free/js/all.js";
import { CustomTagify } from "./Classes/CustomTagify";
import hljs from "highlight.js";
import { jsonrepair } from "jsonrepair";

// GLOBAL VARIABLES
var jsonDeviceArray = [];
var jsonStringCopy = "";
var errorNotifColor = "#d72a6f";
var successNotifColor = "#20ad6b";
var neutralNotifColor = "#8f6ac4";

$(document).ready(function () {
    // TAGIFY RELATED EVENTS
    $('[data-toggle="tooltip"]').tooltip({
        animated: "fade",
        placement: "bottom",
        html: true,
    });

    toggleSelectLabels();

    $('[data-bs-toggle="collapse"]').collapse();


    sortAndAppendContainers();

    $('#cameraCardsBody .form-check input[type="checkbox"]').on(
        "change",
        function () {
            toggleExportMenuVisibility();
        }
    );

    // Closing modals
    $('[data-dismiss="modalLabel"]').on("click", function () {
        $("#exportDeviceModal").modal("hide");
    });

    $('[data-dismiss="modalCreateDevice"]').on("click", function () {
        $("#createDeviceModal").modal("hide");
    });

    $('[data-dismiss="modalPublishDevice"]').on("click", function () {
        $("#publishDeviceModal").modal("hide");
    });
});

const customTagify = new CustomTagify(
    "#tagify-filter-bar",
    `[dataFilter]:visible`
);

// EXPORT PART
window.toggleExportMenuVisibility = function () {
    // Check if at least one checkbox is checked on the entire page
    var collapseOne = $("#collapseOne");
    var checkedCheckboxes = $('#cameraCardsBody .form-check input[type="checkbox"]:checked');

    console.log(checkedCheckboxes.length);

    // Get numbers of checked EXPORT buttons in device bodies
    if (checkedCheckboxes.length > 0) {
        collapseOne.collapse("show");
    } else {
        collapseOne.collapse("hide");
    }
};


// Sorting camera cards by height
window.sortAndAppendContainers = function(){
    var containers = $('[data-card="container"]');

    containers.sort(function (a, b) {
        // Compare the heights of the camera containers in descending order
        var heightA = $(a).find('[data-card="cameraContainer"]').height();
        var heightB = $(b).find('[data-card="cameraContainer"]').height();

        return heightA - heightB;
    });

    // Append the sorted camera containers back to the parent containers with data-card="container"
    $('#sortedCameraCards').empty().append(containers);
}

window.resetLabels = function () {
    $('#dynamicKeys input[type="checkbox"]').prop("checked", false).change();
    $("[id^=btnRenameInput_]").val(null);
    $("[id^=btnRenameInput_]").prop("disabled", true);
};

window.resetFields = function () {
    $("[id^=btnRenameInput_]").val(null);
    $("[id^=btnRenameInput_]").prop("disabled", true);
};

window.resetCameras = function () {
    $('#cameraCardsBody .form-check input[type="checkbox"]').prop(
        "checked",
        false
    );
};

window.toggleRenameKeys = function () {
    var checkedLabels = $('#dynamicKeys input[type="checkbox"]');

    checkedLabels.each(function () {
        var propertyName = this.id.replace("btncheck_", "");

        // Finding specific inputs
        var btnRenameInput = $("#btnRenameInput_" + propertyName);

        // Toggle the disabled attribute based on the checkbox's checked status
        btnRenameInput.prop("disabled", !this.checked);
    });
};

// Variable to track the state of selection
var isAllSelected = true;

// Function to toggle selection
window.toggleSelectLabels = function () {
    var checkedLabels = $('#dynamicKeys input[type="checkbox"]');

    checkedLabels.each(function () {
        var propertyName = this.id.replace("btncheck_", "");
        var btnRenameInput = $("#btnRenameInput_" + propertyName);

        // Toggle the disabled attribute based on the state
        btnRenameInput.prop("disabled", isAllSelected);
        // Toggle the checkbox based on the state
        this.checked = !isAllSelected;
    });

    // Toggle the state for the next click
    isAllSelected = !isAllSelected;
};

window.exportSelectedDevices = function () {
    var selectedCheckboxIds = [];
    $('#cameraCardsBody .form-check input[type="checkbox"]').each(function () {
        // Check if the checkbox is checked
        if ($(this).is(":checked")) {
            selectedCheckboxIds.push(this.id.split("_")[1]);
        }
    });

    // Creating original and renamed key-label names arrays
    var selectedDynamicKeys = [];
    var renamedKeys = [];

    $('#dynamicKeys input[type="checkbox"]').each(function () {
        if ($(this).is(":checked")) {
            // Getting original key-label name
            var propertyName = this.id.split("_")[1];
            selectedDynamicKeys.push(propertyName);

            // Getting renamed key-label name
            var renamedKey = "";
            var btnRenameInput = $("#btnRenameInput_" + propertyName);
            var btnRenameInputValue = btnRenameInput.val();

            if (btnRenameInputValue == null || btnRenameInputValue.trim() === "") {
                renamedKey = btnRenameInput.attr("placeholder");
            } else {
                renamedKey = btnRenameInputValue;
            }

            renamedKeys.push(renamedKey);
        }
    });

    var selectedDynamicKeysParam = encodeURIComponent(
        JSON.stringify(selectedDynamicKeys)
    );
    var renamedKeysParam = encodeURIComponent(JSON.stringify(renamedKeys));

    // Removing trailing comma
    function removeTrailingComma(content) {
        var resultString = String(content);
        var lastCommaIndex = resultString.lastIndexOf(",");
        var untrailedString =
            resultString.slice(0, lastCommaIndex) +
            resultString.slice(lastCommaIndex + 1);
        var cleanedString = untrailedString.replace(/ /g, "");
        return cleanedString;
    }

    $.ajax({
        url: `/Index?handler=ExportTemplateDevices&selectedCheckboxIdsParam=${btoa(
            JSON.stringify(selectedCheckboxIds)
        )}&selectedDynamicKeys=${selectedDynamicKeysParam}&renamedKeys=${renamedKeysParam}`,
        success: function (result) {
            // FORMATTING RESULT
            var untrailedString = removeTrailingComma(result.htmlContent);
            const correctedJsonString = untrailedString.replace(
                /,(\s*})|},\s*\]/g,
                (match, p1) => (p1 ? p1 : "}]")
            );
            jsonDeviceArray = JSON.parse(correctedJsonString);

            var jsonString = JSON.stringify(jsonDeviceArray, null, 2);
            jsonString = jsonrepair(jsonString);
            jsonStringCopy = jsonString;

            $("#templateOutputAdvanced").removeAttr("data-highlighted");
            $("#templateOutputAdvanced").html(jsonString);
            console.log("JSONSTRINGCOPYY");
            console.log(jsonStringCopy);
            hljs.highlightElement(document.querySelector("#templateOutputAdvanced"));
        },
        error: function (xhr, textStatus, errorThrown) {
            console.error("Export error:", textStatus, errorThrown);

            if (xhr.responseJSON && xhr.responseJSON.error) {
                notificate("notif", "Export error: " + xhr.responseJSON.error, errorNotifColor);
                //alert("Export error: " + xhr.responseJSON.error);
            } else {
                notificate("notif", "Export error occurred.", errorNotifColor);
                //alert("Export error occurred.");
            }
        },
    });
};

window.checkVisibleFilteredDevices = function () {
    $('#cameraCardsBody .form-check input[type="checkbox"]:visible').prop(
        "checked",
        true
    );
};

window.resetInput = function (propertyName) {
    var renameInputToReset = $("#btnRenameInput_" + propertyName);
    renameInputToReset.val(null);
};

window.exportSelectedDevicesAdvanced = function () {
    var selectedCheckboxIds = [];
    $('#cameraCardsBody .form-check input[type="checkbox"]').each(function () {
        // Check if the checkbox is checked
        if ($(this).is(":checked")) {
            // Add the ID to the array
            selectedCheckboxIds.push(this.id.split("_")[1]);
        }
    });
    const userTemplate = $("#templateInput").val();
    const encodedTemplate = btoa(userTemplate);

    $.ajax({
        url: `/Index?handler=ExportDevices&tpl=${encodedTemplate}&selectedCheckboxIdsParam=${btoa(
            JSON.stringify(selectedCheckboxIds)
        )}`,
        contentType: "application/json",
        success: function (result) {
            console.log("ADVANCED RESUUULLT");
            console.log(result);
            jsonDeviceArray = JSON.parse(result);
            var jsonString = JSON.stringify(jsonDeviceArray, null, 2);

            $("#templateOutputAdvanced").removeAttr("data-highlighted");
            $("#templateOutputAdvanced").html(jsonString);
            jsonStringCopy = jsonString;

            // You should use JS DOM selector not JQuery selector with highlight.js,
            hljs.highlightElement(document.querySelector("#templateOutputAdvanced"));
        },
        error: function (xhr, textStatus, errorThrown) {
            console.error("Export error:", textStatus, errorThrown);

            if (xhr.responseJSON && xhr.responseJSON.error) {
                notificate("notif", "Export error: " + xhr.responseJSON.error, errorNotifColor);
                //alert("Export error: " + xhr.responseJSON.error);
            } else {
                notificate("notif", "Export error occurred.", errorNotifColor);
                //alert("Export error occurred.");
            }
        },
    });
};

window.toggleExportOptions = function () {
    var exportOptionsButton = $("#exportOptionsButton");

    exportOptionsButton.text(
        exportOptionsButton.text() === "Simple Export Options"
            ? "Advanced Export Options"
            : "Simple Export Options"
    );
    $("#dynamicKeys").toggleClass("d-none");
    $("#advancedExportInput").toggleClass("d-none");

    var exportButton = $("#exportButton");
    exportButton.attr(
        "onclick",
        exportButton.attr("onclick") === "exportSelectedDevicesAdvanced()"
            ? "exportSelectedDevices()"
            : "exportSelectedDevicesAdvanced()"
    );
};

window.showCreateDeviceModal = function () {
    $("#createDeviceModal").modal("show");
};

window.showPublishDeviceModal = function () {
    $("#publishDeviceModal").modal("show");
};

window.publishDevices = function () {
    var url = $("#urlInput").val();
    var username = $("#usernameInput").val();
    var password = $("#passwordInput").val();
    var deviceData = jsonDeviceArray;

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            username: username,
            password: password,
            deviceData: deviceData,
        }),
        contentType: "application/json",
        success: function (res) {
            console.log("Success", res);
        },
        error: function (err) {
            console.error("Error", err);
        },
    });
};

// Template Input Visibility
var templateInputGroup = $("#templateInputGroup");
var templateInput = $("#templateInput");
templateInput.val(
    `[
{{ for model in models }}
    {
        "UUID": "{{ model.uuid }}",
        "IP": "{{ model.ip }}",
        "Hostname": "{{ model.hostname }}",
        "FriendlyName": "{{ model.friendly_name }}",
        "Model": "{{ model.model }}",
        "SerialNumber": "{{ model.serial_number }}",
        "Manufacturer": "{{ model.manufacturer }}",
        "User": "{{ model.user }}",
        "Password": "{{ model.password }}",
        "DescriptionLocation": "{{ model.description_location }}",
        "PresentationURL": "{{ model.presentation_url }}",

        "Streams": [
            {{ for stream in model.streams }}
                {
                    "Status": "{{ stream.status }}",
                    "URI": "{{ stream.uri }}"
                }
                {{ if !for.last }},{{ end }}
            {{ end }}
        ],

        "DeviceActiveStatus": "{{ model.device_active_status }}",
        "Notes": "{{ model.notes }}",
        "LastCheckTime": "{{ model.last_check_time }}",
        "LastCheckTimeMs": {{ model.last_check_time_ms }},
        "DateTimeType": "{{ model.date_time_type }}",
        "DaylightSavings": "{{ model.daylight_savings }}",
        "TimeZone": "{{ model.time_zone }}",
        "UTCDateTime": "{{ model.utcdate_time }}",
        "LocalDateTime": "{{ model.local_date_time }}"
    }
    {{ if !for.last }},{{ end }}
{{ end }}
]`
);

window.refreshPage = function () {
    location.reload(true);
};


window.copyDevicesJSON = function () {
    // Check if jsonStringCopy is null or empty
    if (!jsonStringCopy || jsonStringCopy.trim() === '') {
        notificate("notif", "No content to copy", neutralNotifColor);
        return;
    }

    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
            .writeText(jsonStringCopy)
            .then(() => {
                notificate("notif", "Copied", successNotifColor);
            })
            .catch((error) => {
                notificate("notif", "Unable to copy the content", errorNotifColor);
            });
    } else {
        // Use the 'out of viewport hidden text area' trick
        const textArea = document.createElement("textarea");
        textArea.value = jsonStringCopy;

        // Move textarea out of the viewport so it's not visible
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";

        document.body.prepend(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            notificate("notif", "Copied", successNotifColor);
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var copyButtons = document.querySelectorAll("[data-stream]");

    copyButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var streamData = button.getAttribute("data-stream");
            navigator.clipboard
                .writeText(streamData)
                .then(() => {
                    notificate("notif", "Copied", successNotifColor);
                })
                .catch((error) => {
                    console.log(error)
                });
        });
    });
});

window.notificate = function (elementId, notifText, hexColorCode) {
    var x = document.getElementById(elementId);
    x.textContent = notifText;
    x.style.backgroundColor = hexColorCode;
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 2500);
}