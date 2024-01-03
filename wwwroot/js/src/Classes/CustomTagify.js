import "@yaireo/tagify/dist/tagify.css";
import Tagify from "@yaireo/tagify";

class CustomTagify {
  constructor(
    inputTargetSelector,
    searchedElementsSelector,
    targetElementSelector
  ) {
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

export { CustomTagify };
