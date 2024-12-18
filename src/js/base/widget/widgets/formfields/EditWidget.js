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

modulum('EditWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Edit widget.
     * @class EditWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.EditWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.EditWidget.prototype */ {

        __name: 'EditWidget',

        _completerCurrentChildrenChangeHandler: null,

        __dataContentPlaceholderSelector: cls.WidgetBase.selfDataContent,

        _completerWidget: null,
        _inputType: null,
        _inputMode: null,
        _displayFormat: null,

        _title: null,

        /** @type {?number} */
        _completerValueChangedDelayer: null,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.EditLayoutEngine(this);
            this._layoutInformation.setSingleLineContentOnly(true);

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._inputElement = this._element.getElementsByTagName('input')[0];

          // needed for completer
          this._inputElement.on('blur.EditWidget', this._onBlur.bind(this));

          this._notEditable = false;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._inputElement) {
            this._inputElement.off('blur.EditWidget');
            this._inputElement.remove();
            this._inputElement = null;
          }
          if (this._completerWidget) {
            this._completerWidget.destroy();
            this._completerWidget = null;
            if (this._completerCurrentChildrenChangeHandler) {
              this._completerCurrentChildrenChangeHandler();
              this._completerCurrentChildrenChangeHandler = null;
            }
            this.cancelCompleterValueChangedDelayer();
          }

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        hasFocus: function() {
          const parentWidget = this.getParentWidget();
          if (parentWidget && (
              parentWidget.isInstanceOf(cls.ButtonEditWidget) ||
              parentWidget.isInstanceOf(cls.ComboBoxWidget)
            )) {
            // if edit widget is in composed widget, must check parent focus to know if it has VM focus
            return parentWidget.hasFocus();
          }

          return $super.hasFocus.call(this);
        },

        /**
         * Return completer dropdown if edit is a completer, otherwise returns null
         * @returns {null}
         */
        getDropDown: function() {
          return this._completerWidget;
        },

        /**
         * @inheritDoc
         */
        manageMouseDown: function(domEvent) {
          $super.manageMouseDown.call(this, domEvent);

          // Manage requestFocus during selection of text
          cls.WidgetBase._onSelect.call(this, domEvent);
          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this._onRequestFocus(domEvent);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.hasCompleter()) {
            keyProcessed = this.getCompleterWidget().managePriorityKeyDown(keyString, domKeyEvent, repeat);
          }

          this._updateCapsLockWarning();

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        _checkValue: function(text, newTextPart) {
          if (this._dialogType !== 'Input' && this._dialogType !== 'InputArray') {
            return newTextPart;
          }

          if (!this._scroll || this._dataTypeWithNoScroll) {
            newTextPart = this.checkValueDisplayWidth(text, newTextPart);
          }

          if (this._maxLength > 0) {
            if (this.getUserInterfaceWidget().isCharLengthSemantics()) {
              newTextPart = newTextPart.substring(0, this._maxLength - text.length);
            } else {
              newTextPart = this.checkValueByteCount(text, newTextPart, this._maxLength);
            }
          }

          return newTextPart;
        },

        /**
         * @inheritDoc
         */
        canAutoNext: function() {
          const text = this.getValue();
          const size = text ? text.length : 0;

          if (this.hasCompleter()) {
            if (this.getCompleterWidget().canAutoNext()) {
              return true;
            }
          }

          if (size > 0) {
            const cursors = this.getCursors();
            const endReached = cursors.start === cursors.end && cursors.start + 1 > size;

            if (endReached) {
              if (!this._scroll || this._dataTypeWithNoScroll) {
                const displayWidth = this._vmWidth;
                const maxLength = this.getUserInterfaceWidget().isCharLengthSemantics() ? this._maxLength : -1;
                const codepoints = Array.from(text);

                if (text.displayWidth() >= displayWidth || (maxLength > 0 && codepoints.length >= maxLength)) {
                  return true;
                }
              }

              if (this._maxLength > 0) {
                if (!this.getUserInterfaceWidget().isCharLengthSemantics()) {
                  return text.countBytes() >= this._maxLength;
                }

                return text.length >= this._maxLength;
              }
            }
          }

          return false;
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          $super.manageInput.call(this, dataString, event);

          // sometimes we have to display dropdown again without VM interaction
          // case occurs when we select an item, close dropdown and rollback selected item. In this case
          if (this._completerWidget &&
            this.getValue() &&
            this.getValue() === this._oldValue &&
            !this._completerWidget.isVisible()) {
            this._completerWidget.show();
          }

          this.controlValueLength(event);
          if (!this.getInputTextState().isRestored()) {
            if (this.hasCompleter()) {
              this.cancelCompleterValueChangedDelayer();
              this._completerValueChangedDelayer = this._registerTimeout(function() {
                this.triggerValueChangedEvent(this.getValue());
                this._completerValueChangedDelayer = null;
              }.bind(this), 300); // send value after a 300ms delay
            } else {
              this.triggerValueChangedEvent(this.getValue(), false);
            }
          }

          return true;
        },

        /**
         * Cancel valueChanged delayer (when completer)
         * @returns {boolean} true if timer has been cancelled
         */
        cancelCompleterValueChangedDelayer: function() {
          if (this._completerValueChangedDelayer) {
            this._clearTimeout(this._completerValueChangedDelayer); // clear timer
            this._completerValueChangedDelayer = null;
            return true;
          }
          return false;
        },

        /**
         * Blur handler
         * @param {Object} event
         * @private
         */
        _onBlur: function(event) {
          this.emit(context.constants.widgetEvents.blur, event);
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          if (this._isReadOnly !== readonly) {
            $super.setReadOnly.call(this, readonly);
            this._setInputReadOnly(readonly || this._notEditable || !this._enabled);
          }
        },

        /**
         * Set input readonly attribute if it doesn't have focus or is noentry.
         * @param {boolean} readonly - true to set the edit part as read-only, false otherwise
         */
        _setInputReadOnly: function(readonly) {
          this._setElementAttribute('readonly', readonly ? 'readonly' : null, "_inputElement");
        },

        /**
         * @inheritDoc
         */
        setMaxLength: function(maxLength) {
          $super.setMaxLength.call(this, maxLength);
          if (maxLength > 0) {
            // If type is Date, the maxlength is the real input size, so we put the maxlength into the vmWidth
            if (this.getDisplayFormat()?.endsWith("DATE")) {
              this._vmWidth = maxLength;
            }
            this._setElementAttribute('maxlength', maxLength + 1, "_inputElement");
          }
        },

        /**
         * @inheritDoc
         */
        setVMWidth: function(width) {
          // If type is Date, do not override vmWidth as it is set in setMaxLength
          if (!this.getDisplayFormat()?.endsWith("DATE")) {
            $super.setVMWidth.call(this, width);
          }
        },

        /**
         * Defines the alignment of the text in the input
         * @see http://www.w3.org/wiki/CSS/Properties/text-align
         * @param {string} align - a CSS text alignment. null restores the default value.
         * @publicdoc
         */
        setTextAlign: function(align) {
          this._textAlign = align;
          this.setStyle('>input', {
            'text-align': align
          });

          this.setStyle('>input:focus', {
            'text-align': align
          });
        },

        /**
         * Define the 'size' attribute of the input
         * @param {number} cols - size attribute
         * @publicdoc
         */
        // TODO: GBC-3740 missing redefinition in buttonedit (unlike all others public methods) ? why ?
        setCols: function(cols) {
          this._inputElement.setAttribute('size', cols);
        },

        /**
         * Get the alignment of the text
         * @see http://www.w3.org/wiki/CSS/Properties/text-align
         * @returns {string} a CSS text alignment
         * @publicdoc
         */
        getTextAlign: function() {
          return this.getStyle('>input', 'text-align');
        },

        /**
         * Check if the widget format is number
         * @return {boolean} true if the widget format is number, false otherwise
         */
        isNumber: function() {
          const regex = /SMALLINT|INTEGER|BIGINT|INT|DECIMAL|MONEY|SMALLFLOAT|FLOAT/g;
          const match = regex.exec(this.getDisplayFormat());
          return Boolean(match);
        },

        /**
         * Get the display format if any
         * @return {?string} the display format
         * @publicdoc
         */
        getDisplayFormat: function() {
          return this._displayFormat;
        },

        /**
         * Set current display format to use on each set value
         * @param {string} format - display format
         * @publicdoc
         */
        setDisplayFormat: function(format) {
          this._displayFormat = format;
        },

        /**
         * @inheritDoc
         */
        traditionalDisplay: function(letterSpacing, fieldHeight, heightPadding) {
          const layoutInfo = this.getLayoutInformation();

          if (layoutInfo) {
            const left = layoutInfo.getGridX() - 1;
            const top = (layoutInfo.getGridY()) * (fieldHeight + 2 * heightPadding) + heightPadding;
            const width = layoutInfo.getGridWidth() + 1;
            const height = layoutInfo.getGridHeight() * fieldHeight;

            const style = this._element.parentElement.style;
            layoutInfo.getHostElement().toggleClass(layoutInfo.className, true);
            style.left = 'calc(' + left + 'ch + 1ch / 2 + ' + left + ' * ' + letterSpacing + ')';
            style.top = top + 'px';
            style.width = 'calc(' + width + 'ch + ' + width + ' * ' + letterSpacing + ')';
            style.height = height + 'px';
          }
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          $super.setValue.call(this, value, fromVM, cursorPosition);
          this._inputElement.value = value;

          try {
            if (cursorPosition !== null && this.isEnabled()) {
              this._inputElement.selectionStart = this._inputElement.selectionEnd = cursorPosition;
            }
          } catch (e) {}
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          let result = null;
          if (this._inputElement) {
            result = this._inputElement.value;
            if (this.isEditing()) {
              if (this.getTextTransform() === 'up') {
                result = result.toLocaleUpperCase();
              }
              if (this.getTextTransform() === 'down') {
                result = result.toLocaleLowerCase();
              }
            } else if (this._editingTime === 0 && this._oldValue) { // not touched by user
              // return exact VM value to avoid bad conversion from \r to \n
              result = this._valueStack[this._valueStackCursor];
            }
          }
          return result;
        },

        /**
         * Set the cursors
         * When cursor2 === cursor, it is a simple cursor set
         * @param {number} cursor - the selection range beginning (-1 for end)
         * @param {number=} [cursor2] - the selection range end, if any
         * @publicdoc
         */
        setCursors: function(cursor, cursor2) {
          if (!cursor2) {
            cursor2 = cursor;
          }

          if (cursor2 && cursor2 < 0) {
            cursor2 = this.getValue() && this.getValue().length || 0;
          }

          if (this.isInTable() && !this.isEnabled()) { // fix for GBC-1170
            cursor = cursor2 = 0;
          }

          this._inputElement.setCursorPosition(cursor, cursor2);
        },

        /**
         * Get cursors
         * @return {{start: number, end: number}} object with cursors
         * @publicdoc
         */
        getCursors: function() {
          const cursors = {
            start: 0,
            end: 0
          };
          if (this._inputElement && this._inputElement.value) {
            try {
              cursors.start = this._inputElement.selectionStart;
              cursors.end = this._inputElement.selectionEnd;
            } catch (ignore) {
              // Some input types don't allow cursor manipulation
            }
          }
          return cursors;
        },

        /**
         * Set field as a password (displays bullets instead of value)
         * @param {boolean} isPassword - true if the widget should be in 'password' mode, false otherwise
         * @publicdoc
         */
        setIsPassword: function(isPassword) {
          if (isPassword) {
            this._inputElement.setAttribute('type', 'password');
          } else {
            this._inputElement.setAttribute('type', this._inputType);
            this.setType(this._inputType);
          }
          this.toggleClass("gbc_isPassword", Boolean(isPassword));
        },

        /**
         * Check if field is set as password
         * @returns {boolean} true if the widget is in 'password' mode, false otherwise
         * @publicdoc
         */
        isPassword: function() {
          return this._inputElement.getAttribute('type') === 'password';
        },

        /**
         * Display or not the caps lock warning
         * @private
         */
        _updateCapsLockWarning: function() {
          if (this.isPassword()) {
            // Check if caps lock is on, and display accordingly
            if (!window.browserInfo.isSafari) { // Safari add this by itself
              this.removeClass("capsOn");
              if (window._capsLock) {
                this.addClass("capsOn");
              }
            }
          }
        },

        /**
         * Used to manage the keyboardHint.
         * @param {string} valType the type attribute value to set
         * @publicdoc
         */
        setType: function(valType) {
          if (this._inputType !== valType) {
            this._inputType = valType;
            if (!this.isPassword()) {
              this._inputElement.setAttribute('type', valType);
              if (window.browserInfo.isFirefox) {
                // sad old browser patch
                this._inputElement.setAttribute('step', valType === 'number' ? 'any' : null);
              }
            }
          }
        },

        /**
         * Used to manage the keyboardHint.
         * @param {string} valType the inputmode attribute value to set
         * @publicdoc
         */
        setInputMode: function(valType) {
          if (this._inputMode !== valType) {
            this._inputMode = valType;
            this._inputElement.setAttribute('inputmode', valType);
          }
        },

        /**
         * Get the type of the field
         * @returns {string} this Edit current type
         * @publicdoc
         */
        getType: function() {
          return this._inputType;
        },

        /**
         * Get the inputMode of the field
         * @returns {string} this Edit current type
         * @publicdoc
         */
        getInputMode: function() {
          return this._inputMode;
        },

        /**
         * Sets the focus to the widget
         * @publicdoc
         */
        setFocus: function(fromMouse) {
          $super.setFocus.call(this, fromMouse);

          this._inputElement.domFocus();
          this._updateCapsLockWarning();

          if (this.isFakePlaceholder() && this._title &&
            ((window.isMobile() && context.ThemeService.getValue("gbc-Edit-mobile-comment-to-placeholder") === '1') ||
              (!window.isMobile() && context.ThemeService.getValue("gbc-Edit-desktop-comment-to-placeholder") === '1'))) {
            this.setPlaceHolder(this._title, true);
          }
        },

        /**
         * @inheritDoc
         */
        setDialogType: function(dialogType) {
          $super.setDialogType.call(this, dialogType);
        },

        /**
         * @inheritDoc
         */
        loseVMFocus: function(vmNewFocusedWidget = null) {
          $super.loseVMFocus.call(this, vmNewFocusedWidget);
          if (this.isFakePlaceholder()) {
            this.setPlaceHolder("", true);
          }
        },

        /**
         * @inheritDoc
         */
        loseFocus: function() {
          $super.loseFocus.call(this);
          if (this.isFakePlaceholder()) {
            this.setPlaceHolder("", true);
          }
          if (this._completerWidget) {
            this._completerWidget.loseFocus();
          }
        },

        /**
         * Check if the Edit Widget has a completer
         * @return {boolean} true if it has a completer, false otherwise
         */
        hasCompleter: function() {
          return this.getCompleterWidget() !== null;
        },

        /**
         * Get the completer widget if any
         * @return {?classes.CompleterWidget} the completer widget, null if none
         * @publicdoc
         */
        getCompleterWidget: function() {
          return this._completerWidget;
        },

        /**
         * Will add a completer to the edit
         * @publicdoc
         */
        addCompleterWidget: function() {
          if (!this._completerWidget) {
            this._completerWidget = cls.WidgetFactory.createWidget('Completer', this.getBuildParameters());
            this._completerWidget.addCompleterWidget(this);
            this._completerCurrentChildrenChangeHandler = this._completerWidget.onCurrentChildrenChange(function(value) {
              this.setEditing(this._oldValue !== value);
              this.setValue(value);
            }.bind(this));
          }
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          if (this._textAlign) {
            this.setTextAlign(this._textAlign);
          }
        },

        /**
         * @inheritDoc
         */
        setTitle: function(title) {
          $super.setTitle.call(this, title);

          if (title === "") {
            this._inputElement.removeAttribute("aria-label");
            this._title = null;
          } else {
            this._inputElement.setAttribute("aria-label", title);
            this._title = title;
          }
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          if (this._parentWidget instanceof cls.ComboBoxWidget) {
            return this._parentWidget.getContextMenuAuthorizedActions();
          }

          return $super.getContextMenuAuthorizedActions.call(this);
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Edit', cls.EditWidget);
    cls.WidgetFactory.registerBuilder('EditWidget', cls.EditWidget);
  });
