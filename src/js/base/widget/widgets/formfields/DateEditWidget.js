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

modulum('DateEditWidget', ['DateEditWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * DateEdit widget using pikaday.
     * @class DateEditWidget
     * @memberOf classes
     * @extends classes.DateEditWidgetBase
     * @publicdoc Widgets
     */
    cls.DateEditWidget = context.oo.Class(cls.DateEditWidgetBase, function($super) {
      return /** @lends classes.DateEditWidget.prototype */ {
        __name: 'DateEditWidget',

        $static: {
          /**
           * List of calendar days name
           * @type {Array.<string>}
           */
          pikaDaysList: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },

        /**
         * Display or not the week Number
         * @type {?boolean}
         */
        _showWeekNumber: null,

        /**
         * name of the first day of the week
         * @type {string}
         */
        _firstDayOfWeek: null,

        /**
         * Get list of disabled days from calendar
         * @type {Array}
         */
        _disabledDays: null,

        /**
         * Dropdown widget which contains calendar
         * @type {classes.DropDownWidget}
         */
        _dropDown: null,

        /**
         * Button OK of the dropdown
         * @type {classes.ButtonWidget}
         */
        _buttonOk: null,

        /**
         * Button CANCEL of the dropdown
         * @type {classes.ButtonWidget}
         */
        _buttonCancel: null,

        /**
         * List of localized days visible in datepicker
         * @type {Array}
         */
        _localizedDaysList: null,

        /**
         * Reference of calendar instance (based on pikaday-time js library)
         * @type {Object}
         */
        _picker: null,

        /**
         * Type of dropdown. By default, it's in a modal like style
         * @type {boolean}
         */
        _isModal: true,

        /**
         * Listen on theme change to execute a callback
         * @type {function}
         */
        _themeHandleRegistration: null,

        /**
         * Coefficient used as multiplier with default font-size ratio to set dropdown max height
         * @type {number}
         */
        _coeffMaxHeight: 387,
        /**
         * Last user validated value (for calendar of type modal only)
         * @type {string}
         */
        _validValue: null,
        /**
         * Check if current value needs a validation using OK button (for calendar of type modal only)
         * @type {boolean}
         */
        _mustValid: false,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          // create dropdown
          this._createCalendarContainer(true);
        },

        /**
         * Returns dateedit or datetimeedit dropdown
         * @returns {classes.DropDownWidget}
         */
        getDropDown: function() {
          return this._dropDown;
        },

        /**
         * Create calendar container depending on the calendarType 4ST style attribute.
         * By default, we use modal style
         * @param {boolean} isModal - true if we use modal style
         */
        _createCalendarContainer: function(isModal) {

          // destroy previous calendar container
          this._destroyCalendarContainer();

          this._dropDown = cls.WidgetFactory.createWidget('DropDown', this.getBuildParameters());
          this._dropDown.setParentWidget(this);
          this._dropDown.maxHeight = gbc.ThemeService.getValue("theme-font-size-ratio") * this._coeffMaxHeight;
          if (!this._themeHandleRegistration) {
            this._themeHandleRegistration = context.ThemeService.whenThemeChanged(function() {
              this._dropDown.maxHeight = gbc.ThemeService.getValue("theme-font-size-ratio") * this._coeffMaxHeight;
            }.bind(this));
          }

          // For some obscure reasons, iOS may not recognize pikaday library elements as children of dropdown.
          // We need to add a custom "pikaday specific" check
          this._dropDown.shouldClose = function(targetElement) {
            return !targetElement.parent(
              "pika-lendar"); // top pikaday div recognized as (wrongly!) having no parentNode under iOS mobile
          };

          if (isModal) { // MODAL
            // Create button which will close dropdown
            this._buttonCancel = cls.WidgetFactory.createWidget('Button', this.getBuildParameters());
            this._buttonCancel.setParentWidget(this);
            this._buttonCancel.addClass('gbc_DateEditButton');
            this._buttonCancel.setText(i18next.t('gwc.button.cancel'));
            this._buttonCancel.when(context.constants.widgetEvents.click, this._onCancel.bind(this));

            this._buttonOk = cls.WidgetFactory.createWidget('Button', this.getBuildParameters());
            this._buttonOk.setParentWidget(this);
            this._buttonOk.addClass('gbc_DateEditButton');
            this._buttonOk.setText(i18next.t('gwc.button.ok'));
            this._buttonOk.when(context.constants.widgetEvents.click, this._onOk.bind(this));

            this._dropDown.onOpen(this._onCalendarTypeModalOpen.bind(this));
            this._dropDown.onClose(this._onCalendarTypeModalClose.bind(this));

          } else { // DIRECT CLICK
            this._dropDown.onOpen(this._onCalendarTypeDropDownOpen.bind(this));
          }
        },

        /**
         * Destroy calendar container
         * @private
         */
        _destroyCalendarContainer: function() {
          if (this._dropDown) {
            this._dropDown.destroy();
            this._dropDown = null;
          }
          if (this._buttonOk) {
            this._buttonOk.destroy();
            this._buttonOk = null;
          }
          if (this._buttonCancel) {
            this._buttonCancel.destroy();
            this._buttonCancel = null;
          }
          if (this._themeHandleRegistration) {
            this._themeHandleRegistration();
            this._themeHandleRegistration = null;
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {

          this._pikerIcon = null;

          if (this._inputElement) {
            this._inputElement.remove();
            this._inputElement = null;
          }
          if (this._picker) {
            this._picker.destroy();
            this._picker = null;
          }

          this._destroyCalendarContainer();

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled() && this._dropDown.isVisible()) {
            let day = null;
            keyProcessed = true;
            switch (keyString) {
              case "home":
                day = context.dayjs(this._picker.getDate()).startOf('month').toDate();
                break;
              case "end":
                day = context.dayjs(this._picker.getDate()).endOf('month').toDate();
                break;
              case "left":
                day = context.dayjs(this._picker.getDate()).subtract(1, 'days').toDate();
                break;
              case "right":
                day = context.dayjs(this._picker.getDate()).add(1, 'days').toDate();
                break;
              case "up":
                day = context.dayjs(this._picker.getDate()).subtract(1, 'weeks').toDate();
                break;
              case "down":
                day = context.dayjs(this._picker.getDate()).add(1, 'weeks').toDate();
                break;
              case "pageup":
                day = context.dayjs(this._picker.getDate()).subtract(1, 'month').toDate();
                break;
              case "pagedown":
                day = context.dayjs(this._picker.getDate()).add(1, 'month').toDate();
                break;
              case "return":
              case "enter":
                this._onOk();
                break;
              case "esc":
                this._onCancel();
                break;
              case "tab":
              case "shift+tab":
                this._onCancel();
                keyProcessed = false;
                break;
              default:
                keyProcessed = false;
            }

            if (keyProcessed && day) {
              this._keyPressed = true;
              this._picker.setDate(day);
            }

            if (!keyProcessed && !this._isModal) {
              // When using dropdown style for the calendar, key pressed should close calendar
              this._mustValid = false;
              this._dropDown.hide();
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled()) {

            keyProcessed = true;
            switch (keyString) {

              case "alt+up":
              case "alt+down":
                this._dropDown.show();
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
          this._onRequestFocus(domEvent); // request focus

          if (domEvent.target.isElementOrChildOf(this._pikerIcon)) { // click on calendar icon
            // if widget already has VM focus, we need to explicitly set focus to input when clicking on dateedit icon, otherwise keyboard binding are not trapped.
            // if widget doesn't have VM focus, VM will set focus to input.
            if (this.hasFocus() && this.isEnabled() && !this.isModal()) {
              this._inputElement.domFocus();
            }
            this.emit(context.constants.widgetEvents.openDropDown);
          }

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        openDropDown() {
          if (this.isEnabled()) {
            this._dropDown.show();
          }
        },

        /**
         * Shortcut to close the dropdown
         * @param {Boolean} accept - true to simulate OK button, false for Cancel button
         */
        closeDropDown: function(accept) {
          if (accept) {
            this._onOk();
          } else {
            this._onCancel();
          }
        },

        /**
         * Handler to validate current date and send it to VM
         */
        _onOk: function() {
          this._mustValid = false;
          if (!this.getValue()) { // if empty field with enter key pressed on calendar, we set with date of the day
            this._inputElement.value = this.getDate();
          }
          this._dropDown.hide();
          const newValue = this.getValue();
          this.setEditing(newValue !== this._oldValue);
          this.setCursors(newValue.length, -1); // set cursors to the end to help autonext check happening
          this.triggerValueChangedEvent(newValue);
        },

        /**
         * Handler which cancel date modifications and close calendar
         */
        _onCancel: function() {
          this._dropDown.hide();
        },

        // -- Calendar type (Modal/Dropdown) specific functions --

        /**
         * Synchronize field date and picker date on calendar display
         */
        _onCalendarTypeDropDownOpen: function() {
          // init date picker with field date if possible otherwise we set current day date.
          this._dropDown.setAriaSelection();
          this.setDate(this.getValue());
        },

        /**
         * Add buttons in dropdown bellow calendar and synchronize field date and picker date on calendar display
         */
        _onCalendarTypeModalOpen: function() {
          const inputElement = this.getInputElement();
          if (inputElement) {
            inputElement.setAttribute("readonly", "readonly");
          }
          // add buttons
          if (this._dropDown) {
            this._addButtonsToPicker();
          }
          this._validValue = this.getValue();
          this._onCalendarTypeDropDownOpen();
          this._mustValid = true;
        },

        /**
         * Remove buttons from dropdown, cancel pending changes and close calendar
         */
        _onCalendarTypeModalClose: function() {
          this.setAriaSelection();
          const inputElement = this.getInputElement();
          if (inputElement) {
            inputElement.removeAttribute("readonly");
          }
          if (this._dropDown) {
            this._removeButtonsFromPicker();
          }
          if (this._mustValid) {
            this._mustValid = false;
            this.setLastValidValue();
          }
          this._validValue = null;
        },

        /**
         * Handler use to select and validate date on double click
         * @param {string} date - date to take in string format
         */
        _onDateSelect: function(date) {
          this.getInputElement().value = context.dayjs(date).format(this._getPickerConf().format);
          if (!this._keyPressed) {
            // if not modal or double-clicked
            if ((!this.isModal() && this.hasFocus()) || this._isDoubleClick()) {
              this.setEditing(true);
              this._mustValid = false;
              this._dropDown.hide();
              const newValue = this.getValue();
              this.setCursors(newValue.length, -1);
              this.triggerValueChangedEvent(newValue);
            }
          }
          this._keyPressed = false;
        },

        /**
         * Detect double click
         * @returns {boolean} returns true if user double clicked
         */
        _isDoubleClick: function() {
          const inputValue = this.getValue();
          const isDoubleClick = (new Date() - this._lastClick) < 350 && this._lastClickValue === inputValue;
          this._lastClick = new Date();
          this._lastClickValue = inputValue;
          return isDoubleClick;
        },

        /**
         * Needed by picker plugin to avoid formatting before VM send value
         * @param {string} value - value given by picker plugin
         * @param {string=} format - not used by GBC
         * @return {string} the value is return as it
         * @private
         */
        _parse: function(value, format) {
          return value;
        },

        /**
         * Get configuration object used to generate calendar component using pikaday-time framework
         * @returns {Object} returns pikaday-time js library configuration object
         */
        _getPickerConf: function() {
          const pickerConf = {
            field: this._inputElement,
            bound: false,
            container: this._dropDown.getElement(),
            parse: this._parse,
            format: this._displayFormat,
            firstDay: this._firstDayOfWeek || 0,
            showWeekNumber: Boolean(this._showWeekNumber),
            showTime: false,
            disableDayFn: this._disableDayFn,
            yearRange: 100,
            i18n: {
              previousMonth: i18next.t('gwc.date.previousMonth'),
              nextMonth: i18next.t('gwc.date.nextMonth'),
              months: this._localizedMonthsList,
              weekdays: this._localizedDaysList,
              weekdaysShort: this._localizedWeekdaysShortList,
              midnight: i18next.t('gwc.date.midnight'),
              noon: i18next.t('gwc.date.noon')
            },
            setDefaultDate: false
          };
          if (this._useMingGuoYears) {
            pickerConf.onSelect = function(date) {
              const year = date.getFullYear();
              const mgyear = cls.DateTimeHelper.gregorianToMingGuoYears(date);
              const newVal = this.getValue().replace(year, mgyear);
              this._inputElement.value = newVal;
              if (!this.isModal()) {
                this._dropDown.hide();
                this.setCursors(newVal.length, -1);
                this.triggerValueChangedEvent(newVal);
              }
            }.bind(this);
          } else {
            pickerConf.onSelect = this._onDateSelect.bind(this);
          }

          return pickerConf;
        },

        /**
         * Add OK/Cancel buttons to calendar
         */
        _addButtonsToPicker: function() {
          if (this._buttonCancel && this._buttonOk) {
            this._dropDown.getElement().appendChild(this._buttonOk.getElement());
            this._dropDown.getElement().appendChild(this._buttonCancel.getElement());
          }
        },

        /**
         * Remove OK/Cancel buttons to calendar
         */
        _removeButtonsFromPicker: function() {
          if (this._buttonCancel && this._buttonOk) {
            try {
              this._dropDown.getElement().removeChild(this._buttonOk.getElement());
              this._dropDown.getElement().removeChild(this._buttonCancel.getElement());
            } catch (e) {}
          }
        },

        /**
         * Set calendar type. By default, modal type (4ST style) is used.
         * @param {string} calendarType - calendar type
         * @publicdoc
         */
        setCalendarType: function(calendarType) {
          const modalStyle = calendarType !== 'dropdown';
          if (this._isModal !== modalStyle) {
            this._isModal = modalStyle;
            this._createCalendarContainer(modalStyle);
          }
        },

        /**
         * Return calendar type
         * @returns {boolean} true if calendar has modal style
         * @publicdoc
         */
        isModal: function() {
          return this._isModal;
        },

        /**
         * Create the calendar object component and bind it on the input field
         * @publicdoc
         */
        initDatePicker: function() {
          this._localizedDaysList = i18next.t('gwc.date.dayList').split(',');
          this._localizedMonthsList = i18next.t('gwc.date.monthList').split(',');
          this._localizedWeekdaysShortList = i18next.t('gwc.date.weekdaysShort').split(',');

          if (this._picker) {
            this._picker.destroy();
          }
          const pickerConf = this._getPickerConf();
          this._picker = new Pikaday(pickerConf);
          if (!this.isModal()) {
            this._picker.bound = true;
          }
          if (this._picker._onKeyChange) { // remove unwanted native pikaday library event
            document.removeEventListener('keydown', this._picker._onKeyChange, false);
          }
          if (this._dateObj && this._dateObj.isValid()) {

            this._picker.setDate(this._dateObj.toISOString());
          }

          if (this._disabledDays && this._sortedDays) {
            for (const element of this._disabledDays) {
              const index = this._sortedDays.indexOf(element) + (this._showWeekNumber ? 1 : 0);
              this._picker.el.addClass("disabled" + index);
            }
          }
        },

        /**
         * Define first day of the week of the calendar
         * @param {string} firstDayOfWeek - Localized name of the day to set as first day of the week
         * @publicdoc
         */
        setFirstDayOfWeek: function(firstDayOfWeek) {
          if (firstDayOfWeek) {
            const dayList = cls.DateEditWidget.pikaDaysList;

            this._firstDayOfWeek = dayList.indexOf(firstDayOfWeek);
          } else {
            this._firstDayOfWeek = context.dayjs.localeData(context.StoredSettingsService.getLanguage()).firstDayOfWeek();
          }
          if (this._firstDayOfWeek >= 0) {
            const end = cls.DateEditWidget.pikaDaysList.slice(0, this._firstDayOfWeek);
            this._sortedDays = cls.DateEditWidget.pikaDaysList.slice(this._firstDayOfWeek);
            this._sortedDays = this._sortedDays.concat(end);
          }
        },

        /**
         * Returns first day of the week name
         * @returns {string} English name of the currently set first day of the week
         * @publicdoc
         */
        getFirstDayOfWeek: function() {
          const dayList = cls.DateEditWidget.pikaDaysList;
          return dayList[this._firstDayOfWeek];
        },

        /**
         * Return calendar disabled days list
         * @returns {Array} Array of days that are disabled
         * @publicdoc
         */
        getDisabledDays: function() {
          return this._disabledDays;
        },

        /**
         * Define disabled day of the calendar
         * @param {string} disabledDays - names separated with whitespace
         * @publicdoc
         */
        setDisabledDays: function(disabledDays) {
          if (!disabledDays) {
            disabledDays = "saturday sunday";
          }
          // name of disabled days
          this._disabledDays = disabledDays.split(' ');
        },

        /**
         * Generate dayjs date object from a string and set it for both the calendar component and the input field
         * @param {string} date - date value in string format
         * @publicdoc
         */
        setDate: function(date) {
          $super.setDate.call(this, date);

          // on dropdown opening, check if date is valid and set the calendar with it
          if (this._dropDown.isVisible()) {
            const dateObj = this.getDate();
            if (!dateObj || dateObj === 'Invalid date') { // if invalid date, we set with current day date
              this._dateObj = context.dayjs();
            }
            if (this._picker) {
              this._picker.setDate(this._dateObj.toISOString(), true);
              this._inputElement.value = this._dateObj.format(this.getFormat());
            }
          }
        },

        /**
         * Display or hide week number
         * @param {boolean} show - if true display week number, hide otherwise
         * @publicdoc
         */
        showWeekNumber: function(show) {
          this._showWeekNumber = show;
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          if (enabled && !this._picker) { // if first time we enable datepicker, we initialize it
            this.initDatePicker();
          }
          if (this._dropDown) {
            this._dropDown.setEnabled(enabled);
          }
          this._setInputReadOnly(!enabled);
        },

        /**
         * @inheritDoc
         */
        setMaxLength: function(maxLength) {
          $super.setMaxLength.call(this, maxLength);
          if (maxLength > 0) {
            //The maxlength is the real input size, so we put the maxlength into the vmWidth
            //to be able to trigger the AutoNext
            this._vmWidth = maxLength;
          }
        },

        /**
         * @inheritDoc
         */
        setVMWidth: function(width) {}

      };
    });
    cls.WidgetFactory.registerBuilder('DateEdit', cls.DateEditWidget);
  });
