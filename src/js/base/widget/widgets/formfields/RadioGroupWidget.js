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

modulum('RadioGroupWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * RadioGroup widget.
     * @class RadioGroupWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.RadioGroupWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.RadioGroupWidget.prototype */ {
        __name: 'RadioGroupWidget',
        /**
         * currently aimed item
         * @type {number}
         */
        _currentlyAimedIndex: 0,

        /**
         * Widget value
         * @type {string}
         */
        _value: '',
        /**
         * @type {boolean}
         */
        _notNull: false,
        /**
         * @type {boolean}
         */
        _allowNullValue: false,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setFocusable(true);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.LeafDynamicHeightLayoutEngine(this);
            this._layoutInformation.getSizePolicyConfig().initial = cls.SizePolicy.Dynamic();

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
        },

        /**
         * Manage navigation keys
         * @param {string} keyString - key string representation
         * @returns {boolean} returns if the key has been processed
         * @private
         */
        _manageNavigationKey: function(keyString) {

          if (this.isInArray()) {
            return false;
          }

          let keyProcessed = true;
          switch (keyString) {
            case "down":
              this._onNext();
              break;
            case "up":
              this._onPrevious();
              break;
            default:
              keyProcessed = false;
          }

          return keyProcessed;
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled() && !this.isReadOnly()) {

            keyProcessed = this._manageNavigationKey(keyString);
            if (keyProcessed) {
              return true;
            }

            keyProcessed = true;
            switch (keyString) {
              case this.getEnd():
                this._onNext();
                break;
              case this.getStart():
                this._onPrevious();
                break;
              case "space":
                this._onSpace();
                break;
              default:
                keyProcessed = false;
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {

          this._onRequestFocus(domEvent);
          if (domEvent.target.elementOrParent("gbc_RadioGroupItem")) {
            this._onItemClick(domEvent);
          }
          this.emit(context.constants.widgetEvents.click, domEvent);

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * On click handler
         * @param {Object} evt - DOM event
         * @private
         */
        _onItemClick: function(evt) {
          if (!this.isEnabled()) {
            return;
          }

          const clickedIndex = this._indexOf(evt.target.closest('gbc_RadioGroupItem').getAttribute('data-value'));
          if (clickedIndex === -1) {
            return;
          }
          this._currentlyAimedIndex = clickedIndex;

          let newValue = this._getIndexValue(this._currentlyAimedIndex, false);
          this.emit(context.constants.widgetEvents.valueChanged, newValue);
        },

        /**
         * On previous handler : action to do when we want to go to previous value
         * @private
         */
        _onPrevious: function() {
          this._currentlyAimedIndex -= 1;
          if (this._currentlyAimedIndex < 0) {
            this._currentlyAimedIndex = this.getChildItems().length - 1;
          }

          const newValue = this._getIndexValue(this._currentlyAimedIndex, true);
          this.emit(context.constants.widgetEvents.valueChanged, newValue);
        },

        /**
         * On next handler : action to do when we want to go to next value
         * @private
         */
        _onNext: function() {
          this._currentlyAimedIndex += 1;
          if (this._currentlyAimedIndex >= this.getChildItems().length) {
            this._currentlyAimedIndex = 0;
          }

          const newValue = this._getIndexValue(this._currentlyAimedIndex, true);
          this.emit(context.constants.widgetEvents.valueChanged, newValue);
        },

        /**
         * On space Key handler
         * @private
         */
        _onSpace: function() {
          const newValue = this._getIndexValue(this._currentlyAimedIndex, false);
          this.emit(context.constants.widgetEvents.valueChanged, newValue);
        },

        /**
         * Return the index of the item having the value in parameter
         * @param {string} value The value of the item to find
         * @returns The index of the item that have the value. -1 if not found
         * @private
         */
        _indexOf: function(value) {
          return this.getChildItems().findIndex((element) => element.getAttribute('data-value') === value);
        },

        /**
         * Add a choice to the list
         * @param {object} choice - choice to add
         * @private
         */
        _addChoice: function(choice) {
          const button = context.TemplateService.renderDOM('RadioGroupItem');
          button.setAttribute('data-value', choice.value);
          button.getElementsByTagName('span')[0].textContent = choice.text;
          this._element.appendChild(button);
          if (this.getLayoutEngine()) {
            this.getLayoutEngine().forceMeasurement();
            this.getLayoutEngine().invalidateMeasure();
          }
        },

        /**
         * Removes a choice at the given index
         * @param {number} index
         * @private
         */
        _removeChoiceAt: function(index) {
          this._element.allchild('gbc_RadioGroupItem')[index].remove();
        },

        /**
         * Removes the given choice
         * @param {object} choice
         * @private
         */
        _removeChoice: function(choice) {
          const index = this._indexOf(choice.value);
          if (index >= 0) {
            this._removeChoiceAt(index);
          }
          if (this.getLayoutEngine()) {
            this.getLayoutEngine().forceMeasurement();
            this.getLayoutEngine().invalidateMeasure();
          }
        },

        /**
         * Adds a single or a list of choices
         * @param {string|string[]} choices - choices to add to the radio ensemble
         * @publicdoc
         */
        setItems: function(choices) {
          this.clearChoices();
          if (choices) {
            if (Array.isArray(choices)) {
              for (const element of choices) {
                this._addChoice(element);
              }
              this.updateValue();
            } else {
              this._addChoice(choices);
            }
            this._addAriaNavigation();
          }
        },

        /**
         * Removes a single or a list of choices
         * @param {(string|string[])} choices - choices to remove
         * @publicdoc
         */
        removeChoices: function(choices) {
          if (choices) {
            if (Array.isArray(choices)) {
              for (const element of choices) {
                this._removeChoice(element);
              }
            } else {
              this._removeChoice(choices);
            }
          }
        },

        /**
         * Clears all choices
         * @publicdoc
         */
        clearChoices: function() {
          while (this.getChildItems().length > 0) {
            this._element.childrenExcept(this.__charMeasurer)[0].remove();
          }
          if (this.getLayoutEngine()) {
            this.getLayoutEngine().forceMeasurement();
            this.getLayoutEngine().invalidateMeasure();
          }
        },

        /**
         * Set the layout orientation.
         * @param {string} orientation - 'vertical' or 'horizontal' or ''.
         * @publicdoc
         */
        setOrientation: function(orientation) {
          orientation = orientation === "" ? "vertical" : orientation; // default orientation is vertical
          this._element.toggleClass('gbc_RadioGroupWidget_horizontal', orientation === 'horizontal');
          this._element.toggleClass('gbc_RadioGroupWidget_vertical', orientation === 'vertical');
          if (this.getLayoutEngine()) {
            this.getLayoutEngine().forceMeasurement();
            this.getLayoutEngine().invalidateMeasure();
          }
        },

        /**
         * Get the layout orientation.
         * @returns {string} the layout orientation. 'vertical' or 'horizontal'.
         * @publicdoc
         */
        getOrientation: function() {
          if (this._element.hasClass('gbc_RadioGroupWidget_horizontal')) {
            return 'horizontal';
          } else {
            return 'vertical';
          }
        },

        /**
         * Get the value of the radiogroup
         * @returns {string} value - the current value
         * @publicdoc
         */
        getValue: function() {
          return this._value;
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM) {
          $super.setValue.call(this, value, fromVM);
          this._setValue(value);
        },

        /**
         * Internal setValue used to be inherited correctly by DummyWidget
         * @param {string} value - the value to set
         * @private
         */
        _setValue: function(value) {
          this._value = value;
          const indexOfValue = this._indexOf(value);
          this._currentlyAimedIndex = indexOfValue !== -1 ? indexOfValue : this._currentlyAimedIndex;
          this._updateVisual(value, this._currentlyAimedIndex);
        },

        /**
         * Set again the value, can be useful if items have changed
         * @publicdoc
         */
        updateValue: function() {
          if (this._value) {
            this.setValue(this._value);
          }
        },

        /**
         * Update the UI, with the value for the given index.
         * NOT NULL wise
         * !! This method don't change the value of the widget class !!
         * @param {number} index - index of the value
         * @param {boolean} allowKeepNull If true, the value will stay null if it was null before (used for previous and next)
         * @returns {string} The value corresponding to the visual
         * @private
         */
        _getIndexValue: function(index, allowKeepNull) {
          if (!this.isEnabled()) {
            return this.getValue();
          }
          const childItem = this.getChildItems()[index];

          if (childItem === undefined) {
            return this.getValue();
          }

          const wantedValue = childItem.getAttribute('data-value');
          let newValue = this.getValue() === '' && allowKeepNull ? '' : wantedValue;

          if (wantedValue === this.getValue() && (!this._notNull || this._dialogType === "Construct")) {
            newValue = '';
          }

          // Return the value
          return newValue;
        },

        /**
         * Manage RadioGroup visual depending on the values given in parameters
         * @param {string} checkedValue The checked value, used to find the item to check. If null, no item will be checked
         * @param {number|undefined} aimedIndex The index of the aimed item, if set to undefined, it will be the same as the checkedValue item.
         */
        _updateVisual: function(checkedValue, aimedIndex) {
          this.getChildItems().forEach((childElement, index) => {
            const childElementValue = childElement.getAttribute('data-value');
            // Foreach children, toggle 'checked', and 'unchecked' classes
            const zmdiElement = childElement.getElementsByClassName('zmdi')[0];
            zmdiElement.toggleClass('checked', childElementValue === checkedValue);
            zmdiElement.toggleClass('unchecked', childElementValue !== checkedValue);
            childElement.setAttribute('aria-checked', childElementValue === checkedValue);

            childElement.toggleClass('aimed', index === aimedIndex);
            childElement.setAttribute('aria-selected', index === aimedIndex);
          });
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._element.toggleClass('disabled', !enabled);
          for (const element of this.getChildItems()) {
            const zmdiItem = element.getElementsByClassName('zmdi')[0];
            zmdiItem.toggleClass('disabled', !enabled);
          }
        },

        /**
         * Sets the focus to the widget
         * @publicdoc
         */
        setFocus: function(fromMouse) {
          this._element.domFocus();
          this._updateVisual(this.getValue(), this._currentlyAimedIndex);
          $super.setFocus.call(this, fromMouse);
        },

        /**
         * Set widget mode. Useful when widget have peculiar behavior in certain mode
         * @param {string} mode the widget mode
         * @param {boolean} active the active state
         */
        setWidgetMode: function(mode, active) {
          this._allowNullValue = mode === "Construct";
        },

        /**
         * Add accessible navigation for radiogroup
         * @private
         */
        _addAriaNavigation: function() {
          this.getChildItems().forEach((item, index, array) => {
            item.setAttribute('aria-posinset', String(index + 1));
            item.setAttribute('aria-setsize', String(array.length));
          });
        },

        getChildItems() {
          return this._element.allchild('gbc_RadioGroupItem');
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          let valueForCB = null;
          if (!ignoreSelection) {
            valueForCB = window.getSelectionText();
            valueForCB = valueForCB.length > 0 ? valueForCB : null;
          }
          if (valueForCB === null) {
            valueForCB = this.getValue();
          }
          return valueForCB;
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          return {
            paste: false,
            copy: true,
            cut: false,
            selectAll: false
          };
        }
      };
    });
    cls.WidgetFactory.registerBuilder('RadioGroup', cls.RadioGroupWidget);
  });
