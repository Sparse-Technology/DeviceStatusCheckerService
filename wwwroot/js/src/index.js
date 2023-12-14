import $ from 'jquery';
import Tagify from "@yaireo/tagify";
import "@yaireo/tagify/dist/tagify.css";
import hljs from "highlight.js";
import "highlight.js/styles/default.min.css";
import { Tooltip, Toast, Popover } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import fontawesome from "@fortawesome/fontawesome-free/js/all.js";

$(document).ready(function () {
    //TAGIFY RELATED EVENTS
    $('[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        html: true
    });

    // $('#exportMenu').hide();
    $('#cameraCardsBody .form-check input[type="checkbox"]').on('change', function () {
        if ($(this).is(':checked')) {
            // Log the ID of the checked checkbox
            // console.log('Checkbox checked with ID:', this.id);
        }
        toggleExportMenuVisibility();
    });

    //Closing modal
    $('[data-dismiss="modalLabel"]').on('click', function () {
        $('#exportDeviceModal').modal('hide');
    });

    //Closing modal
    $('[data-dismiss="modalCreateDevice"]').on('click', function () {
        $('#createDeviceModal').modal('hide');
    });

    //Closing modal
    $('[data-dismiss="modalPublishDevice"]').on('click', function () {
        $('#publishDeviceModal').modal('hide');
    });
});

// Extract suggestion text from the visible dataFilter elements
window.extractStateUniqueWords = function (selector) {
    var words = new Set();
    $(selector).each(function () {
        var dataFilterText = $(this).text().toLowerCase().trim();
        words.add(dataFilterText);
    });
    return Array.from(words);
}

//Add a tag from the searchArray
window.onTagAdded = function (e) {
    const addedTag = e.detail.data.value;
    searchWordsArray.push(addedTag);

    searchWordsArray.forEach(filterString => filterPageTagify(filterString, '[data-card="container"]:visible'));
    // Log the searchable keywords to the console
    tagify.whitelist = extractStateUniqueWords(`[dataFilter]:visible`);
}

// Remove a tag from the searchArray
window.onTagRemoved = function (e) {
    const removedTag = e.detail.data.value;

    const index = searchWordsArray.findIndex(tag => tag === removedTag);

    if (index !== -1) {
        // Element found, remove it from the array
        searchWordsArray.splice(index, 1);
    }
    // After removing an element start searching again

    if (searchWordsArray.length === 0) {
        // If no tags are present, show all camera cards
        $('[data-card="container"]').show();
    } else {
        // If tags are present, filter based on the remaining tags
        searchWordsArray.forEach(filterString =>
            filterPageTagify(filterString, '[data-card="container"]'));
    }
    tagify.whitelist = extractStateUniqueWords(`[dataFilter]:visible`);
}

// Tagify Filter
window.filterPageTagify = function (filterString, selector) {
    var filter = filterString.toLowerCase(); // Convert filter to lowercase for case-insensitive comparison

    if (filter.length <= 2 && filter.length > 0) {
        return;
    } else {
        $(selector).filter(function () {
            // Change the comparison to check if the text contains the filter string
            $(this).toggle($(this).text().toLowerCase().includes(filter));
        });
    }
}

//EXPORT PART
window.toggleExportMenuVisibility = function () {
    // Check if at least one checkbox is checked on the entire page
    var collapseOne = $('#collapseOne');

    if ($('#cameraCardsBody .form-check input[type="checkbox"]:checked').length > 0) {
        collapseOne.collapse('show');
    } else {
        collapseOne.collapse('hide');
    }
}

window.resetLabels = function () {
    $('#dynamicKeys input[type="checkbox"]').prop('checked', false).change();
    $('[id^=btnRenameInput_]').val(null);
    $('[id^=btnRenameInput_]').prop('disabled', true);
}

window.resetFields = function () {
    $('[id^=btnRenameInput_]').val(null);
    $('[id^=btnRenameInput_]').prop('disabled', true);
}

window.resetCameras = function () {
    $('#cameraCardsBody .form-check input[type="checkbox"]').prop('checked', false);
}

window.toggleRenameKeys = function () {
    var checkedLabels = $('#dynamicKeys input[type="checkbox"]');

    checkedLabels.each(function () {
        var propertyName = this.id.replace("btncheck_", "");

        // Finding specific inputs
        var btnRenameInput = $('#btnRenameInput_' + propertyName);

        // Toggle the disabled attribute based on the checkbox's checked status
        btnRenameInput.prop('disabled', !this.checked);
    });
}

window.exportSelectedDevices = function () {
    var selectedCheckboxIds = [];
    $('#cameraCardsBody .form-check input[type="checkbox"]').each(function () {
        // Check if the checkbox is checked
        if ($(this).is(':checked')) {
            selectedCheckboxIds.push(this.id.split("_")[1]);
        }
    });

    //Creating original and renamed key-label names arrays
    var selectedDynamicKeys = [];
    var renamedKeys = [];

    $('#dynamicKeys input[type="checkbox"]').each(function () {
        if ($(this).is(':checked')) {
            // Getting original key-label name
            var propertyName = this.id.split("_")[1];
            selectedDynamicKeys.push(propertyName);

            // Getting renamed key-label name
            var renamedKey = "";
            var btnRenameInput = $('#btnRenameInput_' + propertyName);
            var btnRenameInputValue = btnRenameInput.val();

            if (btnRenameInputValue == null || btnRenameInputValue.trim() === '') {
                renamedKey = btnRenameInput.attr('placeholder');
            } else {
                renamedKey = btnRenameInputValue;
            }

            renamedKeys.push(renamedKey);
        }
    });

    var selectedDynamicKeysParam = encodeURIComponent(JSON.stringify(selectedDynamicKeys));
    var renamedKeysParam = encodeURIComponent(JSON.stringify(renamedKeys));

    //Removing trailing comma
    function removeTrailingComma(content) {
        var resultString = String(content);
        var lastCommaIndex = resultString.lastIndexOf(',');
        var untrailedString = resultString.slice(0, lastCommaIndex) + resultString.slice(lastCommaIndex + 1);
        var cleanedString = untrailedString.replace(/ /g, '');
        return cleanedString;
    }


    $.ajax({
        //Stringi linke çevirip gönderdik
        url: `/Index?handler=ExportTemplateDevices&selectedCheckboxIdsParam=${btoa(JSON.stringify(selectedCheckboxIds))}&selectedDynamicKeys=${selectedDynamicKeysParam}&renamedKeys=${renamedKeysParam}`,
        success: function (result) {
            // FORMATTING RESULT
            var untrailedString = removeTrailingComma(result.htmlContent);
            const correctedJsonString = untrailedString.replace(/,(\s*})|},\s*\]/g, (match, p1) => p1 ? p1 : '}]');
            jsonDeviceArray = JSON.parse(correctedJsonString);

            // RENDERING
            var jsonString = JSON.stringify(jsonDeviceArray, null, 2);

            $('#templateOutputAdvanced').removeAttr('data-highlighted');
            $('#templateOutputAdvanced').html(jsonString);
            hljs.highlightElement(document.querySelector('#templateOutputAdvanced'));
        },
        error: function (xhr, textStatus, errorThrown) {
            console.error("Export error:", textStatus, errorThrown);

            // Check if the response has an 'error' property
            if (xhr.responseJSON && xhr.responseJSON.error) {
                alert("Export error: " + xhr.responseJSON.error);
            } else {
                // If no specific error message, show a generic message
                alert("Export error occurred.");
            }
        }
    });
}

window.copyDevicesJSON = function () {
    var htmlToCopy = $('#modalJSONResult').text();
    navigator.clipboard.writeText(htmlToCopy).then(() => {
        alert("Content is copied to clipboard")
    }).catch((error) => {
        alert("Unable to copy the content", error);
    });
}

window.checkVisibleFilteredDevices = function () {
    $('#cameraCardsBody .form-check input[type="checkbox"]:visible').prop('checked', true);
}

window.resetInput = function (propertyName) {
    var renameInputToReset = $('#btnRenameInput_' + propertyName);
    renameInputToReset.val(null);
}

window.exportSelectedDevicesAdvanced = function () {
    var selectedCheckboxIds = [];
    $('#cameraCardsBody .form-check input[type="checkbox"]').each(function () {
        // Check if the checkbox is checked
        if ($(this).is(':checked')) {
            // Add the ID to the array
            selectedCheckboxIds.push(this.id.split("_")[1]);
        }
    });
    const userTemplate = $('#templateInput').val();
    const encodedTemplate = btoa(userTemplate);


    $.ajax({
        url: `/Index?handler=ExportDevices&tpl=${encodedTemplate}&selectedCheckboxIdsParam=${btoa(JSON.stringify(selectedCheckboxIds))}`,
        contentType: 'application/json',
        success: function (result) {
            jsonDeviceArray = JSON.parse(result);
            var jsonString = JSON.stringify(jsonDeviceArray, null, 2);

            $('#templateOutputAdvanced').removeAttr('data-highlighted');
            $('#templateOutputAdvanced').html(jsonString);

            //IMPORTANT, When adding highlight.js
            //you should use JS DOM selector not JQuery selector,
            //it is not working with jquery
            hljs.highlightElement(document.querySelector('#templateOutputAdvanced'));
        },
        error: function (xhr, textStatus, errorThrown) {
            console.error("Export error:", textStatus, errorThrown);

            // Check if the response has an 'error' property
            if (xhr.responseJSON && xhr.responseJSON.error) {
                alert("Export error: " + xhr.responseJSON.error);
            } else {
                // If no specific error message, show a generic message
                alert("Export error occurred.");
            }
        }
    });
}

window.toggleVisibility = function (elementId) {
    $(elementId).toggleClass('d-none');
}

window.toggleExportOptions = function () {
    var exportOptionsButton = $("#exportOptionsButton");

    exportOptionsButton.text(exportOptionsButton.text() === 'Simple Export Options' ? 'Advanced Export Options' : 'Simple Export Options');
    toggleVisibility('#dynamicKeys');
    toggleVisibility('#advancedExportInput');

    var exportButton = $('#exportButton');
    exportButton.attr('onclick', (exportButton.attr('onclick') === 'exportSelectedDevicesAdvanced()' ? 'exportSelectedDevices()' : 'exportSelectedDevicesAdvanced()'));
}

window.showCreateDeviceModal = function () {
    $('#createDeviceModal').modal('show');
}

window.showPublishDeviceModal = function () {
    $('#publishDeviceModal').modal('show');
}

window.publishDevices = function () {
    var url = $('#urlInput').val();
    var username = $('#usernameInput').val();
    var password = $('#passwordInput').val();
    var deviceData = jsonDeviceArray;

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify({
            username: username,
            password: password,
            deviceData: deviceData
        }),
        contentType: 'application/json',
        success: function (res) {
            console.log("Success", res);
        },
        error: function (err) {
            console.error("Error", err);
        }
    });
}

//GLOBAL VARIABLES
var jsonDeviceArray = [];

//Template Input Visibility
var templateInputGroup = $('#templateInputGroup');
var templateInput = $('#templateInput');
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
        "LastCheckTimeMs": {{ model.last_check_time_ms }}
    }
    {{ if !for.last }},{{ end }}
{{ end }}
]`
);

var searchWordsArray = [];
//Initialize Tagify Filter
var inputBar = document.querySelector('#tagify-filter-bar'),

    // Initialize tagify to an object
    tagify = new Tagify(inputBar, {
        whitelist: extractStateUniqueWords(`[dataFilter]:visible`),
        placeholder: "Filter",
        enforceWhitelist: false
    });

tagify.on(`add`, onTagAdded);
tagify.on(`remove`, onTagRemoved);