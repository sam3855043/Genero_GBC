/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

'use strict';

modulum('ComboBoxWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Combobox widget.
     * @class ComboBoxWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */

    cls.ComboBoxWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.ComboBoxWidget.prototype */ {
        $static: {
          _navigationKeyRegex: /up|down|pageup|pagedown|home|end/i,
        },
        __name: 'ComboBoxWidget',

        /** @type {string} */
        __dataContentPlaceholderSelector: '.gbc_dataContentPlaceholder',
        /** @type {classes.EditWidget}*/
        _editWidget: null,
        /** @type {classes.ListDropDownWidget} */
        _dropDown: null,
        /** @type {string} */
        _typedLetters: "",
        /** @function */
        _typedLettersCacheHandler: null,
        /** @function */
        _focusHandler: null,
        /** @function */
        _editFocusHandler: null,
        /** @function */
        _dropDownSelectHandler: null,
        /** @function */
        _visibilityChangeHandler: null,

        /**
         * Is the combobox query editable?
         * @type {boolean}
         * @protected
         */
        _isQueryEditable: false,

        /** @type {HTMLElement} */
        _toggleIcon: null,

        /** @type {string} */
        _placeholderText: '',

        /** @type {string} */
        _value: '',

        /** @type {string} */
        _lastVMValue: '',

        /** @type {boolean} */
        _allowMultipleValues: false,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.ComboBoxLayoutEngine(this);
            this._layoutInformation.setReservedDecorationSpace(2);
            this._layoutInformation.setSingleLineContentOnly(true);

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * Bind all events listeners on combobox and create the combobox dropdown
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          this.setFocusable(true);
          this.setAriaAttribute("expanded", "false");
          this.setAriaAttribute("live", "polite");

          this._toggleIcon = this.getElement().querySelector("i.toggle");

          this.setStyle('i.toggle', {
            'min-width': window.scrollBarSize + 'px',
          });

          // INIT EditWidget
          this._editWidget = cls.WidgetFactory.createWidget('EditWidget', this.getBuildParameters());
          this.getEditWidget().setFocusable(false);
          this.getEditWidget().setParentWidget(this);
          this._element.prependChild(this.getEditWidget().getElement());

          this.getEditWidget().getInputElement().on('blur.ComboBoxWidget', this._onBlur.bind(this));
          this._editFocusHandler = this.getEditWidget().when(context.constants.widgetEvents.requestFocus,
            this._onEditRequestFocus.bind(this));

          // INIT DropDownListWidget
          this._dropDown = cls.WidgetFactory.createWidget('ListDropDown', this.getBuildParameters());
          this.getDropDown().setParentWidget(this);
          this.getDropDown().fallbackMaxHeight = 300;
          this.getDropDown().hide();
          this._dropDownSelectHandler = this.getDropDown().when(context.constants.widgetEvents.select, this._onSelectValue.bind(this));
          this.getDropDown().onClose(this._onToggleDropDown.bind(this));
          this.getDropDown().onOpen(this._onToggleDropDown.bind(this));

          this._visibilityChangeHandler = this.getDropDown()
            .when(context.constants.widgetEvents.visibilityChange, this._updateEditState.bind(this));

          this.setAriaAttribute("owns", this.getDropDown().getRootClassName());
          this.setAriaAttribute("labelledby", this.getEditWidget().getRootClassName());
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._focusHandler) {
            this._focusHandler();
            this._focusHandler = null;
          }
          if (this._editFocusHandler) {
            this._editFocusHandler();
            this._editFocusHandler = null;
          }
          if (this._dropDownSelectHandler) {
            this._dropDownSelectHandler();
            this._dropDownSelectHandler = null;
          }
          if (this._visibilityChangeHandler) {
            this._visibilityChangeHandler();
            this._visibilityChangeHandler = null;
          }

          this.getEditWidget().getInputElement().off('blur.ComboBoxWidget');

          if (this.getDropDown()) {
            this.getDropDown().destroy();
            this._dropDown = null;
          }

          this._typedLettersCacheHandler = null;

          this.getEditWidget().destroy();
          this._editWidget = null;

          $super.destroy.call(this);
        },

        /**
         * Set widget mode. Useful when widget have peculiar behavior in certain mode
         * @param {string} mode the widget mode
         * @param {boolean} active the active state
         */
        setWidgetMode: function(mode, active) {
          this._allowMultipleValues = mode === "Construct";
          this.getDropDown().allowMultipleChoices(this._allowMultipleValues);
          this._updateEditState();
          this._updateTextTransform();
        },

        /**
         * Returns whether the user should be able to input data freely or not
         * @return {boolean} true if user can input data
         */
        canInputText: function() {
          return this._isQueryEditable && this._allowMultipleValues;
        },

        /**
         * @inheritDoc
         */
        hasDOMFocus: function() {
          return (this.getEditWidget()?.hasDOMFocus()) ||
            $super.hasDOMFocus.call(this);
        },

        /**
         * Focus handler. 
         * Allow the Combobox to keep the focus even when clicking on sub widgets
         * @private
         */
        _onFocus: function() {
          this.setFocus(false);
        },

        /**
         * Handler when focus is requested
         * @param event
         * @param sender
         * @param domEvent
         */
        _onEditRequestFocus: function(event, sender, domEvent) {
          this.emit(context.constants.widgetEvents.requestFocus, domEvent);
        },

        /**
         * get the associate dropdown
         * @returns {classes.ListDropDownWidget}
         */
        getDropDown: function() {
          return this._dropDown;
        },

        /**
         * @inheritDoc
         */
        openDropDown() {
          if (!this.isEnabled()) {
            return;
          }
          const filteredValues = this.getDropDown().filterValues(this.getValue());
          this.setValue(filteredValues.formattedValues, false);
          this.getDropDown().setSelectedValues(filteredValues.values);
          this.getDropDown().show();
        },

        /**
         * Open the DropDown if closed
         * Close the DropDown if opened 
         */
        toggleDropDown() {
          if (!this.isEnabled) {
            return;
          }

          if (this.getDropDown().isVisible()) {
            this.getDropDown().hide();
          } else {
            this.getDropDown().show();
          }

        },

        /**
         * when value is selected in the dropdown
         * @param event
         * @param src
         * @param value
         * @private
         */
        _onSelectValue: function(event, src, value, text) {
          this.toggleValue(value, text);
          this.emit(context.constants.widgetEvents.requestFocus);
        },

        /**
         * Handle triggered once the dropdown open or close
         * @private
         */
        _onToggleDropDown: function() {
          this._updateEditState();
          this._toggleIcon.toggleClass("dd-open", this.getDropDown().isVisible());
        },

        /**
         * Blur handler
         * @private
         */
        _onBlur: function() {
          if (!this.getDropDown().isVisible()) {
            this.emit(context.constants.widgetEvents.blur);
          } else if (!this.hasFocus()) {
            this.getDropDown().hide();
          }
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this._onRequestFocus(domEvent); // request focus
          this.emit(context.constants.widgetEvents.click, domEvent);
          if (!(this._isQueryEditable && domEvent.target.tagName === 'INPUT')) {
            this.emit(context.constants.widgetEvents.openDropDown);
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.getDropDown().isVisible()) {
            keyProcessed = this.getDropDown().managePriorityKeyDown(keyString, domKeyEvent, repeat);
            if (keyProcessed) {
              return true;
            }
          }

          switch (keyString) {
            case "space":
              if (!this._isQueryEditable) {
                this.emit(context.constants.widgetEvents.openDropDown);
                keyProcessed = true;
              }
              break;
            case "up":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() - 1);
              if (!keyProcessed) {
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() - 1);
              }
              break;
            case "down":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() + 1);
              if (!keyProcessed) {
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() + 1);
              }
              break;
            case "pageup":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() - 10);
              if (!keyProcessed) {
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() - 10);
              }
              break;
            case "pagedown":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() + 10);
              if (!keyProcessed) {
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getDropDown().getCurrentIndex() + 10);
              }
              break;
            case "home":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, 0);
              if (!this.canInputText() && !keyProcessed) { // Else let the editWidget manage the event
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, 0);
              }
              break;
            case "end":
              // @short-circuit : keyProcessed ||= this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getItems().length - 1);
              if (!this.canInputText() && !keyProcessed) { // Else let the editWidget manage the event
                keyProcessed = this._manageValueChangeKey(keyString, domKeyEvent, repeat, this.getItems().length - 1);
              }
              break;
            case "del":
            case "delete":
              if (this.getDropDown().isVisible() || !(this.canInputText && this.getEditWidget().hasDOMFocus())) {
                if (!this._notNull || this._allowMultipleValues) {
                  this.setValue("", true);
                }
                keyProcessed = true;
              }
              break;
          }

          if (keyProcessed) {
            return true;
          }
          return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled()) {
            switch (keyString) {
              case "alt+up":
              case "alt+down":
                this.emit(context.constants.widgetEvents.openDropDown);
                keyProcessed = true;
                break;
              case "right":
              case "left":
                // @short-circuit : keyProcessed ||= this.getEditWidget().manageKeyDown(keyString, domKeyEvent, repeat);
                if (!keyProcessed) {
                  keyProcessed = this.getEditWidget().manageKeyDown(keyString, domKeyEvent, repeat);
                }
                break;
            }
            if (!keyProcessed) {
              // auto item preselection by name
              keyProcessed = this._processKey(domKeyEvent, keyString);
            }
          }

          if (keyProcessed) {
            return true;
          }
          return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
        },

        /**
         * Process one key event
         * @param {Object} event
         * @param {string} keyString
         * @returns {boolean} true if key has been processed, false otherwise
         * @private
         */
        _processKey: function(event, keyString) {
          const key = event.gbcKey;

          if (key.length > 1) { // we only want single char
            return false;
          }
          if (this._typedLettersCacheHandler) {
            this._clearTimeout(this._typedLettersCacheHandler);
            this._typedLettersCacheHandler = 0;
          }
          if (!this.getDropDown().isVisible()) {
            if (this.canInputText()) {
              return false;
            }
          }

          const lastChar = key.toLocaleLowerCase();
          this._typedLettersCacheHandler = this._registerTimeout(this._clearTypedLettersCache.bind(this), 400);
          this._typedLetters += lastChar;
          // looking for an item matching with combination of typed chars within 400ms time interval
          let found = this.getDropDown().findStartingByText(this._typedLetters, this._typedLetters.length === 1);
          if (!found) {
            // if no item matched combination of chars we just display next item beginning with last typed char so user can scroll different values
            this._typedLetters = lastChar;
            found = this.getDropDown().findStartingByText(this._typedLetters, true);
          }
          if (found) {
            this.getDropDown().navigateToItem(found);
            if (!this.getDropDown().isVisible()) {
              this.setEditing(this._oldValue !== found.value);
              this.setValue(found.value);
            }
            return true;
          }
          return false;
        },

        _manageValueChangeKey(keyString, domKeyEvent, repeat, index = -1) {
          if (this.getDropDown().isVisible() || this.isInArray()) {
            // Return false as it should be treated by the dropdown or the RTable
            return false;
          }
          // Allow to start at the bottom of the dropdown list if the current index is -1
          if (index < 0 && this.getDropDown().getCurrentIndex() === -1) {
            index = this.getItems().length + (index + 1);
          }
          index = Math.clamp(index, 0, this.getItems().length - 1);

          this.setValue(this.getItems()[index].value, false);
          this.getDropDown().setCurrentIndex(index);
          return true;
        },

        /**
         * Clear the cache of typed letters
         * @private
         */
        _clearTypedLettersCache: function() {
          this._typedLettersCacheHandler = 0;
          this._typedLetters = "";
        },

        /**
         * Get the available items
         * @return {Object[]}
         */
        getItems: function() {
          return this.getDropDown().getItems();
        },

        /**
         * Set combobox items
         * @param {ListDropDownWidgetItem|ListDropDownWidgetItem[]} items - a single or a list of choices
         * @publicdoc
         */
        setItems: function(items) {
          if (!Array.isArray(items)) {
            items = items ? [items] : [];
          }
          /* Get the value before, so when in construct mode
           * the value is the index if it fits an item
           * and not the text of the item
           */
          const currentValue = this.getValue();
          this.getDropDown().setItems(items);
          this.setValue(currentValue);
          if (this._layoutEngine) {
            this._layoutEngine.invalidateMeasure();
          }
        },

        /**
         * @returns {classes.EditWidget} The EditWidget instance
         */
        getEditWidget: function() {
          return this._editWidget;
        },

        /**
         * update edit availability
         * @private
         */
        _updateEditState: function() {
          this.getEditWidget().setReadOnly(this.getDropDown().isVisible() || !this.canInputText());
        },

        /**
         * @inheritDoc
         */
        canAutoNext: function() {
          // if autonext is enabled, we execute it on dropdown item click
          return this.hasFocus() && this.getDropDown().isVisible();
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          if (
            this.canInputText() &&
            this.getDropDown().filterValues(this.getEditWidget().getValue()).formattedValues !== this._value
          ) {
            return this.getEditWidget().getValue();
          }
          return this._value;
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          return this.getEditWidget().getValueForClipboard(ignoreSelection);
        },

        /**
         * Return the current values, formatted for display
         * @return {string} the formatted values as one string separated by 
         */
        getFormattedValue: function() {
          return this.getDropDown().filterValues(this._value, this.getDialogType() === "Input").formattedText;
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          $super.setValue.call(this, value, fromVM, cursorPosition);

          if (fromVM) {
            if (this.getEditWidget()) {
              this.getEditWidget().setEditing(false);
            }
            this._lastVMValue = value;
          }

          this._setValue(value, fromVM);
        },

        /**
         * Internal setValue used to be inherited correctly by OtherWidget
         * @param {string} value - the value
         * @param {boolean} [fromVM] - is value come from VM ?
         * @private
         */
        _setValue: function(value, fromVM) {
          const previousValue = this._value;

          const processedValue = this.getDropDown().filterValues(value);

          if (fromVM) {
            this._value = value;
          } else if (this.canInputText() && processedValue.remaining.length > 0) {
            this._value = processedValue.formattedValues;
          } else if (this._allowMultipleValues) {
            this._value = this.getDropDown().sortValues(processedValue.values).join("|");
          } else {
            this._value = processedValue.values[0];
          }

          this.getEditWidget().setValue(this.getFormattedValue());
          this.getDropDown().setSelectedValues(processedValue.values);
          if (!this.getDropDown().isVisible()) {
            this.getDropDown().setCurrentIndexOnLastItem();
          }
          if (!fromVM && previousValue !== this._value) {
            this.triggerValueChangedEvent(this._value);
          }
        },

        /**
         * Toggle the value given in parameter, according to the combobox settings
         * @param {string} value The value key to toggle.
         * @param {string} text The display text to show to the user.
         */
        toggleValue(value, text) {
          if (value === null || value === undefined) {
            throw new Error(`Value is invalid : ${value}`);
          }

          const previousValue = this._value;

          let values = [value];

          this.setEditing(true);

          if (!this._allowMultipleValues || value.match(/^!?=$/) || this._value.match(/^!?=$/)) {
            this._value = value;
            this.getEditWidget().setValue(text);
          } else {
            const filteredValues = this.getDropDown().filterValues(this._value);
            const valueIndex = filteredValues.values.findIndex(v => v === value);
            if (valueIndex > -1) {
              filteredValues.values.splice(valueIndex, 1);
            } else {
              filteredValues.values.push(value);
            }
            values = filteredValues.values;
            this._value = this.getDropDown().sortValues(filteredValues.values).join("|");
          }

          this.getEditWidget().setValue(this.getFormattedValue());
          this.getDropDown().setSelectedValues(values);

          // Emit if needed
          if (previousValue !== this._value) {
            this.triggerValueChangedEvent(this._value);
          }
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse, stayOnSameWidget) {
          $super.setFocus.call(this, fromMouse);

          if (this.getEditWidget()) {
            this.getEditWidget().getInputElement().domFocus();
          } else {
            this._element.domFocus();
          }
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._element.toggleClass('disabled', !enabled);
          this.getEditWidget().setEnabled(enabled);
          this._updateEditState();
          this.getDropDown().setEnabled(enabled);
        },

        /**
         * sets the combobox as query editable
         * @param {boolean} isQueryEditable
         */
        setQueryEditable: function(isQueryEditable) {
          this._isQueryEditable = isQueryEditable;
          this._updateEditState();
          this._updateTextTransform();
        },

        /**
         * @inheritDoc
         */
        setColor: function(color) {
          $super.setColor.call(this, color);
          this.getEditWidget().setColor(color);
          if (this.getDropDown()) {
            this.getDropDown().setColor(color);
          }
        },

        setDefaultColor: function(color) {
          this.setStyle(".zmdi", {
            'color': color
          });
        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          $super.setBackgroundColor.call(this, color);
          if (this.getDropDown()) {
            this.getDropDown().setBackgroundColor(color);
          }
        },

        /**
         * @inheritDoc
         */
        getColorFromStyle: function() {
          return this.getEditWidget().getColorFromStyle();
        },

        /**
         * @inheritDoc
         */
        setFontWeight: function(weight) {
          $super.setFontWeight.call(this, weight);
          this.getEditWidget().setFontWeight(weight);
          if (this.getDropDown()) {
            this.getDropDown().setFontWeight(weight);
          }
        },

        /**
         * @inheritDoc
         */
        setFontFamily: function(fontFamily) {
          $super.setFontFamily.call(this, fontFamily);
          if (this.getDropDown()) {
            this.getDropDown().setFontFamily(fontFamily);
          }
        },

        /**
         * @inheritDoc
         */
        setFontStyle: function(style) {
          $super.setFontStyle.call(this, style);
          this.getEditWidget().setFontStyle(style);
          if (this.getDropDown()) {
            this.getDropDown().setFontStyle(style);
          }
        },

        /**
         * @inheritDoc
         */
        setFontSize: function(size) {
          $super.setFontSize.call(this, size);
          // apply to dropdown as well
          if (this.getDropDown()) {
            this.getDropDown().setFontSize(size);
          }
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          $super.setFontAlign.call(this, align);
          this.getEditWidget().setTextAlign(align);
          if (this.getDropDown()) {
            this.getDropDown().setTextAlign(align);
          }
        },

        /**
         * @inheritDoc
         */
        setTextTransform: function(transform) {
          if (this._textTransform !== transform) {
            this._textTransform = transform;
            this._updateTextTransform();
          }
        },

        /**
         * @inheritDoc
         */
        removeTextTransform: function() {
          this._textTransform = 'none';
          this.getEditWidget().removeTextTransform();
        },

        /**
         * @inheritDoc
         */
        _updateTextTransform: function() {
          const wantedTextTransform = this.canInputText() ? this._textTransform : "none";
          if (wantedTextTransform !== this.getEditWidget().getTextTransform()) {
            this.getEditWidget().removeTextTransform();
            this.getEditWidget().setTextTransform(wantedTextTransform);
          }
        },

        /**
         * @inheritDoc
         */
        setTextDecoration: function(decoration) {
          $super.setTextDecoration.call(this, decoration);
          this.getEditWidget().setTextDecoration(decoration);
        },

        /**
         * Handle a null item if notNull is not specified
         * @param {boolean} notNull - combobox accept notNull value?
         * @publicdoc
         */
        setNotNull: function(notNull) {
          $super.setNotNull.call(this, notNull);
          this.getDropDown().setNotNull(notNull);
        },

        /**
         * @inheritDoc
         */
        setPlaceHolder: function(placeholder) {
          this.setAriaAttribute("placeholder", placeholder);
          this.getEditWidget().setPlaceHolder(placeholder);
        },

        /**
         * @inheritDoc
         */
        setDialogType: function(dialogType) {
          $super.setDialogType.call(this, dialogType);
          this.getDropDown().setDialogType(dialogType);
          this.getDropDown().updateUIList();
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          return {
            paste: false,
            copy: true,
            cut: false,
            selectAll: true
          };
        },

        getCursors: function() {
          if (!this._isQueryEditable) {
            return {
              start: 0,
              end: 0
            };
          }
          return this.getEditWidget().getCursors();
        },

        /**
         * When cursor2 === cursor, it is a simple cursor set
         * @param {number} cursor - starting cursor position
         * @param {number} cursor2 - ending cursor position
         * @publicdoc
         */
        setCursors: function(cursor, cursor2) {
          if (!this._isQueryEditable) {
            cursor = cursor2 = 0;
          }
          if (this.getEditWidget()) {
            this.getEditWidget().setCursors(cursor, cursor2);
          }
        },

        /**
         * @inheritDoc
         */
        selectAllInputText: function() {
          this.getEditWidget().selectAllInputText();
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ComboBox', cls.ComboBoxWidget);
    cls.WidgetFactory.registerBuilder('ComboBoxWidget', cls.ComboBoxWidget);
  });
