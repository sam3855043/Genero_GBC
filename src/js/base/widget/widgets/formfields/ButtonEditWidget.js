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

modulum('ButtonEditWidget', ['FieldWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * ButtonEdit widget.
     * @class ButtonEditWidget
     * @memberOf classes
     * @extends classes.FieldWidgetBase
     * @publicdoc Widgets
     */
    cls.ButtonEditWidget = context.oo.Class(cls.FieldWidgetBase, function($super) {
      return /** @lends classes.ButtonEditWidget.prototype */ {
        __name: 'ButtonEditWidget',
        /**
         * Edit part of the widget
         * @type {classes.EditWidget}
         */
        _edit: null,

        /**
         * Button part of the widget
         * @type {classes.ButtonWidget}
         */
        _button: null,

        /**
         * Redefine where the data is located
         * @type {string}
         */
        __dataContentPlaceholderSelector: '.gbc_dataContentPlaceholder',

        /**
         * Handler for click
         * @function
         */
        _clickHandler: null,

        /**
         * Handler for focus
         * @function
         */
        _focusHandler: null,

        /**
         * Handler for blur
         * @function
         */
        _blurHandler: null,

        /**
         * Handler for change
         * @function
         */
        _changeHandler: null,

        /**
         * Handler for image ready
         * @function
         */
        _imageReadyHandler: null,

        /**
         * Flag to manage if button has been clicked
         * @type {boolean}
         */
        _buttonClicked: false,

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
            this._layoutEngine = new cls.ButtonEditLayoutEngine(this);
            this._layoutInformation.setReservedDecorationSpace(2);

            this._layoutInformation.getSizePolicyConfig().setAllShrinkable(false);
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          this._edit = cls.WidgetFactory.createWidget('EditWidget', this.getBuildParameters());
          this._button = cls.WidgetFactory.createWidget('ButtonWidget', this.getBuildParameters());
          // layout engine can be null if _ignoreLayout is true, which happens for widget being in table and not in first row. (cf constructor of WidgetBase)
          // in that case, we do not want to measure image once loaded
          if (!this._ignoreLayout) {
            this._imageReadyHandler = this._button.when(context.constants.widgetEvents.ready, this._imageLoaded.bind(this));
          }
          this._element.appendChild(this._edit.getElement());
          this._element.appendChild(this._button.getElement());
          this._edit.setParentWidget(this);
          this._button.setParentWidget(this);
          this._clickHandler = this._button.when(context.constants.widgetEvents.click, this._onButtonClick.bind(this));
          this._focusHandler = this._edit.when(context.constants.widgetEvents.requestFocus, this._onEditRequestFocus.bind(this));
          this._blurHandler = this._edit.when(context.constants.widgetEvents.blur, this._onEditBlur.bind(this));
          this._changeHandler = this._edit.when(context.constants.widgetEvents.valueChanged, this._onEditChange.bind(this));
        },

        /**
         * Handler called when the button image is loaded
         */
        _imageLoaded: function(event, src) {
          this._layoutEngine.invalidateMeasure();
          this.emit(context.constants.widgetEvents.ready);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._clickHandler();
          this._clickHandler = null;
          this._focusHandler();
          this._focusHandler = null;
          this._blurHandler();
          this._blurHandler = null;
          this._changeHandler();
          this._changeHandler = null;
          this._edit.destroy();
          this._edit = null;
          this._button.destroy();
          this._button = null;

          if (this._completerWidget) {
            this._completerWidget.destroy();
            this._completerWidget = null;
          }
          if (this._imageReadyHandler) {
            this._imageReadyHandler();
            this._imageReadyHandler = null;
          }

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageClipboardPaste: function(text) {
          this._edit.manageClipboardPaste(text);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          return this._edit.managePriorityKeyDown(keyString, domKeyEvent, repeat);
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          return this._edit.manageKeyDown(keyString, domKeyEvent, repeat);
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          this._edit.manageInput(dataString, event);
        },

        /**
         * Handler when click on button
         * @param {Object} event - DOM event
         * @param sender
         * @param domEvent
         */
        _onButtonClick: function(event, sender, domEvent) {
          if (this.isEnabled()) {
            this.emit(context.constants.widgetEvents.requestFocus, domEvent);
            this.emit(context.constants.widgetEvents.click, domEvent, !this.hasDOMFocus());
          }
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
         * Handler when edit is blured
         * @param event
         * @param sender
         * @param domEvent
         */
        _onEditBlur: function(event, sender, domEvent) {
          this.emit(context.constants.widgetEvents.blur, domEvent);
        },

        /**
         * Handler when edit content changes
         * @param {object} event - dom event
         * @param {HTMLElement} sender - source element
         * @param {string} newValue - new value of the widget
         * @param {boolean} sendValue - if true new value must be sent to VM
         */
        _onEditChange: function(event, sender, newValue, sendValue) {
          this.emit(context.constants.widgetEvents.valueChanged, newValue, sendValue);
        },

        /**
         * @inheritDoc
         */
        getInputElement: function() {
          return this._edit.getInputElement();
        },

        /**
         * @inheritDoc
         */
        setTitle: function(title) {
          this._edit.setTitle(title);
        },

        /**
         * Set button title from localized text of corresponding action
         * @param actionTitle
         */
        setActionTitle: function(actionTitle) {
          if (actionTitle && actionTitle.length <= 0) {
            this._button.setTitle(this.getTitle());
          } else {
            this._button.setTitle(actionTitle);
          }
        },

        /**
         * @inheritDoc
         */
        getTitle: function() {
          return this._edit.getTitle();
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          this._edit.setReadOnly(readonly);
        },

        /**
         * @inheritDoc
         */
        isReadOnly: function() {
          return this._edit.isReadOnly();
        },

        /**
         * @inheritDoc
         */
        setDataTypeWithNoScroll: function(checkDisplayValue) {
          this._edit.setDataTypeWithNoScroll(checkDisplayValue);
        },

        /**
         * @inheritDoc
         */
        setMaxLength: function(maxLength) {
          this._edit.setMaxLength(maxLength);
        },

        /**
         * @inheritDoc
         */
        getMaxLength: function() {
          return this._edit.getMaxLength();
        },

        /**
         * @inheritDoc
         */
        setScroll: function(scroll) {
          this._edit.setScroll(scroll);
        },

        /**
         * @inheritDoc
         */
        setVMWidth: function(width) {
          this._edit.setVMWidth(width);
        },

        /**
         * @inheritDoc
         */
        canAutoNext: function() {
          return this._edit.canAutoNext();
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          if (this._button) {
            this._button.setDefaultColor(color);
          }
        },

        /**
         * @inheritDoc
         */
        setTextAlign: function(align) {
          this._edit.setTextAlign(align);
        },

        /**
         * @inheritDoc
         */
        getTextAlign: function() {
          return this._edit.getTextAlign();
        },

        /**
         * When cursor2 === cursor, it is a simple cursor set
         * @param {number} cursor - starting cursor position
         * @param {number} cursor2 - ending cursor position
         * @publicdoc
         */
        setCursors: function(cursor, cursor2) {

          if (this._edit) {
            this._edit.setCursors(cursor, cursor2);
          }
        },

        /**
         * Get cursors
         * @return {{start: number, end: number}} object with cursors
         * @publicdoc
         */
        getCursors: function() {
          return this._edit.getCursors();
        },

        /**
         * Get the display format of the edit part
         * @return {string} the display format
         * @publicdoc
         */
        getDisplayFormat: function() {
          return this._edit.getDisplayFormat();
        },

        /**
         * Set the display format of the edit part
         * @param {string} format the display format
         * @publicdoc
         */
        setDisplayFormat: function(format) {
          this._edit.setDisplayFormat(format);
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          this._edit.setValue(value, fromVM, cursorPosition);
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          return this._edit.getValue();
        },

        /**
         * Set the image of the button part
         * @param {string} image - URL of the image to display
         * @publicdoc
         */
        setImage: function(image) {
          this._button.setImage(image);
        },

        /**
         * Get the image of the button part
         * @returns {string} the URL of the image displayed in the button part
         * @publicdoc
         */
        getImage: function() {
          return this._button.getImage();
        },

        /**
         * Defines the widget as autoscalable
         * @param {boolean} enabled the wanted state
         * @publicdoc
         */
        setAutoScale: function(enabled) {
          this._button.setAutoScale(enabled);
        },

        /**
         * Set autoscale value as nnnpx
         * @param {string} value - css string value with valid units
         */
        setScaleIconValue: function(value) {
          this._button.setScaleIconValue(value);
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          this._edit.setEnabled(enabled);
        },

        /**
         * @inheritDoc
         */
        isEnabled: function() {
          return this._edit.isEnabled();
        },
        /**
         * Enable the button
         * @param {boolean} enabled - true if the button should be enabled, false otherwise
         * @publicdoc
         */
        setButtonEnabled: function(enabled) {
          this._button.setEnabled(enabled);
        },

        /**
         * returns whether the button is enabled or not
         * @returns {boolean} true if the button is enabled, false otherwise
         * @publicdoc
         */
        isButtonEnabled: function() {
          return this._button.isEnabled();
        },

        /**
         * sets 'password' mode
         * @param {boolean} isPassword - true if the widget should be in 'password' mode, false otherwise
         * @publicdoc
         */
        setIsPassword: function(isPassword) {
          this._edit.setIsPassword(isPassword);
        },

        /**
         * returns whether the widget should be in 'password' mode or not.
         * @returns {boolean} true if the widget is in 'password' mode, false otherwise
         * @publicdoc
         */
        isPassword: function() {
          return this._edit.isPassword();
        },

        /**
         * Used to manage the keyboardHint.
         * @param {string} valType - the type attribute value to set
         * @publicdoc
         */
        setType: function(valType) {
          this._edit.setType(valType);
        },

        /**
         * @inheritDoc
         */
        setInputMode: function(valType) {
          this._edit.setInputMode(valType);
        },

        /**
         * Get the keyboardHint method
         * @returns {string} this Edit current type
         * @publicdoc
         */
        getType: function() {
          return this._edit.getType();
        },

        /**
         * @inheritDoc
         */
        loseFocus: function() {
          $super.loseFocus.call(this);
          if (this._completerWidget) {
            this._completerWidget.loseFocus();
          }
        },

        /**
         * @inheritDoc
         */
        setDialogType: function(dialogType) {
          $super.setDialogType.call(this, dialogType);

          this._edit.setDialogType(dialogType);
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          $super.setFocus.call(this, fromMouse);

          const inputElement = this._edit.getInputElement();

          if (inputElement) {
            inputElement.domFocus();
          }
        },

        /**
         * @inheritDoc
         */
        flash: function() {
          if (this._edit) {
            this._edit.flash();
          }
        },

        /**
         * Get the Completer widget from the edit
         * @return {classes.CompleterWidget}
         */
        getCompleterWidget: function() {
          return this._edit.getCompleterWidget();
        },

        /**
         * Will add a completer to the edit
         */
        addCompleterWidget: function() {
          this._edit.addCompleterWidget();
        },

        /**
         * return true if edit has a completer
         * @returns {boolean}
         */
        hasCompleter: function() {
          return this._edit.hasCompleter();
        },

        /**
         * Cancel valueChanged delayer (when completer)
         * @returns {boolean} true if timer has been cancelled
         */
        cancelCompleterValueChangedDelayer: function() {
          return this._edit.cancelCompleterValueChangedDelayer();
        },

        /**
         * @inheritDoc
         */
        setColor: function(color) {
          this._edit.setColor(color);
        },

        /**
         * @inheritDoc
         */
        getColor: function() {
          return this._edit.getColor();
        },

        /**
         * @inheritDoc
         */
        getColorFromStyle: function() {
          return this._edit.getColorFromStyle();
        },

        /**
         * @inheritDoc
         */
        setTextTransform: function(transform) {
          this._edit.setTextTransform(transform);
        },

        /**
         * @inheritDoc
         */
        removeTextTransform: function() {
          this._edit.removeTextTransform();
        },

        /**
         * @inheritDoc
         */
        getTextTransform: function() {
          return this._edit.getTextTransform();
        },

        /**
         * @inheritDoc
         */
        setEditing: function(editing) {
          if (this._edit) {
            this._edit.setEditing(editing);
          }
        },

        /**
         * @inheritDoc
         */
        getEditingTime: function() {
          return this._edit.getEditingTime();
        },

        /**
         * @inheritDoc
         */
        isEditing: function() {
          return this._edit.isEditing();
        },

        /**
         * @inheritDoc
         */
        setPlaceHolder: function(placeholder) {
          this._edit.setPlaceHolder(placeholder);
        },

        /**
         * @inheritDoc
         */
        setNotEditable: function(notEditable) {
          this._edit.setNotEditable(notEditable);
        },

        hasDOMFocus: function() {
          return this._edit.hasDOMFocus() || this._button.hasDOMFocus();
        },

        /**
         * @inheritDoc
         */
        isNotEditable: function() {
          return this._edit.isNotEditable();
        },

        /**
         * @inheritDoc
         */
        _preventEditAllowNavigation: function(evt, keyString) {
          this._edit._preventEditAllowNavigation(evt, keyString);
        },

        /**
         * @inheritDoc
         */
        setPicture: function(picture) {
          this._edit.setPicture(picture);
        },

        /**
         * @inheritDoc
         */
        getInputTextState: function() {
          return this._edit.getInputTextState();
        },

      };
    });
    cls.WidgetFactory.registerBuilder('ButtonEdit', cls.ButtonEditWidget);
  });
