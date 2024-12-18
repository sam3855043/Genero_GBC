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

modulum('TimeEditWidget', ['TimeEditWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TimeEdit widget.
     * @class TimeEditWidget
     * @memberOf classes
     * @extends classes.TimeEditWidgetBase
     * @publicdoc Widgets
     */
    cls.TimeEditWidget = context.oo.Class(cls.TimeEditWidgetBase, function($super) {
      return /** @lends classes.TimeEditWidget.prototype */ {
        __name: 'TimeEditWidget',

        /**
         * Array of time fragment HH, MM and SS
         * @type {DateTimeHelper.timeFragment[]}
         */
        _groups: null,

        /**
         * Current cursor position
         * @type {Object}
         */
        _currentCursors: null,

        /**
         * Flag to indicate if valid number has been entered
         * @type {boolean}
         */
        _numericPressed: false,

        /**
         * Up arrow element
         * @type {Element}
         */
        _upArrow: null,

        /**
         * Down arrow element
         * @type {Element}
         */
        _downArrow: null,

        /**
         * Current group of time being updated
         * @type {number}
         */
        _currentGroup: 0,

        /**
         * Previous group of time being updated
         * @type {number}
         */
        _previousGroup: 0,

        /**
         * Last valid time being set
         * @type {?string}
         */
        _lastValid: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._groups = [
            cls.DateTimeHelper.timeFragment(24),
            cls.DateTimeHelper.timeFragment(60),
            cls.DateTimeHelper.timeFragment(60)
          ];
          this._lastValid = '00:00:00';
          this._inputElement = this._element.getElementsByTagName('input')[0];
          this._upArrow = this._element.getElementsByClassName('up')[0];
          this._downArrow = this._element.getElementsByClassName('down')[0];

          this.setValue(this._lastValid);

          this._currentCursors = {
            start: 0,
            end: 0
          };

          this._inputElement.on("change.TimeEditWidget", function(event) {
            this._inputElement.setAttribute("data-time", this._inputElement.value);
          }.bind(this));
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._currentCursors = null;
          this._upArrow = null;
          this._downArrow = null;
          this._inputElement.off('change.TimeEditWidget');
          $super.destroy.call(this);
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

          const target = domEvent.target;
          if (target.isElementOrChildOf(this._upArrow)) {
            this._onUpIcon(domEvent);
          } else if (target.isElementOrChildOf(this._downArrow)) {
            this._onDownIcon(domEvent);
          } else if (target.isElementOrChildOf(this._inputElement)) {
            this._onInputClick(domEvent);
          }

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isEnabled() && !this.isReadOnly()) {

            const start = this._inputElement.selectionStart;
            const end = this._inputElement.selectionEnd;

            keyProcessed = true;
            switch (keyString) {
              case "down":
                const decVal = this._decrease();
                this.triggerValueChangedEvent(decVal);
                break;
              case "up":
                const incVal = this._increase();
                this.triggerValueChangedEvent(incVal);
                break;
              case this.getStart():
              case this.getEnd():
                this._updateCurrentGroup();
                keyProcessed = false; // let the default behavior, just update current group
                break;
              case ":":
              case "shift+:":
              case "ctrl+" + this.getEnd():
                //Update current group of time being selected
                this._moveGroup(1);
                this._updateSelection();
                break;
              case "ctrl+" + this.getStart():
                this._moveGroup(-1);
                this._updateSelection();
                break;
              case "backspace":
                // only whole text or single group selection deletion are permitted
                if (!this.isEditing() && !this.hasFocus()) { // first keydown in typeahead mode (cursors not ready yet)
                  return true;
                }

                if ((start === 0 && this.getValue().length === end) || this.getValue().charAt(end - 1) !== ':') {
                  keyProcessed = false; // let the default behavior
                }
                break;
              case "del":
              case "delete":
                // only whole text or single group selection deletion are permitted
                if (!this.isEditing() && !this.hasFocus()) { // first keydown in typeahead mode (cursors not ready yet)
                  return true;
                }
                // if 2 digits group selected
                if ((start === 0 && this.getValue().length === end) || this.getValue().charAt(end) !== ':' || start === end - 2) {
                  keyProcessed = false; // let the default behavior
                }
                break;
              default:
                keyProcessed = this._processKey(domKeyEvent, keyString);
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Validate current group of time and eventually update set next group as current
         * @inheritDoc
         */
        manageKeyUp: function(keyString, domKeyEvent) {
          $super.manageKeyUp.call(this, keyString, domKeyEvent);

          // if key pressed was delete or backspace, we do not update current group
          const key = cls.KeyboardApplicationService.keymap[domKeyEvent.which];
          const groupChanged = (key === "del" || key === "delete" || key === "backspace") ? false : this._updateCurrentGroup();
          let groupComplete = true;
          let modificationDone = false;
          if (this._numericPressed) {
            modificationDone = true;
            this._numericPressed = false; // important to set it back to false since keypress event isn't raised for special command
            groupComplete = this._updateGroups(this.getValue());
            if (groupComplete) {
              if (this._currentGroup < this._groups.length - 1) {
                this._moveGroup(1);
                this._updateSelection(); // only highlight group if we are not at the end
              } else { // sync true cursors with saved cursors
                this.setCursors(this._inputElement.selectionStart, this._inputElement.selectionEnd, true);
              }
            }
          }
          if (modificationDone && (groupChanged || groupComplete)) {
            //An autoNext can be done only if the last key is a number in the last group and the value is valid
            this.triggerValueChangedEvent(this.getValue(), false);
          }
        },

        /**
         * Process one key event
         * @param {Object} event
         * @param {string} keyString
         * @returns {boolean} true if key has been processed, false otherwise
         */
        _processKey: function(event, keyString) {
          const isModifier = cls.KeyboardHelper.isSpecialCommand(keyString);
          const isValid = !isModifier && cls.KeyboardHelper.isNumeric(event.gbcKey) && !this._isMaxLength();

          this._numericPressed = isValid;

          // timeedit is empty : we need to initialise its format on first numeric pressed
          if (isValid && this.getValue().length === 0) {
            this._updateFromGroups();
            this._updateSelection();
          }

          if (!isValid && !isModifier && cls.KeyboardHelper.isChar(keyString)) {
            event.preventCancelableDefault();
            return true;
          }

          return false;
        },

        /**
         * @inheritDoc
         */
        canAutoNext: function() {
          const currentValue = this.getValue();
          const size = currentValue ? currentValue.length : 0;

          if (size > 0) {
            const cursors = this.getCursors();
            const endReached = cursors.start === cursors.end && cursors.end + 1 > size && this._groups.length * 2 + this._groups.length -
              1 === currentValue.length && this
              ._previousGroup + 1 === this._groups.length;
            const isLastCharNumeric = cls.KeyboardHelper.isNumeric(currentValue[currentValue.length - 1]);

            return endReached && isLastCharNumeric;
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        manageInput: function(dataString = "", event = null) {
          $super.manageInput.call(this, dataString, event);

          // if input event come is InputText it means control length has already been done by manageKeyDown
          if (!event || event.inputType !== "insertText") {
            this.controlValueLength(event);
          }
        },

        /**
         * @inheritDoc
         */
        _checkValue: function(text, newTextPart) {
          if (this._dialogType !== 'Input' && this._dialogType !== 'InputArray') {
            return newTextPart;
          }

          newTextPart = this.checkValueDisplayWidth(text, newTextPart);

          return newTextPart;
        },

        /**
         * Increase the current group value and update current group selection if needed
         */
        _increase: function() {
          this.setEditing(true);
          if (this._groups[this._currentGroup].increaseValue()) {
            if (this._currentGroup > 0 && this._groups[this._currentGroup - 1].increaseValue()) {
              if (this._currentGroup > 1) {
                this._groups[0].increaseValue();
              }
            }
          }
          const newValue = this._updateFromGroups();
          if (this.hasFocus()) {
            this._updateSelection();
          }
          return newValue;
        },

        /**
         * Decrease the current group value
         */
        _decrease: function() {
          this.setEditing(true);
          if (this._groups[this._currentGroup].decreaseValue()) {
            if (this._currentGroup > 0 && this._groups[this._currentGroup - 1].decreaseValue()) {
              if (this._currentGroup > 1) {
                this._groups[0].decreaseValue();
              }
            }
          }
          const newValue = this._updateFromGroups();
          if (this.hasFocus()) {
            this._updateSelection();
          }
          return newValue;
        },

        /**
         * Changes the current group
         * @param {number} where - group index
         */
        _moveGroup: function(where) {
          if (where < 0) {
            if (this._currentGroup !== 0) {
              this._previousGroup = this._currentGroup;
              this._currentGroup = this._currentGroup + where;
            }
          } else {
            if (this._currentGroup < this._groups.length - 1) {
              this._previousGroup = this._currentGroup;
              this._currentGroup = this._currentGroup + where;
            }
          }
        },

        /**
         * Updates the current group depending on the cursor position
         * @returns {boolean} true if the current group has changed, false otherwise
         */
        _updateCurrentGroup: function() {
          const value = this.getValue(),
            firstColon = value.indexOf(':'),
            secondColon = value.lastIndexOf(':');
          const position = this._inputElement.selectionEnd;
          let newPosition = 0;
          let oldPosition = this._currentGroup;
          if (secondColon !== -1) {
            newPosition = position <= firstColon ? 0 : (firstColon === secondColon || position <= secondColon ? 1 : 2);
          } else {
            oldPosition = 0;
          }
          oldPosition = Math.min(this._currentGroup, oldPosition);

          this._previousGroup = this._currentGroup;
          this._currentGroup = newPosition;
          const hasChanged = newPosition !== oldPosition;
          if (hasChanged && !this._isGroupComplete(oldPosition)) {
            this._updateFromGroups();
          }
          return hasChanged;
        },

        /**
         * Indicates if group is complete
         * @param {number} groupIndex - cursor position of group to test
         * @returns {boolean} true if group is complete
         */
        _isGroupComplete: function(groupIndex) {
          const value = this.getValue().split(':');
          return this._groups[groupIndex].fromText(value[groupIndex]);
        },

        /**
         * Update current group time value
         * @param {string} value - time value
         * @param {boolean} [force] - if true we consider this value is valid
         * @returns {boolean} true if group is complete
         */
        _updateGroups: function(value, force) {
          let complete = true;
          if (!this._useSeconds && this._groups.length === 3) {
            this._groups.pop();
          }
          for (let i = 0; i < this._groups.length; i++) {
            complete = complete && this._isGroupComplete(i);
          }
          if (complete || force) {
            this._updateFromGroups();
            this._lastValid = this.getValue();
          }
          return complete;
        },

        /**
         * Rebuilds the value from groups
         */
        _updateFromGroups: function() {
          let value = '';
          for (let i = 0; i < this._groups.length; i++) {
            value += (i > 0 ? ':' : '') + this._groups[i].getText();
          }
          if (this.hasFocus()) { // do not update value if typeahead is active (mouse click)
            this.setValue(value);
          }
          return value;
        },

        /**
         * Updates the selection range based on current group
         */
        _updateSelection: function() {
          let start = this._currentGroup * 3;
          if (start < 0) {
            start = 0;
          }
          if (start + 2 <= this.getValue().length) {
            this.setCursors(start, start + 2, true);
          }
        },

        /**
         * Handler which updates current group of time being updated
         * @param {UIEvent} event - DOM event
         */
        _onInputClick: function(event) {
          if (this.isEnabled() && !this.isReadOnly() && this.getValue() !== '') {
            // on-click we update current time group and update selection/cursors in consequence
            this._updateCurrentGroup();
            this._updateSelection();
          }
          this._onRequestFocus(event); // request focus
        },

        /**
         * @inheritDoc
         */
        _onUpIcon: function(evt) {
          if (this.isEnabled() && !this.isReadOnly()) {
            this._onRequestFocus(evt); // request focus
            if (this.hasFocus()) { // focus input element before updating its cursors
              this._inputElement.domFocus();
            }
            const newValue = this._increase();
            this.triggerValueChangedEvent(newValue);
          }
        },

        /**
         * @inheritDoc
         */
        _onDownIcon: function(evt) {
          if (this.isEnabled() && !this.isReadOnly()) {
            this._onRequestFocus(evt); // request focus
            if (this.hasFocus()) { // focus input element before updating its cursors
              this._inputElement.domFocus();
            }
            const newValue = this._decrease();
            this.triggerValueChangedEvent(newValue);
          }
        },

        /**
         * Get cursors
         * @return {{start: number, end: number}} object with cursors
         * @publicdoc
         */
        getCursors: function() {
          return this._currentCursors;
        },

        /**
         * Place the cursor at the given position,
         * @param {number} cursor - first cursor position
         * @param {number} cursor2 - second cursor position
         * @param {Boolean} doNotUpdateGroup
         */
        setCursors: function(cursor, cursor2, doNotUpdateGroup) {
          let start = cursor;
          let end = cursor2;
          if (cursor2 === -1) {
            start = 0;
            end = 2;
          } else if (!cursor2) { // if cursor2 isn't defined, start cursor is used as end as well
            end = start;
          }
          this._currentCursors.start = start;
          this._currentCursors.end = end;
          this._inputElement.setCursorPosition(start, end);
          if (!doNotUpdateGroup) {
            this._updateCurrentGroup();
          }
          if (!cursor2) { // if cursor2 isn't defined or set to 0, we need to fallback selection to current group
            this._updateSelection();
          }
        },

        /**
         * @inheritDoc
         */
        setDisplayFormat: function(format) {
          $super.setDisplayFormat.call(this, format);
          this._updateGroups(this.getValue());
        },

        /**
         * @inheritDoc
         */
        setValue: function(value, fromVM = false, cursorPosition = null) {
          if (this.getValue() !== value) {
            $super.setValue.call(this, value, fromVM, cursorPosition);
            this._updateGroups(value);
          }
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          $super.setFocus.call(this, fromMouse);
          const currentCursors = this.getCursors();
          this.setCursors(currentCursors.start, currentCursors.end);
        }
      };
    });
    cls.WidgetFactory.registerBuilder('TimeEdit', cls.TimeEditWidget);
  });
