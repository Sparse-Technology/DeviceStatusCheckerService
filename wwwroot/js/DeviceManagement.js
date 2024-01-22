//import "bootstrap/dist/css/bootstrap.min.css";
//import "highlight.js/styles/intellij-light.css";
//import { Tooltip, Toast, Popover } from "bootstrap";
//import fontawesome from "@fortawesome/fontawesome-free/js/all.js";
//import { CustomTagify } from "./Classes/CustomTagify";
//import hljs from "highlight.js";
//import { jsonrepair } from "jsonrepair";

class DeviceManagement {
  //GLOBAL VARIABLES
  #model = [];
  #containerId = "";
  #navbarContainer = $("<div>").attr("name", "navbar-container");
  #filterMenuContainer = $("<div>").attr("data-name", "filter-menu-container");
  #cameraCardsBodyContainer = "";
  #jsonDeviceArray = [];
  #jsonStringCopy = "";
  #errorNotifColor = "#d72a6f";
  #successNotifColor = "#20ad6b";
  #neutralNotifColor = "#8f6ac4";

  constructor(containerId, model) {
    this.#containerId = containerId;
    this.#model = model;
    console.log(this.#containerId);
    console.log(this.#model);
    this.init();
  }
  //METHODS
  init() {
    this.createNavbarElements();
    this.createNotifElements();
    this.createFilterElements();

    this.createCameraCardsBody();

    const customTagify = new CustomTagify(
      "#tagify-filter-bar",
      `[dataFilter]:visible`
    );
  }

  //__________________________________________________________________________________________________

  //NAVBAR ELEMENT CREATION
  createNavbarElements() {
    console.log("createNavbarElements started");
    const self = this;
    // Navbar container
    this.#navbarContainer = $("<div>").attr("data-name", "navbar-container");

    // Navbar
    const navbar = $("<nav>").addClass(
      "navbar navbar-expand-lg navbar-dark bg-dark p-2"
    );

    // Navbar arrangement
    const navbarArrangement = $("<div>").addClass(
      "d-flex flex-row align-items-center justify-content-between me-2 ms-2 w-100"
    );

    // Brand
    const brandContainer = $("<div>").addClass("fs-3 text-light navbar-brand");

    const brandImage = $("<img>").attr({
      src: "img/favicon.png",
      alt: "sparse-logo",
      width: "65px",
      height: "75px",
    });

    const brandLink = $("<a>")
      .addClass("navbar-brand custom-navbar-brand")
      .attr("href", "#") // Replace "#" with the actual URL or use "javascript:void(0);" if it's just a placeholder
      .text("Device Monitoring")
      .on("click", this.refreshPage);

    brandContainer.append(brandImage, brandLink);

    // Device Status Navbar
    const deviceStatusNavbar = $("<div>").addClass(
      "d-flex flex-row text-light justify-content-end align-items-center flex-wrap"
    );

    // Device Online
    const deviceOnlineContainer = $("<div>").addClass("fs-5 me-4 mb-2");

    // Append everything to the respective parent elements
    deviceStatusNavbar.append(
      this.deviceStatusCreator(
        "ONLINE",
        "Available: ",
        "text-success",
        "bg-success"
      ),
      this.deviceStatusCreator(
        "OFFLINE",
        "Unavailable: ",
        "text-danger",
        "bg-danger"
      ),
      this.deviceStatusCreator(
        "UNKNOWN",
        "In Progress: ",
        "text-warning",
        "bg-warning"
      ),
      this.deviceStatusCreator("TOTAL", "Total: ", "text-info", "bg-info")
    );

    navbarArrangement.append(brandContainer, deviceStatusNavbar);
    navbar.append(navbarArrangement);
    this.#navbarContainer.append(navbar);

    // Append the whole navbarContainer to the specified container in your HTML
    $(`#${this.#containerId}`)
      .append(this.#navbarContainer)
      .append(deviceOnlineContainer);
  }

  deviceStatusCreator(
    statusStringInModel,
    statusStringInDisplay,
    textColorClass,
    backgroundColorClass
  ) {
    const deviceStatusContainer = $("<div>").addClass("fs-5 me-4 mb-2");

    deviceStatusContainer.append(
      $("<span>")
        .addClass(`${textColorClass} fw-bold`)
        .text(statusStringInDisplay),
      $("<span>")
        .addClass("badge")
        .addClass(backgroundColorClass)
        .text(
          `${
            statusStringInModel == "TOTAL"
              ? this.#model.length
              : this.#model.filter(
                  (d) => d.deviceActiveStatus == statusStringInModel
                ).length
          }`
        )
    );
    return deviceStatusContainer;
  }
  //TODO: Refreshes page
  refreshPage = () => {
    location.reload(true);
  };

  //__________________________________________________________________________________________________
  //NOTIF CREATIONS
  //TODO: Creates notif elements
  createNotifElements() {
    const notifContainer = $("<div>")
      .addClass("d-flex justify-content-center")
      .attr("id", "notif");
    return notifContainer;
  }

  //__________________________________________________________________________________________________
  //FILTER MENU AND MODAL CREATIONS
  //TODO: Creates modals
  createFilterElements() {
    // Create main container
    const filterSubContainer = $("<div>")
      .addClass("d-flex flex-row justify-content-between p-2 ms-2 me-2")
      .attr("data-name", "tagify-menu-container");

    // Create Tagify Filter Bar with Button
    const filterBar = $("<div>").addClass("d-flex input-group w-50");
    const filterInput = $("<input>")
      .attr({
        id: "tagify-filter-bar",
        type: "text",
        class: "form-control form-control-solid w-25",
        "aria-label": "",
      })
      .on("keyup", this.filterPageTagify);

    // Create Tagify Filter Button
    const filterButton = $("<button>")
      .addClass("btn btn-outline-warning bg-gray p-2")
      .on("click", this.checkVisibleFilteredDevices)
      .html(`<i class="fa-regular fa-square-check fa-lg"></i> Select All`);

    // Create Reset Cameras Button
    const resetButton = $("<button>")
      .addClass("btn btn-outline-warning bg-gray p-2")
      .on("click", this.resetCameras)
      .html(`<i class="fa-regular fa-square-minus fa-lg"></i> Unselect All`);

    filterBar.append(filterInput, filterButton, resetButton);

    // Add Tagify Filter Bar to the main container
    filterSubContainer.append(filterBar);

    // Add additional content (if any)
    const createDeviceModalContainer = $("<div>").html(
      `<button class="btn btn-dark" onclick="showCreateDeviceModal()">Create Device</button>`
    );
    filterSubContainer.append(createDeviceModalContainer);

    this.#filterMenuContainer.filterSubContainer;

    $(`#${this.#containerId}`).append(filterSubContainer);
  }

  //__________________________________________________________________________________________________
  //DEVICECARD CREATIONS
  //TODO: Creates a device status container

  createCameraCardsBody() {
    this.#cameraCardsBodyContainer = $("<div>")
      .attr("id", "cameraCardsBody")
      .attr("data-name", "camera-cards-body-container")
      .addClass("container-fluid")
      .css({ "font-size": "small", "padding-top": "2rem" });

    // this.#cameraCardsBodyContainer.empty();

    const sortedCameraCards = $("<div>")
      .attr("id", "sortedCameraCards")
      .addClass("d-flex flex-wrap card-body");

    this.#cameraCardsBodyContainer.append(sortedCameraCards);

    const sortedModel = this.#model.sort(
      (a, b) => a.deviceActiveStatus - b.deviceActiveStatus
    );

    sortedModel.forEach((dev) => {
      var createdDeviceCard = this.createDeviceCards(dev);
      sortedCameraCards.append(createdDeviceCard);
    });

    $(`#${this.#containerId}`).append(this.#cameraCardsBodyContainer);
  }

  createDeviceCards(dev) {
    //Card container to tagify filter
    const cardContainer = $("<div>")
      .addClass("col-sm-6 col-md-6 col-lg-4 col-xl-4 p-1")
      .attr("data-card", "container");

    const cameraContainer = $("<div>").addClass(
      "card d-flex flex-row justify-content-between"
    );

    //Buradaki card-body div hiyerarşisini düzenlemeye gerek olabilir
    const cardBody = $("<div>").addClass("card-body");

    cardContainer.append(cameraContainer);

    cameraContainer.append(cardBody);

    cardBody
      .append(this.createDeviceThumbnail(dev))
      .append(this.createDeviceInfoContainer(dev));

    return cardContainer;
  }

  createDeviceInfoContainer(dev) {
    //Adding standart device info
    const deviceInfoContainer = $("<div>")
      .addClass("mt-2")
      .append($("<hr>").addClass("mt-0"))
      .append(
        this.createDeviceInfo("Last Checked: ", dev.lastCheckTime.split(" ")[0])
      )
      .append(this.createDeviceInfo(" ", dev.lastCheckTime.split(" ")[1]))
      .append(this.createDeviceInfo("#: ", dev.uuid))
      .append(this.createDeviceInfo("IP: ", dev.ip))
      .append(this.createDeviceInfo("Hostname: ", dev.hostname))
      .append(this.createDeviceInfo("Serial Number: ", dev.serialNumber))
      .append(this.createDeviceInfo("Friendly Name: ", dev.friendlyName))
      .append(this.createDeviceInfo("Model: ", dev.model))
      .append(this.createDeviceInfo("Location: ", dev.descriptionLocation))
      .append(this.createDeviceInfo("Presentation URL: ", dev.presentationURL))
      .append(this.createDeviceInfo("User: ", dev.user))
      .append(this.createDeviceInfo("Password: ", dev.password))
      .append(this.createDeviceInfo("Date Time Type: ", dev.dateTimeType));

    //Adding NTP or Manual Date Time Info
    dev.dateTimeType === "NTP"
      ? deviceInfoContainer
          .append(
            this.createDeviceInfo("Daylight Savings", dev.daylightSavings)
          )
          .append(this.createDeviceInfo("Time Zone: ", dev.timeZone))
          .append(
            this.createDeviceInfo("UTC Time: ", new Date(dev.utcDateTime))
          )
          .append(
            this.createDeviceInfo("Local Time: ", new Date(dev.localDateTime))
          )
      : null;

    //Adding Notes Info
    deviceInfoContainer.append(
      this.createDeviceInfo("Notes", dev.notes).addClass(
        dev.notes.toLowerCase().includes("discovered")
          ? "text-success"
          : dev.notes.toLowerCase().includes("static")
            ? "text-danger"
            : ""
      )
    );

    //Adding Device Status Info
    deviceInfoContainer.append(
      this.createDeviceInfo("Status", dev.deviceActiveStatus).addClass(() => {
        switch (dev.deviceActiveStatus.toLowerCase()) {
          case "online":
            return "text-success";
          case "offline":
            return "text-danger";
          case "unknown":
            return "text-warning";
          default:
            return "tex-secondary";
        }
      })
    );

    //Adding Device Streams Info
    if (dev.streams && dev.streams.length > 0) {
      const streamSeparator = $("<hr>").addClass("m-0 mb-1 mt-1");
      deviceInfoContainer.append(streamSeparator);
      for (let i = 0; i < dev.streams.length; i++) {
        const streamInfo = this.createDeviceStreamInfo(i, dev.streams[i]);
        deviceInfoContainer.append(streamInfo);
      }
    }

    return deviceInfoContainer;
  }

  createDeviceThumbnail(dev) {
    const thumbnailContainer = $("<div>").addClass(
      "d-flex justify-content-between"
    );
    const imagePathRelative = `./thumbnails/${dev.uuid}/stream_0__1.jpeg`;

    const thumbnailImage = $("<img>")
      .attr({
        src: imagePathRelative,
        onerror:
          "this.onerror=null;this.src='/img/img_camera-thumbnail-resized.jpg';",
      })
      .addClass("img-thumbnail card-img-left p-0")
      .css({
        width: "270px !important",
        height: "152px !important",
      });

    thumbnailContainer.append(thumbnailImage);
    return thumbnailContainer;
  }

  createDeviceInfo(devicePropertyLabel, devicePropertyValue) {
    const subDeviceInfoContainer = $("<div>").addClass("row");

    if (devicePropertyValue != null && devicePropertyValue !== "") {
      const propertyLabel = $("<div>")
        .addClass("col-lg-4 fw-semibold text-muted")
        .text(devicePropertyLabel);

      const propertyValue = $("<div>")
        .addClass("col-lg-8 fw-bold")
        .attr("dataFilter", devicePropertyValue)
        .text(devicePropertyValue);

      subDeviceInfoContainer.append(propertyLabel);
      subDeviceInfoContainer.append(propertyValue);

      return subDeviceInfoContainer;
    } else {
      return null;
    }
  }

  createDeviceStreamInfo(streamIndex, stream) {
    const streamContainer = $("<div>").addClass("row");

    const streamNameRow = $("<div>").addClass("row");
    const streamNameLabel = $("<div>")
      .addClass("col-lg-4 fw-bold text-muted")
      .text(`Stream ${streamIndex}`);
    const streamNameValue = $("<div>")
      .addClass("col-lg-8 fw-bold text-muted text-decoration-underline")
      .text(stream?.name || "");
    streamNameRow.append(streamNameLabel, streamNameValue);

    const codecTypeRow = $("<div>").addClass("row");
    const codecTypeLabel = $("<div>").addClass("col-lg-4").text("CodecType");
    const codecTypeValue = $("<div>")
      .addClass("col-lg-8")
      .text(stream?.codecType || "");
    codecTypeRow.append(codecTypeLabel, codecTypeValue);

    const resolutionRow = $("<div>").addClass("row");
    const resolutionLabel = $("<div>").addClass("col-lg-4").text("Resolution");
    const resolutionValue = $("<div>")
      .addClass("col-lg-8")
      .text(
        `[${stream?.resolution.width || 0} x ${stream?.resolution.height || 0}]`
      );
    resolutionRow.append(resolutionLabel, resolutionValue);

    const uriRow = $("<div>").addClass("row");
    try {
      const status = stream?.status;
      const uriLabel = $("<div>").addClass("col-lg-4").text("URI");
      let uriContainer;

      switch (status) {
        case "OK":
          uriContainer = $("<div>")
            .addClass("col-lg-8")
            .append(
              $("<a>")
                .addClass("btn btn-sm badge bg-success")
                .attr("data-stream", stream?.uri || "")
                .attr("style", "white-space: unset !important;")
                .attr("data-toggle", "tooltip")
                .text(stream?.uri || "")
            );
          break;
        case "ERROR":
          uriContainer = $("<div>")
            .addClass("col-lg-8")
            .append(
              $("<a>")
                .addClass("btn btn-sm badge bg-danger")
                .attr("data-stream", stream?.uri || "")
                .attr("style", "white-space: unset !important;")
                .text(stream?.uri || "")
            );
          break;
        default:
          uriContainer = $("<div>")
            .addClass("col-lg-8")
            .append(
              $("<a>")
                .addClass("btn btn-sm badge bg-warning")
                .attr("data-stream", stream?.uri || "")
                .attr("style", "white-space: unset !important;")
                .text(stream?.uri || "")
            );
          break;
      }

      uriRow.append(uriLabel, uriContainer);
    } catch (error) {}

    streamContainer.append(streamNameRow, codecTypeRow, resolutionRow, uriRow);

    return streamContainer;
  }
}

class CustomTagify {
  constructor(inputTargetSelector, searchedElementsSelector) {
    this.inputTargetSelector = inputTargetSelector;
    this.searchWordsArray = [];
    this.searchedElementsSelector = searchedElementsSelector;

    var inputBar = document.querySelector(inputTargetSelector),
      // Initialize tagify to an object
      tagify = new Tagify(inputBar, {
        whitelist: this.extractStateUniqueWords(searchedElementsSelector),
        placeholder: "Filter",
        enforceWhitelist: false,
      });

    this.tagify = tagify; // Assign tagify to the instance property

    this.tagify.on(`add`, this.onTagAdded.bind(this));
    this.tagify.on(`remove`, this.onTagRemoved.bind(this));
  }

  extractStateUniqueWords(searchedElementsSelector) {
    var words = new Set();
    $(searchedElementsSelector).each(function () {
      var dataFilterText = $(this).text().toLowerCase().trim();
      words.add(dataFilterText);
    });
    return Array.from(words);
  }

  filterPageTagify(filterString, selector) {
    var filter = filterString.toLowerCase();
    // console.log(filter);

    if (filter.length <= 1 && filter.length > 0) {
      return;
    } else {
      $(selector).filter(function () {
        $(this).toggle($(this).text().toLowerCase().includes(filter));
      });
    }
  }

  onTagAdded(e) {
    const addedTag = e.detail.data.value;
    this.searchWordsArray.push(addedTag);
    console.log(this.searchWordsArray);

    this.searchWordsArray.forEach((filterString) =>
      this.filterPageTagify(filterString, '[data-card="container"]:visible')
    );

    this.tagify.whitelist = this.extractStateUniqueWords(
      this.searchedElementsSelector
    );
  }

  onTagRemoved(e) {
    const removedTag = e.detail.data.value;

    const index = this.searchWordsArray.findIndex((tag) => tag === removedTag);
    console.log(this.searchWordsArray);

    if (index !== -1) {
      this.searchWordsArray.splice(index, 1);
    }

    if (this.searchWordsArray.length === 0) {
      $('[data-card="container"]').show();
    } else {
      this.searchWordsArray.forEach((filterString) =>
        this.filterPageTagify(filterString, '[data-card="container"]')
      );
    }

    this.tagify.whitelist = this.extractStateUniqueWords(
      this.searchedElementsSelector
    );
  }
}
