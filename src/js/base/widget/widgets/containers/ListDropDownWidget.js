/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

/**
 * @callback ListDropDownItemRenderer
 * @param {string[]} model splitted string model
 * @param {Object} item the object value
 * @return {string} rendered html
 */

/**
 * @typedef {Object} ListDropDownWidgetItem
 * @property {string} text
 * @property {string} value
 */

modulum('ListDropDownWidget', ['DropDownWidget', 'WidgetFactory'],
  function(context, cls) {
    /**
     * List Drop Down Widget.
     * The values of this widget is meant to be controlled by another widget.
     * @class ListDropDownWidget
     * @memberOf classes
     * @extends classes.DropDownWidget
     */
    cls.ListDropDownWidget = context.oo.Class(cls.DropDownWidget, function($super) {
      return /** @lends classes.ListDropDownWidget.prototype */ {
        /** @lends classes.ListDropDownWidget */
        $static: {
          /**
           *
           * @private
           */
          _defaultItemRenderer: null,
          /**
           * Produces the default item renderer
           * @todo : See if it's possible to refactor and remove all this special renderer system. And just compose a widget
           * @return {ListDropDownItemRenderer}
           */
          getDefaultItemRenderer: function() {
            if (!cls.ListDropDownWidget._defaultItemRenderer) {
              const uiModel = context.TemplateService.renderDOM(
                cls.CheckBoxWidget.prototype.__name,
                cls.CheckBoxWidget.prototype.__ascendance
              );
              uiModel.className += " " + cls.CheckBoxWidget.prototype.__ascendanceClasses;
              uiModel.addClass("gbc_ListDropDownWidget_item");
              uiModel.setAttribute("combovalue", "#$value#");
              const labelElement = document.createElement('div');
              labelElement.addClass('label');
              labelElement.textContent = "#$text#";
              uiModel.getElementsByClassName('content')[0].appendChild(labelElement);
              const model = uiModel.outerHTML.split("#");
              cls.ListDropDownWidget._defaultItemRenderer = function(model, item) {
                let result = "";
                for (const element of model) {
                  // escape HTML conflicting chars such as quote and double-quotes before adding it in the DOM
                  result += element[0] === "$" ? (item[element.substr(1)].escapeHTML() || "") : element;
                }
                return result;
              }.bind(null, model);
            }
            return cls.ListDropDownWidget._defaultItemRenderer;
          }
        },

        __name: "ListDropDownWidget",
        __templateName: "DropDownWidget",
        /**
         * @inheritDoc
         */
        autoSize: true,
        /**
         * whether or not this list will allow multiple value selection
         * @type {boolean}
         */
        _allowMultipleValues: false,
        /**
         * whether or not this list will allow null value
         * @type {boolean}
         */
        _notNull: false,
        /**
         * current items - raw data
         * @type {Object[]}
         */
        _items: null,

        /**
         * currently highlighted element
         * @type {number}
         */
        _currentIndex: -1,

        /** Last selected item index */
        _lastSelectedValueIndex: -1,
        /**
         * currently set value
         * @type {string[]}
         */
        _selectedValues: null,

        /**
         * item renderer
         * @type {ListDropDownItemRenderer}
         */
        _itemRenderer: null,

        /** styles */
        _cssSelector: ".gbc_ListDropDownWidget_item",

        /**
         * @inheritdoc
         */
        constructor: function(opts) {
          this._selectedValues = [];
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._removeHoverBindings();
          this._items.length = 0;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);

          this._items = [];
          this._itemRenderer = cls.ListDropDownWidget.getDefaultItemRenderer();

          this.onOpen(this._addHoverBindings.bind(this));
          this.onClose(this._removeHoverBindings.bind(this));

          this._updateVisualElementState();
        },

        /**
         * Bind dropdown items hover styling events
         * @private
         */
        _addHoverBindings: function() {
          if (!window.isMobile()) {
            this._containerElement.on('mouseover.ListDropDownWidget', this._onMouseover.bind(this));
          }
        },

        /**
         * Remove dropdown items hover styling events
         * @private
         */
        _removeHoverBindings: function() {
          if (!window.isMobile()) {
            this._containerElement.off('mouseover.ListDropDownWidget');
          }
        },

        /**
         * Set the available items
         * @param {ListDropDownWidgetItem[]} list items
         */
        setItems: function(list) {
          this._items = [];
          list.map((element) => {
            this.getItems().push({
              text: element.text,
              value: element.value,
              searchText: element.text.toLocaleLowerCase(),
              nullItem: element.nullItem,
              virtualItem: false,
              searchPattern: ""
            });
          });

          this.updateUIList();
        },

        /**
         * Get the items
         * @return {ListDropDownWidgetItem[]} list items
         */
        getItems: function() {
          return this._items;
        },

        /**
         * refresh DOM list
         * @todo : Refactor and optimise me please ! I do way too many useless operations
         * Put the null checking part inside the setItems method !
         */
        updateUIList: function() {
          let hasNull = false,
            hasNotNull = false;

          const content = [];

          const isConstruct = this.getParentWidget().getDialogType() === 'Construct',
            isNullText = `＜${i18next.t('gwc.main.combobox.isnull', 'blank')}＞`,
            isNotNullText = `＜${i18next.t('gwc.main.combobox.isnotnull', 'not blank')}＞`;

          this._items = this._items.filter(function(i) {
            return !i.virtualItem;
          });

          for (const item of this.getItems()) {
            // @short-circuit  use compact version instead : hasNull ||= isConstruct && item.value === "=";
            if (!hasNull) {
              hasNull = isConstruct && item.value === "=";
            }
            // @short-circuit : use shorthand instead : hasNotNull ||= isConstruct && item.value.match(/!=|<>/);
            if (!hasNotNull) {
              hasNotNull = isConstruct && item.value.match(/!=|<>/);
            }

            if (!hasNull && item.nullItem) {
              item.value = isConstruct ? "=" : "";
              item.text = isConstruct && item.text === "" ? isNullText : item.text;
              item.searchText = item.text.toLocaleLowerCase().escapeHTML();
              hasNull = true;
            }

            item.searchPattern = this._buildItemRegex(item.value, item.text);

            content.push(this._itemRenderer(item));
          }

          if (!this._notNull) {
            let needMeasure = false;
            if (!hasNull) {
              this._items.push({
                text: isConstruct ? isNullText.escapeHTML() : "",
                value: isConstruct ? "=" : "",
                searchText: isConstruct ? isNullText.replace(/[<>]/g, "") : "",
                nullItem: true,
                virtualItem: true,
                searchPattern: this._buildItemRegex(isConstruct ? "=" : "", isConstruct ? isNullText.escapeHTML() : "")
              });

              content.push(this._itemRenderer(this._items[this._items.length - 1]));

              needMeasure = true;
            }

            if (!hasNotNull && isConstruct) {
              this._items.push({
                text: isNotNullText.escapeHTML(),
                value: "!=",
                searchText: isNotNullText.replace(/[<>]/g, ""),
                nullItem: false,
                virtualItem: true,
                searchPattern: this._buildItemRegex("!=", isNotNullText.escapeHTML())
              });

              content.push(this._itemRenderer(this._items[this._items.length - 1]));

              needMeasure = true;
            }

            if (needMeasure) {
              this._layoutEngine.invalidateMeasure();
              this._layoutEngine.needMeasure();
            }
          }

          this._containerElement.innerHTML = content.join("");

          if (this.isVisible()) {
            this.hide();
            this.show();
          }

          this._updateAriaAttributes();
          this._updateCheckboxVisibility();
        },

        /**
         * update item checkboxes visibility
         * @private
         */
        _updateCheckboxVisibility: function() {
          this.domAttributesMutator(function() {
            const checkboxes = this._containerElement.querySelectorAll(".gbc_ListDropDownWidget_item i.zmdi");
            for (const checkbox of checkboxes) {
              checkbox.setAttribute("style", this._allowMultipleValues ? "" : "display:none !important");
            }
          }.bind(this));
        },

        /**
         * update items accessibility attributes
         * @private
         */
        _updateAriaAttributes: function() {
          this.domAttributesMutator(function() {
            const items = this._containerElement.querySelectorAll(".gbc_ListDropDownWidget_item"),
              len = items.length;
            for (let i = 0; i < len; ++i) {
              items[i].setAttribute("aria-role", 'option');
              items[i].setAttribute("aria-posinset", (i + 1).toString());
              items[i].setAttribute("aria-setsize", len.toString());
            }
          }.bind(this));
        },

        /**
         * Check items checkbox accordingly to selectedValues
         * Set current item accordingly to _currentItem
         * This method is very safe, but performance heavy
         * @private
         */
        _updateVisualElementState: function() {
          const elements = this._containerElement.querySelectorAll('.gbc_ListDropDownWidget_item');
          let index = 0;
          for (const element of elements) {
            if (this.allowMultipleChoices) {
              const checkBox = element.querySelector("i");
              if (checkBox) {
                const valueIndex = this._selectedValues.findIndex(value => value === element.getAttribute("combovalue"));
                const rmClass = valueIndex === -1 ? "checked" : "unchecked";
                const adClass = valueIndex === -1 ? "unchecked" : "checked";
                checkBox.removeClass(rmClass).addClass(adClass);
              }
            }
            element.removeClass("current");
            if (index === this._currentIndex) {
              element.addClass("current");
            }
            index += 1;
          }
        },

        /**
         * Get item index by its value
         * @param {string} value value
         * @return {number} The matching index. -1 if not found
         */
        indexByValue: function(value) {
          return this._items.findIndex((item) => item.value === value);
        },

        /**
         * Get item by its value
         * @param {string} value value
         * @return {Object} the item
         */
        findByValue: function(value) {
          return this._items.find(function(item) {
            return item.value === value;
          });
        },
        /**
         * Get item by its text
         * @param {string} text value
         * @param {boolean} caseSensitive true by default
         * @return {Object} the item
         */
        findByText: function(text, caseSensitive) {
          if (!caseSensitive) {
            text = text.toLocaleLowerCase();
          }

          return this._items.find(item => item.text === text);
        },

        /**
         * find item starting by searchPattern beginning at current index. will loop to cover all items.
         * @param {string} searchPattern first letters of searched item
         * @param {boolean} startAfterCurrentItem exclude current index item as first matching element
         * @return {Object} found item
         */
        findStartingByText: function(searchPattern, startAfterCurrentItem) {
          const current = this._currentIndex + (startAfterCurrentItem ? 1 : 0);

          return this._items.find(function(item, i) {
            return i >= current && item.searchText.match(new RegExp(`^${searchPattern}`, ""));
          }) || this._items.find(function(item, i) {
            return i < current && item.searchText.match(new RegExp(`^${searchPattern}`, ""));
          });
        },

        /**
         * get value of the current index
         * @return {string|null} Return the value of the current item, if no current item (current index == -1) return null
         */
        getCurrentValue: function() {
          if (this._currentIndex < 0 || this._currentIndex >= this.getItems().length) {
            return null;
          }
          return this.getItems()[this._currentIndex].value;
        },

        /**
         * @returns The index of the current item
         */
        getCurrentIndex: function() {
          return this._currentIndex;
        },

        /**
         * Set the selected values of the widget.
         * And update the UI
         * @param {string[]} values The selected values
         */
        setSelectedValues: function(values) {
          if (!Array.isArray(values)) {
            return;
          }
          this._selectedValues = values;
          const index = this.indexByValue(this._selectedValues[this._selectedValues.length - 1]);
          this._lastSelectedValueIndex = index;
          // Get the last value and set it as current
          this._updateVisualElementState();
        },

        /**
         * Set current index and potentially scroll to it
         * !! WARNING !! : This method don't change any "selected Value"
         * @param {number} index The new index, this index will be clamped between 0 and items count
         */
        setCurrentIndex: function(index) {
          index = Math.clamp(index, -1, this.getItems().length - 1);

          if (this._currentIndex !== -1) {
            const previousItem = this._containerElement.children[this._currentIndex];
            if (previousItem) {
              previousItem.removeClass("current");
            }
          }

          this._currentIndex = index;

          const currentItem = this._containerElement.children[this._currentIndex];
          if (currentItem) {
            currentItem.addClass("current");
            if (this.isVisible()) {
              this.scrollItemIntoView(currentItem);
            }
          }
        },

        setCurrentIndexOnLastItem: function() {
          // Set the current index as the last value of the selectedValues
          const index = this.indexByValue(this._selectedValues[this._selectedValues.length - 1]);
          this.setCurrentIndex(index);
        },

        /**
         * Select the item. And update the UI
         * @param {string} value value
         * @private
         */
        _selectItem: function(value) {
          if (value === null) {
            return;
          }

          const itemIndex = this.getItems().findIndex(item => item.value === value);
          if (itemIndex === -1) {
            return;
          }

          this._lastSelectedValueIndex = itemIndex;
          this._updateVisualElementState();

          this.emit(context.constants.widgetEvents.select, value, this.getItems()[itemIndex].text);
        },

        /**
         * sorts input array in the same order as items array
         * @param {string[]} values input values
         * @return {string[]} sorted array
         */
        sortValues: function(values) {
          const result = [],
            isConstruct = this.getParentWidget().getDialogType() === 'Construct';
          let hasNull = false;

          for (const item of this._items) {
            if (values.indexOf(item.value) >= 0) {
              result.push(item.value);
              //On construct "=" equal "NULL" item because it means 'is not null'
              if (item.nullItem || (item.value === "=" && isConstruct)) {
                hasNull = true;
              }
            }
          }

          const nullKey = isConstruct ? "=" : "";
          if (!hasNull && values.indexOf(nullKey) >= 0) {
            result.push(nullKey);
          }

          return result;
        },

        /**
         * @inheritDoc
         */
        setFontFamily: function(fontFamily) {
          const fontFamilly = fontFamily === null || fontFamily === undefined ? fontFamily :
            fontFamily.escapeFontFamily();

          this.setStyle({
            selector: this._cssSelector
          }, {
            "font-family": fontFamilly
          });
        },

        /**
         * @inheritDoc
         */
        setFontWeight: function(weight) {
          this.setStyle({
            selector: this._cssSelector
          }, {
            "font-weight": weight
          });
        },

        /**
         * @inheritDoc
         */
        setFontStyle: function(style) {
          this.setStyle({
            selector: this._cssSelector
          }, {
            "font-style": style
          });
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          this.setStyle({
            selector: this._cssSelector
          }, {
            "text-align": align
          });
        },

        /**
         * set whether or not this list will allow null value
         * @param {boolean} notNull not null
         */
        setNotNull: function(notNull) {
          if (this._notNull !== notNull) {
            this._notNull = notNull;
            this.updateUIList();
          }
        },

        /**
         * set whether or not this list allow multiple choices
         * @param {boolean} allow allow
         */
        allowMultipleChoices: function(allow) {
          this._allowMultipleValues = allow;
          this._updateCheckboxVisibility();
          this._updateVisualElementState();
        },

        /**
         * set current index on item
         * @param {Object} item item
         */
        navigateToItem: function(item) {
          this.setCurrentIndex(this.indexByValue(item.value));
        },

        /**
         * Scroll to element if needed
         * @param {HTMLElement} element element
         * @publicdoc
         */
        scrollItemIntoView: function(element) {
          if (this.getElement().scrollTop > element.offsetTop) {
            element.scrollIntoView();
          } else if (this.getElement().scrollTop + this.getElement().offsetHeight < element.offsetTop + element.offsetHeight) {
            element.scrollIntoView(false);
          }
        },

        /**
         * On click handler raised when selecting an item in the dropdown :
         * Parent widget get value of clicked item and dropdown is closed.
         * @param domEvent
         * @private
         */
        _onClick: function(domEvent) {
          const item = domEvent.target.closest("gbc_ListDropDownWidget_item"),
            value = item?.getAttribute("combovalue");
          if (value !== null) {
            this._selectItem(value);
            if (domEvent) {
              domEvent.stopPropagation();
            }
            if (!this._allowMultipleValues) {
              this.hide();
            }
          }
        },

        /**
         * Mouse over handler used to highlight current item.
         * @param event
         * @private
         */
        _onMouseover: function(event) {
          const element = event.target;
          if (element) {
            const widgetElement = element.hasClass("gbc_ListDropDownWidget_item") ? element : element.parent("gbc_ListDropDownWidget_item");
            if (widgetElement) {
              this.setCurrentIndex(widgetElement.index());
            }
          }
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this._onClick(domEvent);
          return false;
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          switch (keyString) {
            case "space":
              if (this.isVisible()) {
                if (this._allowMultipleValues) {
                  this._selectItem(this.getCurrentValue());
                } else {
                  this.hide();
                }
                keyProcessed = true;
              }
              break;
            case "enter":
            case "return":
              if (this.isVisible()) {
                if (!this._allowMultipleValues) {
                  this._selectItem(this.getCurrentValue());
                }
                this.hide();
                keyProcessed = true;
              }
              break;
            case "up":
              this._manageValueChangeKey(this._currentIndex - 1);
              keyProcessed = true;
              break;
            case "down":
              this._manageValueChangeKey(this._currentIndex + 1);
              keyProcessed = true;
              break;
            case "pageup":
              this._manageValueChangeKey(this._currentIndex - 10);
              keyProcessed = true;
              break;
            case "pagedown":
              this._manageValueChangeKey(this._currentIndex + 10);
              keyProcessed = true;
              break;
            case "home":
              if (this.isVisible()) {
                this._manageValueChangeKey(0);
                keyProcessed = true;
              }
              break;
            case "end":
              if (this.isVisible()) {
                this._manageValueChangeKey(this.getItems().length - 1);
                keyProcessed = true;
              }
              break;
            case "tab":
            case "shift+tab":
              if (this.isVisible()) {
                this.hide();
              }
              break;
          }

          if (keyProcessed) {
            return true;
          }
          return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
        },

        /**
         * Macro for managing the up, down, pageup, pagedown, start and end key
         * @param {number} index 
         * @private
         */
        _manageValueChangeKey(index) {
          if (index < 0 && this.getCurrentIndex() === -1) {
            index = this.getItems().length + (index + 1);
          }
          index = Math.clamp(index, 0, this.getItems().length - 1);
          this.setCurrentIndex(index);
        },
        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          // nothing intentionally here
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          // nothing intentionally here
        },

        /**
         * Show the widget dropdown
         */
        show: function() {
          $super.show.call(this);

          // Set the current item as the current value (or the last if multiple values are allowed)
          this.setCurrentIndex(this._lastSelectedValueIndex);

          //resize elements inside dropdown to fix GBC-4203 - COMBOBOX drop-down list very long entry truncated when hovering over it
          const items = this._containerElement.querySelectorAll('.gbc_ListDropDownWidget_item');
          let maxItemWidth = 0;
          for (const item of items) {
            if (item.scrollWidth > maxItemWidth) {
              maxItemWidth = item.scrollWidth;
            }
          }
          const parent = (this.parentElement ? this.parentElement : this.getParentWidget().getElement());
          if (maxItemWidth > parent.scrollWidth) {
            for (const item of items) {
              item.style.width = maxItemWidth + "px";
            }
          }
        },

        hide: function() {
          $super.hide.call(this);

          this.setCurrentIndex(this._lastSelectedValueIndex);
        },

        /**
         * Create a regex that help finding possible values
         * @param {string} valueToMatch The value/key of the item
         * @param {string} textToMatch The label/text of the item
         * @returns {string} The string to build a regex
         * @private
         */
        _buildItemRegex: function(valueToMatch, textToMatch) {
          if (valueToMatch === undefined && textToMatch === undefined) {
            return "";
          }
          valueToMatch = valueToMatch.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
          textToMatch = textToMatch.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
          if (textToMatch !== "") {
            valueToMatch = `(?:${valueToMatch})|(?:${textToMatch})`;
          }
          return `(^|\\|)(?:${valueToMatch})(\\||$)`;
        },

        /**
         * Build a match list under the form of an object, 
         * with the case sensitive matches and the case insensitive matches 
         * for every possible items of the listDropDown
         * At every exact match we strip the value string, so we don't test the same value twice
         * @param {string} valueString The value string to build the match list agains
         * @returns {Object} The match list to build the filtered values
         */
        _buildMatchList: function(valueString) {
          const matches = {};
          for (const item of this.getItems()) {
            let exactMatch = false;

            let matchingValue = valueString.match(new RegExp(item.searchPattern, "g"));
            if (matchingValue) {
              exactMatch = true;
              valueString.replaceAll(new RegExp(item.searchPattern, "g"), "");
            } else {
              matchingValue = valueString.match(new RegExp(item.searchPattern, "gi"));
            }
            if (matchingValue) {
              if (!matches[matchingValue]) {
                matches[matchingValue] = {
                  exactMatch: null,
                  matches: []
                };
              }
              if (exactMatch) {
                matches[matchingValue].exactMatch = item;
              } else {
                matches[matchingValue].matches.push(item);
              }
            }
            if (valueString === "") {
              return matches;
            }
          }
          return matches;
        },

        /**
         * Test if a value exist in the possible values.
         * The argument value is tested against item key or text.
         * @param {string} valueString The value to test agains
         * @param {string} discardUnavailableValues Should this method return empty string if the valueString is not in the availble items. False by defualt
         * @returns {{remaining : string, values : string[], replacedValue: string, replacedText: string}} The value keys that where found in the value given in parameter.
         */
        filterValues: function(valueString, discardUnavailableValues = false) {
          if (!valueString) {
            // Check if the value exists in the items
            const item = this.getItems().find(item => item.value === valueString);

            return {
              remaining: "",
              values: [""],
              formattedValues: "",
              formattedText: item?.text !== undefined ? item.text : "",
            };
          }
          let remaining = valueString;
          let formattedValues = valueString;
          let formattedText = valueString;

          const matchedItems = this._buildMatchList(valueString);
          let processedValues = [];
          // filter again, so if there are multiple matches
          // and no exact match, we consider that no values are valid
          for (const valueMatch in matchedItems) {
            let matchedItem = null;
            let flags = "g";
            if (matchedItems[valueMatch].exactMatch) {
              matchedItem = matchedItems[valueMatch].exactMatch;
            } else if (matchedItems[valueMatch].matches.length === 1) {
              matchedItem = matchedItems[valueMatch].matches[0];
              flags += "i";
            }
            if (matchedItem) {
              processedValues.push(matchedItem.value);
              const reg = new RegExp(matchedItem.searchPattern, flags);
              remaining = remaining.replaceAll(reg, "");
              formattedValues = formattedValues.replaceAll(reg, `$1${matchedItem.value}$2`);
              formattedText = formattedText.replaceAll(reg, `$1${matchedItem.text}$2`);
            }
          }

          // Remove the pipes that could have stayed
          remaining = remaining.replace("|", "");
          /* If we do not allow values that are not in the items,
           * and no values was found, that mean we should not return anything
           */
          if (discardUnavailableValues && processedValues.length === 0) {
            formattedValues = "";
            formattedText = "";
          }

          return {
            remaining,
            values: processedValues,
            formattedValues,
            formattedText
          };
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ListDropDown', cls.ListDropDownWidget);
  });
