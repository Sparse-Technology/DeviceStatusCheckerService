import "bootstrap/dist/css/bootstrap.min.css";
import "highlight.js/styles/intellij-light.css";
import { Tooltip, Toast, Popover } from "bootstrap";
import fontawesome from "@fortawesome/fontawesome-free/js/all.js";
import hljs from "highlight.js";
// import "@yaireo/tagify/dist/tagify.css";
// import Tagify from "@yaireo/tagify";
import { CustomTagify } from "./CustomTagify.js";
import { jsonrepair } from "jsonrepair";

console.log("DeviceManagement.js loaded");

export default class DeviceManagement {
    //GLOBAL VARIABLES
    #model = [];
    #containerId = "";
    #navbarContainer = $("<div>").attr("name", "navbar-container");
    #filterMenuContainer = $("<div>").attr(
        "data-name",
        "filter-menu-container"
    );
    #accordionMenuContainer = $("<div>").attr(
        "data-name",
        "accordion-menu-container"
    );

    #cameraCardsBodyContainer = $("<div>")
        .attr("id", "cameraCardsBody")
        .attr("data-name", "camera-cards-body-container")
        .addClass("container-fluid")
        .css({ "font-size": "small", "padding-top": "2rem" });

    //Behaviour global variables
    #jsonDeviceArray = [];
    #jsonStringCopy = "";
    #errorNotifColor = "#d72a6f";
    #successNotifColor = "#20ad6b";
    #neutralNotifColor = "#8f6ac4";

    //Filter Menu Variables
    #filterInput = $("<input>").attr({
        id: "tagify-filter-bar",
        type: "text",
        class: "form-control form-control-solid w-25",
        "aria-label": "",
    });

    //Accordion Menu Variables
    #accordionMenuButton = $("<button>")
        .addClass(
            "d-flex justify-content-center border-0 p-0 m-0 btn btn-primary"
        )
        .attr({
            type: "button",
            "data-bs-toggle": "collapse",
            "data-bs-target": "#exportAccordionBody",
            "aria-expanded": "true",
            "aria-controls": "exportAccordionBody",
        });

    #accordionBody = $("<div>").attr({
        id: "exportAccordionBody",
        class: "accordion-collapse collapse hide",
        "aria-labelledby": "headingOne",
        "data-bs-parent": "#accordionExample",
    });

    #dynamicKeysContainer = $("<div>")
        .attr("id", "dynamicKeys")
        .addClass("row g-2 p-3 col-6");

    #dynamicKeysContainerCheckboxes = this.#dynamicKeysContainer.find(
        'input[type="checkbox"]'
    );

    #codeForHighlightJs = $("<code>").attr({
        class: "language-json",
        style: "max-height:400px; overflow-y: auto;",
    });

    #isAdvancedExportMode = false;

    #exportButton = $("<button>")
        .attr({
            type: "submit",
            id: "exportButton",
            class: "btn btn-warning",
        })
        .html(
            '<i class="fa-solid fa-arrow-right-from-bracket"></i> Export Devices'
        );

    // Simple Export Input Container
    #templateInput = $("<textarea>").addClass("form-control").attr({
        placeholder: "Template",
        rows: "15",
    });

    // Advanced Export Input Container
    #advancedExportInputContainer = $("<div>").addClass(
        "d-none row g-2 p-2 col-6 mb-0 mt-0 p-0"
    );

    //CreateDeviceModal Elements
    #createDeviceModalContainer = $("<div>").addClass("modal fade").attr({
        // id: "createDeviceModal",
        tabindex: "-1",
        role: "dialog",
        "aria-labelledby": "exampleModalCenterTitle",
        "aria-hidden": "true",
        "data-name": "modal-create-device-container",
    });

    constructor(containerId, model) {
        this.#containerId = containerId;
        this.#model = model;
        this.initElements();
        this.initBehaviours();
        this.initDocumentReadyBehaviours();
        this.setupExportButtonMode();
    }
    //METHODS
    initElements() {
        this.createNavbarElements();
        this.createNotifElements();
        this.#filterMenuContainer.appendTo(`#${this.#containerId}`);
        this.createFilterElements();
        this.#accordionMenuContainer.appendTo(this.#filterMenuContainer);
        this.createAccordionMenuContainer();
        this.createAccordionBodyContainer();
        this.createCreateDeviceModalElements();
        // this.createPublishDeviceModal();
        this.createCameraCardsBody();

        //new CustomTagify(this.#filterInput, `[dataFilter]:visible`);
        new CustomTagify("#tagify-filter-bar", `[dataFilter]:visible`);
    }

    initBehaviours() {
        this.initCopyButtons();
        this.initializeTemplateInputValue();
    }

    //NAVBAR ELEMENTS CREATION
    createNavbarElements() {
        const self = this;
        // Navbar container
        this.#navbarContainer = $("<div>").attr(
            "data-name",
            "navbar-container"
        );

        // Navbar
        const navbar = $("<nav>").addClass(
            "navbar navbar-expand-lg navbar-dark bg-dark p-2"
        );

        // Navbar arrangement
        const navbarArrangement = $("<div>").addClass(
            "d-flex flex-row align-items-center justify-content-between me-2 ms-2 w-100"
        );

        // Brand
        const brandContainer = $("<div>").addClass(
            "fs-3 text-light navbar-brand"
        );

        const brandImage = $("<img>")
            .attr({
                src: "img/favicon.png",
                alt: "sparse-logo",
                width: "65px",
                height: "75px",
            })
            .on("click", () => this.refreshPage());

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
        $(`#${this.#containerId}`).append(this.#navbarContainer);
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
                                  (d) =>
                                      d.deviceActiveStatus ==
                                      statusStringInModel
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

    //NOTIF ELEMENTS CREATIONS
    //TODO: Creates notif elements
    createNotifElements() {
        const notifContainer = $("<div>")
            .addClass("d-flex justify-content-center")
            .attr("id", "notif");

        $(`#${this.#containerId}`).append(notifContainer);
    }

    //FILTER MENU ELEMENTS CREATIONS
    //TODO: Creates modals
    createFilterElements() {
        // Create main container
        const filterSubContainer = $("<div>")
            .addClass("d-flex flex-row justify-content-between p-2 ms-2 me-2")
            .attr("data-name", "tagify-menu-container");

        // Create Tagify Filter Bar with Button
        const filterBar = $("<div>").addClass("d-flex input-group w-50");

        // Create Tagify Filter Button
        const filterButton = $("<button>")
            .addClass("btn btn-outline-warning bg-gray p-2")
            .on("click", () => this.checkVisibleFilteredDevices())
            .html(
                `<i class="fa-regular fa-square-check fa-lg"></i> Select All`
            );

        // Create Reset Cameras Button
        const resetCamerasButton = $("<button>")
            .addClass("btn btn-outline-warning bg-gray p-2")
            .on("click", () => this.resetCameras())
            .html(
                `<i class="fa-regular fa-square-minus fa-lg"></i> Unselect All`
            );

        filterBar.append(this.#filterInput, filterButton, resetCamerasButton);

        // Add Tagify Filter Bar to the main container
        filterSubContainer.append(filterBar);

        // Add additional content (if any)
        const createDeviceModalContainerButton = $("<div>").html(
            $("<button>")
                .addClass("btn btn-dark")
                .on("click", () => this.showCreateDeviceModal())
                .text("Create Device")
        );

        filterSubContainer.append(createDeviceModalContainerButton);
        this.#filterMenuContainer.append(filterSubContainer);
    }

    //ACCORDION MENU ELEMENTS CREATION
    createAccordionMenuContainer() {
        // Create accordion header
        const accordionHeaderContainer = $("<div>")
            .addClass(
                "accordion-header-container d-flex justify-content-center"
            )
            .addClass(
                "bg-secondary border-bottom border-dark shadow p-2 mb-3 rounded"
            );

        const icon = $("<i>").addClass(
            "fas fa-chevron-down fa-xl bg-secondary p-0 border-0"
        );

        this.#accordionMenuButton.append(icon);
        accordionHeaderContainer.append(this.#accordionMenuButton);

        // Create accordion content
        this.#accordionMenuContainer.append(accordionHeaderContainer);
    }

    createAccordionBodyContainer() {
        // Main Card
        const mainCard = $("<div>").addClass("card bg-light");

        // Card Content Container
        const cardContentContainer = $("<div>").addClass(
            "d-flex flex-column mt-2 bg-light"
        );

        // Export Options Button
        const exportOptionsButton = $("<button>")
            .attr({
                type: "submit",
                class: "btn btn-outline-dark mb-2",
                id: "exportOptionsButton",
            })
            .html(
                '<i class="fa-solid fa-arrow-right-arrow-left"></i> Simple Export Options'
            )
            .on("click", this.toggleExportOptions.bind(this));

        cardContentContainer.append(exportOptionsButton);

        // Inner Container for Dynamic Keys and Buttons
        const innerContainer = $("<div>").addClass(
            "d-flex flex-row justify-content-between ms-2 me-2"
        );

        // Reset Buttons Container
        const resetInputsContainer = $("<div>").addClass(
            "d-flex justify-content-end mt-0 p-0 btn-group"
        );

        this.#dynamicKeysContainer.append(resetInputsContainer);

        // Reset Fields Button
        const resetFieldsButton = $("<button>")
            .attr({
                type: "submit",
                class: "btn btn-secondary bg-gray mb-2",
            })
            .html(
                '<i class="fa-solid fa-rectangle-list"></i> Reset Fields <i class="fa-solid fa-rotate-left"></i>'
            )
            .on("click", () => this.resetFields());

        // Toggle All Labels Button
        const selectAllLabelsButton = $("<button>")
            .attr({
                type: "submit",
                class: "btn btn-secondary bg-gray mb-2",
            })
            .html('<i class="fa-regular fa-square-check"></i> Select All')
            .on("click", () => this.selectLabels(true));

        // Toggle All Labels Button
        const unSelectAllLabelsButton = $("<button>")
            .attr({
                type: "submit",
                class: "btn btn-secondary bg-gray mb-2",
            })
            .html(
                `<i class="fa-regular fa-square-minus fa-lg"></i> Unselect All`
            )
            .on("click", () => this.selectLabels(false));

        resetInputsContainer.append(
            resetFieldsButton,
            selectAllLabelsButton,
            unSelectAllLabelsButton
        );

        // Dynamic Keys Property Creation
        // (Note: This part will depend on actual property names and may need adjustments)
        for (let property of Object.getOwnPropertyNames(jsonModel[0])) {
            const propertyColumn = $("<div>").addClass(
                "col-sm-12 col-xl-6 mb-1"
            );

            // Form a row with checkboxes, labels, and input fields
            const propertyRow = $("<div>").addClass("d-flex flex-row");

            // Checkbox
            const checkbox = $("<input>")
                .attr({
                    type: "checkbox",
                    class: "btn-check",
                    id: `btncheck_${property}`,
                    autocomplete: "off",
                })
                .on("click", this.toggleRenameKeys);

            // Label
            const label = $("<label>")
                .attr({
                    class: "btn btn-outline-secondary",
                    for: `btncheck_${property}`,
                })
                .text(property);

            // Input Field
            const inputField = $("<div>").addClass("input-group ms-2");
            const input = $("<input>").attr({
                id: `btnRenameInput_${property}`,
                type: "text",
                class: "form-control",
                "aria-label": "Property value",
                placeholder: property,
                disabled: true,
            });

            const resetInputElement = $("<button>")
                .attr({
                    type: "button",
                    class: "btn btn-outline-secondary",
                })
                .html('<i class="fa-solid fa-rotate-left"></i>')
                .on("click", () => this.resetInput(property));

            inputField.append(input, resetInputElement);

            propertyRow.append(
                checkbox,
                label,
                $("<div>").addClass("ms-2").html("<span>:</span>"),
                inputField
            );

            propertyColumn.append(propertyRow);
            this.#dynamicKeysContainer.append(propertyColumn);
        }

        const formForAdvancedExport = $("<form>").addClass("mt-0 p-0");

        const templateInputGroup = $("<div>").addClass("form-group");

        const templateInputButton = $("<button>")
            .attr({
                type: "submit",
                class: "btn mb-2 border-0",
                disabled: true,
            })
            .text("Input Template");

        templateInputGroup.append(templateInputButton, this.#templateInput);
        formForAdvancedExport.append(templateInputGroup);
        this.#advancedExportInputContainer.append(formForAdvancedExport);

        // Advanced Export Output Container
        const advancedExportOutputContainer = $("<div>")
            .attr("id", "advancedExportOutput")
            .addClass("row g-2 p-2 col-6 mb-0 mt-0 p-0");

        const formForAdvancedOutput = $("<form>").addClass("mt-0 p-0");

        const outputButtonGroup = $("<div>").addClass(
            "d-flex flew-row justify-content-between"
        );

        const outputButton = $("<button>")
            .attr({
                type: "button",
                class: "btn mb-2 border-0",
                disabled: true,
            })
            .text("Output");
        const buttonGroup = $("<div>").addClass("btn-group");

        const copyDevicesJSONButton = $("<button>")
            .attr({
                type: "button",
                class: "btn btn-outline-warning text-dark mb-2",
            })
            .html("Copy")
            .on("click", this.copyDevicesJSON.bind(this));

        //Will be reedited
        const publishButton = $("<button>")
            .attr({
                id: "publishButton",
                type: "button",
                class: "btn btn-outline-warning text-dark mb-2",
            })
            .html("Publish")
            .on("click", this.showPublishDeviceModal);

        const highlightJsContainer = $("<div>");

        const preElement = $("<pre>").addClass("language-json");

        this.#codeForHighlightJs.appendTo(preElement);

        preElement.css({
            "max-height": "400px",
            "overflow-y": "auto",
        });

        buttonGroup.append(copyDevicesJSONButton, publishButton);
        outputButtonGroup.append(outputButton, buttonGroup);
        formForAdvancedOutput.append(
            outputButtonGroup,
            highlightJsContainer.append(preElement)
        );
        advancedExportOutputContainer.append(formForAdvancedOutput);

        // Append all elements to the Accordion Body
        innerContainer.append(
            this.#dynamicKeysContainer,
            this.#advancedExportInputContainer,
            advancedExportOutputContainer
        );
        cardContentContainer.append(innerContainer);
        mainCard.append(cardContentContainer);
        this.#accordionBody.append(mainCard);

        // Export Button Container
        const exportButtonContainer = $("<div>").addClass(
            "d-flex justify-content-end mt-0 btn-group"
        );
        exportButtonContainer.append(this.#exportButton);

        // Append the Accordion Body to the desired container
        this.#accordionMenuContainer.append(
            this.#accordionBody,
            exportButtonContainer
        );
    }

    //Will be reedited
    createCreateDeviceModalElements() {
        // Modal Dialog
        const createDeviceModalDialog = $("<div>")
            .addClass("modal-dialog modal-dialog-centered")
            .attr("role", "document");

        // Modal Content
        const createDeviceModalContent = $("<div>").addClass("modal-content");

        // Modal Header
        const createDeviceModalHeader = $("<div>").addClass("modal-header");
        const createDeviceModalTitle = $("<h5>")
            .addClass("modal-title")
            .attr("id", "exampleModalLongTitle")
            .text("Create Device");
        createDeviceModalHeader.append(createDeviceModalTitle);

        // Modal Body
        const createDeviceModalBody = $("<div>")
            .addClass("modal-body")
            .attr("id", "modalCreateDeviceBody");
        const underConstruction = $("<div>").html(
            '<i class="fa-solid fa-person-digging fa-xl"></i> Under Construction'
        );
        createDeviceModalBody.append(underConstruction);

        // Modal Footer
        const createDeviceModalFooter = $("<div>").addClass("modal-footer");
        const buttonGroup = $("<div>");
        const closeButton = $("<button>")
            .addClass("btn btn-secondary")
            .attr({
                type: "button",
                "data-dismiss": "modalLabel",
            })
            .text("Close");
        const createDeviceButton = $("<button>")
            .addClass("btn btn-secondary")
            .attr("type", "button")
            .text("Create Device");

        buttonGroup.append(closeButton, createDeviceButton);
        createDeviceModalFooter.append(buttonGroup);

        // Assemble the modal structure
        createDeviceModalContent.append(
            createDeviceModalHeader,
            createDeviceModalBody,
            createDeviceModalFooter
        );
        createDeviceModalDialog.append(createDeviceModalContent);
        this.#createDeviceModalContainer.append(createDeviceModalDialog);

        // Append the modal container to the body
        this.#accordionMenuContainer.append(this.#createDeviceModalContainer);
    }

    //Will be reedited
    //   createPublishDeviceModal() {
    //     // Modal Container
    //     const modalContainer = $("<div>").addClass("modal fade").attr({
    //       id: "publishDeviceModal",
    //       tabindex: "-1",
    //       role: "dialog",
    //       "aria-labelledby": "exampleModalCenterTitle",
    //       "aria-hidden": "true",
    //       "data-name": "modal-publish-device-container",
    //     });

    //     // Modal Dialog
    //     const modalDialog = $("<div>")
    //       .addClass("modal-dialog modal-dialog-centered")
    //       .attr("role", "document");

    //     // Modal Content
    //     const modalContent = $("<div>").addClass("modal-content");

    //     // Modal Header
    //     const modalHeader = $("<div>").addClass("modal-header");
    //     const modalTitle = $("<h5>")
    //       .addClass("modal-title")
    //       .text("Publish Devices");
    //     modalHeader.append(modalTitle);

    //     // Modal Body
    //     const modalBody = $("<div>")
    //       .addClass("modal-body")
    //       .attr("id", "publishDeviceModalBody");
    //     const underConstruction = $("<div>").html(
    //       '<i class="fa-solid fa-person-digging fa-xl"></i> Under Construction'
    //     );

    //     // Form
    //     const form = $("<form>");

    //     // URL input
    //     const urlInput = $("<div>").addClass("mb-3");
    //     urlInput.append(
    //       $("<label>").addClass("form-label").attr("for", "urlInput").text("URL:")
    //     );
    //     urlInput.append(
    //       $("<input>").addClass("form-control").attr({
    //         type: "url",
    //         id: "urlInput",
    //         placeholder: "Enter URL",
    //       })
    //     );
    //     form.append(urlInput);

    //     // Username input
    //     const usernameInput = $("<div>").addClass("mb-3");
    //     usernameInput.append(
    //       $("<label>")
    //         .addClass("form-label")
    //         .attr("for", "usernameInput")
    //         .text("Username:")
    //     );
    //     usernameInput.append(
    //       $("<input>").addClass("form-control").attr({
    //         type: "text",
    //         id: "usernameInput",
    //         placeholder: "Enter username",
    //       })
    //     );
    //     form.append(usernameInput);

    //     // Password input
    //     const passwordInput = $("<div>").addClass("mb-3");
    //     passwordInput.append(
    //       $("<label>")
    //         .addClass("form-label")
    //         .attr("for", "passwordInput")
    //         .text("Password:")
    //     );
    //     passwordInput.append(
    //       $("<input>").addClass("form-control").attr({
    //         type: "password",
    //         id: "passwordInput",
    //         placeholder: "Enter password",
    //       })
    //     );
    //     form.append(passwordInput);

    //     modalBody.append(underConstruction, form);

    //     // Modal Footer
    //     const modalFooter = $("<div>").addClass("modal-footer");
    //     const buttonGroup = $("<div>");

    //     // Close Button
    //     const closeButton = $("<button>")
    //       .addClass("btn btn-secondary")
    //       .attr({
    //         type: "button",
    //         "data-dismiss": "modal",
    //       })
    //       .text("Close");

    //     // Publish Button
    //     const publishButton = $("<button>")
    //       .addClass("btn btn-warning")
    //       .attr("type", "button")
    //       .text("Publish")
    //       .on("click", publishDevices);

    //     publishButton.append(
    //       '<i class="fa-solid fa-arrow-right-from-bracket"></i>'
    //     );

    //     buttonGroup.append(closeButton, publishButton);
    //     modalFooter.append(buttonGroup);

    //     // Assemble the modal structure
    //     modalContent.append(modalHeader, modalBody, modalFooter);
    //     modalDialog.append(modalContent);
    //     modalContainer.append(modalDialog);

    //     // Append the modal container to the body
    //     this.#accordionMenuContainer.append(modalContainer);
    //   }

    //DEVICECARD CREATIONS
    //TODO: Creates a device status container

    //CAMERA CARD ELEMENTS CREATION
    createCameraCardsBody() {
        this.#cameraCardsBodyContainer.empty();

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

        const cameraContainer = $("<div>")
            .addClass("card d-flex flex-row justify-content-between")
            .attr("data-card", "camera-container");

        //Buradaki card-body div hiyerarşisini düzenlemeye gerek olabilir
        const cardBody = $("<div>").addClass("card-body");

        cardContainer.append(cameraContainer);

        cameraContainer.append(cardBody);

        cardBody
            .append(this.createDeviceThumbnail(dev))
            .append(this.createCardExportButton(dev))
            .append(this.createDeviceInfoContainer(dev));

        return cardContainer;
    }

    createDeviceInfoContainer(dev) {
        //Adding standart device info
        const deviceInfoContainer = $("<div>")
            .addClass("mt-2")
            .append($("<hr>").addClass("mt-0"))
            .append(
                this.createDeviceInfo(
                    "Last Checked: ",
                    dev.lastCheckTime.split(" ")[0]
                )
            )
            .append(this.createDeviceInfo(" ", dev.lastCheckTime.split(" ")[1]))
            .append(this.createDeviceInfo("#: ", dev.uuid))
            .append(this.createDeviceInfo("IP: ", dev.ip))
            .append(this.createDeviceInfo("Hostname: ", dev.hostname))
            .append(this.createDeviceInfo("Serial Number: ", dev.serialNumber))
            .append(this.createDeviceInfo("Friendly Name: ", dev.friendlyName))
            .append(this.createDeviceInfo("Manufacturer: ", dev.manufacturer))
            .append(this.createDeviceInfo("Model: ", dev.model))
            .append(
                this.createDeviceInfo("Location: ", dev.descriptionLocation)
            )
            .append(
                this.createDeviceInfo("Presentation URL: ", dev.presentationURL)
            )
            .append(this.createDeviceInfo("User: ", dev.user))
            .append(this.createDeviceInfo("Password: ", dev.password))
            .append(
                this.createDeviceInfo("Date Time Type: ", dev.dateTimeType)
            );

        //Adding NTP or Manual Date Time Info
        dev.dateTimeType === "NTP"
            ? deviceInfoContainer
                  .append(
                      this.createDeviceInfo(
                          "Daylight Savings",
                          dev.daylightSavings
                      )
                  )
                  .append(this.createDeviceInfo("Time Zone: ", dev.timeZone))
                  .append(
                      this.createDeviceInfo(
                          "UTC Time: ",
                          new Date(dev.utcDateTime)
                      )
                  )
                  .append(
                      this.createDeviceInfo(
                          "Local Time: ",
                          new Date(dev.localDateTime)
                      )
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
            this.createDeviceInfo("Status", dev.deviceActiveStatus).addClass(
                () => {
                    switch (dev.deviceActiveStatus.toLowerCase()) {
                        case "online":
                            return "text-success";
                        case "offline":
                            return "text-danger";
                        case "unknown":
                            return "text-warning";
                        default:
                            return "text-secondary";
                    }
                }
            )
        );

        //Adding Device Streams Info
        if (dev.streams && dev.streams.length > 0) {
            const streamSeparator = $("<hr>").addClass("m-0 mb-1 mt-1");
            deviceInfoContainer.append(streamSeparator);
            for (let i = 0; i < dev.streams.length; i++) {
                const streamInfo = this.createDeviceStreamInfo(
                    i,
                    dev.streams[i]
                );
                deviceInfoContainer.append(streamInfo);
            }
        }
        return deviceInfoContainer;
    }

    createDeviceThumbnail(dev) {
        const thumbnailContainer = $("<div>").addClass(
            "d-flex justify-content-between"
        );
        const imagePathRelative = `./thumbnails/${dev.uuid}/stream_0.jpeg`;

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

    createCardExportButton(dev) {
        const formCheck = $("<div>").addClass(
            "form-check align-self-end p-0 mt-2"
        );

        const checkbox = $("<input>").attr({
            type: "checkbox",
            class: "btn-check",
            id: `checkbox_${dev.uuid}`,
        });

        const exportIcon = $("<i>").addClass(
            "ms-2 fa-regular fa-square-plus text-secondary"
        );
        const label = $("<label>")
            .addClass(
                "form-check-label font-weight-bold text-dark btn btn-outline-warning col-12 m-0 p-0 text-center text-secondary"
            )
            .attr({
                for: `checkbox_${dev.uuid}`,
            })
            .html("Add Export")
            .append(exportIcon);

        formCheck.append(checkbox, label);
        return formCheck;
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
        const codecTypeLabel = $("<div>")
            .addClass("col-lg-4")
            .text("CodecType");
        const codecTypeValue = $("<div>")
            .addClass("col-lg-8")
            .text(stream?.codecType || "");
        codecTypeRow.append(codecTypeLabel, codecTypeValue);

        const resolutionRow = $("<div>").addClass("row");
        const resolutionLabel = $("<div>")
            .addClass("col-lg-4")
            .text("Resolution");
        const resolutionValue = $("<div>")
            .addClass("col-lg-8")
            .text(
                `[${stream?.resolution.width || 0} x ${
                    stream?.resolution.height || 0
                }]`
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

        streamContainer.append(
            streamNameRow,
            codecTypeRow,
            resolutionRow,
            uriRow
        );

        return streamContainer;
    }

    //BEHAVIOURS
    initDocumentReadyBehaviours() {
        var self = this;

        this.sortAndAppendContainers();

        this.#cameraCardsBodyContainer
            .find('.form-check input[type="checkbox"]')
            .on("change", function () {
                self.toggleExportMenuVisibility();
            });

        // Closing modals
        $('[data-dismiss="modalLabel"]').on("click", () => {
            $("#exportDeviceModal").modal("hide");
        });

        // Will be redited
        // $('[data-dismiss="modalcameraContainerCreateDevice"]').on("click", () => {
        //   this.#createDeviceModalContainer.modal("hide");
        // });

        //Publish part will be edited
        // $('[data-dismiss="modalPublishDevice"]').on("click", () => {
        //   $("#publishDeviceModal").modal("hide");
        // });
    }

    // TODO: Sorts the camera cards by height
    sortAndAppendContainers() {
        var containers = $('[data-card="container"]');
        containers.sort(function (a, b) {
            // Compare the heights of the camera containers in descending order
            var heightA = $(a).find('[data-card="camera-container"]').height();
            var heightB = $(b).find('[data-card="camera-container"]').height();
            return heightA - heightB;
        });

        // Append the sorted camera containers back to the parent containers with data-card="container"
        $("#sortedCameraCards").empty().append(containers);
    }

    //TODO: Controls the visibility of the export menu
    toggleExportMenuVisibility() {
        // Check if at least one checkbox is checked on the entire page
        var exportAccordionBody = $("#exportAccordionBody");

        var checkedCheckboxes = this.#cameraCardsBodyContainer.find(
            '.form-check input[type="checkbox"]:checked'
        );

        // Get numbers of checked EXPORT buttons in device bodies
        if (checkedCheckboxes.length > 0) {
            exportAccordionBody.collapse("show");
        } else {
            exportAccordionBody.collapse("hide");
        }
    }

    //FILTER BEHAVIOURS
    resetFields() {
        this.resetRenameInputs();
    }

    resetCheckboxes() {
        this.#dynamicKeysContainerCheckboxes
            .find('input[type="checkbox"]')
            .prop("checked", false)
            .change();
    }

    resetRenameInputs() {
        $("[id^=btnRenameInput_]").val(null).prop("disabled", true);
    }

    resetCameras() {
        this.#cameraCardsBodyContainer
            .find('.form-check input[type="checkbox"]')
            .prop("checked", false);
    }

    toggleRenameKeys() {
        var checkedLabels = $('#dynamicKeys input[type="checkbox"]');

        checkedLabels.each(function () {
            var propertyName = this.id.replace("btncheck_", "");

            // Finding specific inputs
            var btnRenameInput = $("#btnRenameInput_" + propertyName);

            // Toggle the disabled attribute based on the checkbox's checked status
            btnRenameInput.prop("disabled", !this.checked);
        });
    }

    toggleLabels(select) {
        const checkboxes = $('#dynamicKeys input[type="checkbox"]');
        checkboxes.prop("checked", select).change();
        const btnRenameInputs = $("[id^=btnRenameInput_]");
        select
            ? btnRenameInputs.prop("disabled", false)
            : btnRenameInputs.prop("disabled", true);
    }

    //TODO: Selects all the labels
    selectLabels(isSelected) {
        this.toggleLabels(isSelected);
    }

    //TODO: Reset the input field associated with the given property name to null.
    resetInput(propertyName) {
        var renameInputToReset = $("#btnRenameInput_" + propertyName);
        renameInputToReset.val(null);
    }

    //EXPORT BEHAVIOURS
    //TODO: Exports selected devices with simple options
    exportSelectedDevices() {
        var selectedCheckboxIds = [];
        this.#cameraCardsBodyContainer
            .find('.form-check input[type="checkbox"]')
            .each(function () {
                if ($(this).is(":checked")) {
                    selectedCheckboxIds.push(this.id.split("_")[1]);
                }
            });
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

                if (
                    btnRenameInputValue == null ||
                    btnRenameInputValue.trim() === ""
                ) {
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

        // const jsonDeviceArray = this.#jsonDeviceArray;

        $.ajax({
            url: `/Index?handler=ExportSelectedDevices&selectedCheckboxIdsParam=${btoa(
                JSON.stringify(selectedCheckboxIds)
            )}&selectedDynamicKeys=${selectedDynamicKeysParam}&renamedKeys=${renamedKeysParam}`,
            success: (result) => {
                // FORMATTING RESULT
                var untrailedString = removeTrailingComma(result.htmlContent);
                const correctedJsonString = untrailedString.replace(
                    /,(\s*})|},\s*\]/g,
                    (match, p1) => (p1 ? p1 : "}]")
                );

                this.#jsonDeviceArray = JSON.parse(correctedJsonString);

                var jsonString = JSON.stringify(this.#jsonDeviceArray, null, 2);
                // jsonString = jsonrepair(jsonString);
                this.#jsonStringCopy = jsonString;
                this.#codeForHighlightJs.removeAttr("data-highlighted");
                this.#codeForHighlightJs.html(jsonString);
                hljs.highlightElement(this.#codeForHighlightJs[0]);
                this.notificate(
                    "notif",
                    "Export successful.",
                    this.#successNotifColor
                );
            },
            error: (xhr, textStatus, errorThrown) => {
                console.error("Export error:", textStatus, errorThrown);

                if (xhr.responseJSON && xhr.responseJSON.error) {
                    this.notificate(
                        "notif",
                        "Export error: " + xhr.responseJSON.error,
                        this.#errorNotifColor
                    );
                } else {
                    this.notificate(
                        "notif",
                        "Export error occurred.",
                        this.#errorNotifColor
                    );
                }
            },
        });
    }

    //TODO:// Check all visible checkboxes within the camera cards body container.
    checkVisibleFilteredDevices() {
        this.#cameraCardsBodyContainer
            .find('.form-check input[type="checkbox"]:visible')
            .prop("checked", true);
    }

    //TODO: Exports selected devices with advanced options
    exportSelectedDevicesAdvanced() {
        var selectedCheckboxIds = [];
        this.#cameraCardsBodyContainer
            .find('.form-check input[type="checkbox"]')
            .each(function () {
                if ($(this).is(":checked")) {
                    selectedCheckboxIds.push(this.id.split("_")[1]);
                }
            });
        const userTemplate = this.#templateInput.val();
        const encodedTemplate = btoa(userTemplate);

        $.ajax({
            url: `/Index?handler=ExportSelectedDevicesAdvanced&tpl=${encodedTemplate}&selectedCheckboxIdsParam=${btoa(
                JSON.stringify(selectedCheckboxIds)
            )}`,
            contentType: "application/json",
            success: (result) => {
                this.#jsonDeviceArray = JSON.parse(result);
                var jsonString = JSON.stringify(this.#jsonDeviceArray, null, 2);

                this.#codeForHighlightJs.removeAttr("data-highlighted");
                this.#codeForHighlightJs.html(jsonString);
                this.#jsonStringCopy = jsonString;

                // You should use JS DOM selector not JQuery selector with highlight.js,
                hljs.highlightElement(this.#codeForHighlightJs[0]);
                this.notificate(
                    "notif",
                    "Export successful.",
                    this.#successNotifColor
                );
            },
            error: (xhr, textStatus, errorThrown) => {
                console.error("Export error:", textStatus, errorThrown);

                if (xhr.responseJSON && xhr.responseJSON.error) {
                    this.notificate(
                        "notif",
                        "Export error: " + xhr.responseJSON.error,
                        this.#errorNotifColor
                    );
                } else {
                    this.notificate(
                        "notif",
                        "Export error occurred.",
                        this.#errorNotifColor
                    );
                }
            },
        });
    }

    //NOTIFICATE BEHAVIOURS

    //TODO: Creates a notification
    notificate(elementId, notifText, hexColorCode) {
        var x = document.getElementById(elementId);
        x.textContent = notifText;
        x.style.backgroundColor = hexColorCode;
        x.className = "show";
        setTimeout(function () {
            x.className = x.className.replace("show", "");
        }, 2500);
    }

    //TODO:Toggle click behavior: Advanced or standard export based on current mode.
    toggleExportOptions() {
        this.#isAdvancedExportMode = !this.#isAdvancedExportMode;

        this.setupExportButtonMode();
        var exportOptionsButton = $("#exportOptionsButton");
        exportOptionsButton.text(
            exportOptionsButton.text() === "Simple Export Options"
                ? "Simple Export Options"
                : "Advanced Export Options"
        );
        this.#dynamicKeysContainer.toggleClass("d-none");
        this.#advancedExportInputContainer.toggleClass("d-none");
    }

    //TODO:Toggle click behavior: Advanced or standard export based on current mode.
    setupExportButtonMode() {
        this.#exportButton.off("click");

        this.#exportButton.on("click", () => {
            this.#isAdvancedExportMode
                ? this.exportSelectedDevicesAdvanced()
                : this.exportSelectedDevices();
        });
    }

    showCreateDeviceModal() {
        this.#createDeviceModalContainer.modal("show");
    }

    showPublishDeviceModal() {
        $("#publishDeviceModal").modal("show");
    }

    //TODO: Publish part will be edited
    publishDevices() {
        var url = $("#urlInput").val();
        var username = $("#usernameInput").val();
        var password = $("#passwordInput").val();
        var deviceData = this.jsonDeviceArray;

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
                this.notificate(
                    "notif",
                    "Publish successful.",
                    this.#successNotifColor
                );
            },
            error: function (err) {
                console.error("Error", err);
                this.notificate(
                    "notif",
                    "Publish error.",
                    this.#errorNotifColor
                );
            },
        });
    }

    //TODO: Adds scriban template to the input field
    initializeTemplateInputValue() {
        this.#templateInput.val(
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
    }

    //COPY BEHAVIOURS
    //TODO:Copies the result of the export to the clipboard
    copyDevicesJSON() {
        if (!this.#jsonStringCopy || this.#jsonStringCopy.trim() === "") {
            this.notificate(
                "notif",
                "No content to copy",
                this.#neutralNotifColor
            );
            return;
        }

        // Navigator clipboard api needs a secure context (https)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard
                .writeText(this.#jsonStringCopy)
                .then(() => {
                    this.notificate("notif", "Copied", this.#successNotifColor);
                })
                .catch((error) => {
                    self.notificate(
                        "notif",
                        "Unable to copy the content",
                        this.#errorNotifColor
                    );
                });
        } else {
            // Use the 'out of viewport hidden text area' trick
            const textArea = document.createElement("textarea");
            textArea.value = this.#jsonStringCopy;

            // Move textarea out of the viewport so it's not visible
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";

            document.body.prepend(textArea);
            textArea.select();

            try {
                document.execCommand("copy");
                notificate("notif", "Copied", this.#successNotifColor);
            } catch (error) {
                console.error(error);
            } finally {
                textArea.remove();
            }
        }
    }

    //TODO:Copies the stream uri to the clipboard onclick
    initCopyButtons() {
        document.querySelectorAll("[data-stream]").forEach((button) => {
            button.addEventListener("click", () => {
                const streamData = button.getAttribute("data-stream");
                navigator.clipboard
                    .writeText(streamData)
                    .then(() =>
                        this.notificate(
                            "notif",
                            "Copied",
                            this.#successNotifColor
                        )
                    )
                    .catch((error) => console.log(error));
            });
        });
    }

    //NOTIFICATE BEHAVIOURS
    notificate(elementId, notifText, hexColorCode) {
        var x = document.getElementById(elementId);
        x.textContent = notifText;
        x.style.backgroundColor = hexColorCode;
        x.className = "show";
        setTimeout(function () {
            x.className = x.className.replace("show", "");
        }, 2500);
    }
}

// export class CustomTagify {
//     constructor(inputTargetSelector, searchedElementsSelector) {
//         this.inputTargetSelector = inputTargetSelector;
//         this.searchWordsArray = [];
//         this.searchedElementsSelector = searchedElementsSelector;

//         var inputBar = document.querySelector(inputTargetSelector),
//             // Initialize tagify to an object
//             tagify = new Tagify(inputBar, {
//                 whitelist: this.extractStateUniqueWords(
//                     searchedElementsSelector
//                 ),
//                 placeholder: "Filter",
//                 enforceWhitelist: false,
//             });

//         this.tagify = tagify; // Assign tagify to the instance property

//         this.tagify.on(`add`, this.onTagAdded.bind(this));
//         this.tagify.on(`remove`, this.onTagRemoved.bind(this));

//         // Change here: Use a regular function instead of an arrow function
//         inputBar.addEventListener(
//             "keyup",
//             function () {
//                 this.filterPageTagify(
//                     inputBar.value,
//                     '[data-card="container"]:visible'
//                 );
//             }.bind(this)
//         );
//     }

//     extractStateUniqueWords(searchedElementsSelector) {
//         var words = new Set();
//         $(searchedElementsSelector).each(function () {
//             var dataFilterText = $(this).text().toLowerCase().trim();
//             words.add(dataFilterText);
//         });
//         return Array.from(words);
//     }

//     filterPageTagify(filterString, selector) {
//         var filter = filterString.toLowerCase();
//         console.log(filter);

//         if (filter.length <= 1 && filter.length > 0) {
//             return;
//         } else {
//             $(selector).filter(function () {
//                 $(this).toggle($(this).text().toLowerCase().includes(filter));
//             });
//         }
//     }

//     onTagAdded(e) {
//         const addedTag = e.detail.data.value;
//         this.searchWordsArray.push(addedTag);

//         this.searchWordsArray.forEach((filterString) =>
//             this.filterPageTagify(
//                 filterString,
//                 '[data-card="container"]:visible'
//             )
//         );

//         this.tagify.whitelist = this.extractStateUniqueWords(
//             this.searchedElementsSelector
//         );
//     }

//     onTagRemoved(e) {
//         const removedTag = e.detail.data.value;

//         const index = this.searchWordsArray.findIndex(
//             (tag) => tag === removedTag
//         );

//         if (index !== -1) {
//             this.searchWordsArray.splice(index, 1);
//         }

//         if (this.searchWordsArray.length === 0) {
//             $('[data-card="container"]').show();
//         } else {
//             this.searchWordsArray.forEach((filterString) =>
//                 this.filterPageTagify(filterString, '[data-card="container"]')
//             );
//         }

//         this.tagify.whitelist = this.extractStateUniqueWords(
//             this.searchedElementsSelector
//         );
//     }
// }
