/// FOURJS_START_COPYRIGHT(D,2024)
/// Property of Four Js*
/// (c) Copyright Four Js 2024, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('InputPictureWidgetComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * Input Picture Widget Component
     * Manage the input picture (mask)
     * @class InputPictureWidgetComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.InputPictureWidgetComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {

      return /** @lends classes.InputPictureWidgetComponent.prototype */ {
        __name: "InputPictureWidgetComponent",

        /** @type {?string} */
        _picture: null,

        /** @type Object */
        _groups: null,

        /**
         * Manage input
         * @param {String} [dataString] - string with the inserted characters
         * @param {*} [event] - input event from DOM
         */
        manageInput: function(dataString = "", event = null) {
          // Picture mask don't apply in Construct
          if (this.getWidget().getDialogType() === "Construct") {
            return;
          }
          if (dataString === "") {
            return;
          }

          const widget = /** @type {classes.FieldWidgetBase} */ this.getWidget();
          const inputElement = widget.getInputElement();
          const inputTextState = widget.getInputTextState();

          // restore value before input
          inputElement.value = inputTextState.getBackupText();
          inputTextState.setRestored(true);

          // Specific code for composition event (Android hack)
          if (event?.inputType === "insertCompositionText") {
            // restore cursors (select only last char)
            inputTextState.restoreFromEndCursors(1);
            // try to only the last char of composition
            this._onPictureStringInput(dataString.slice(-1));
            return;
          }

          // Specific code for backspace
          if (event?.inputType === "deleteContentBackward") {
            // restore cursors
            inputTextState.restoreCursors();
            const processed = this.manageKeyDown("backspace", null, false);
            inputTextState.setRestored(!processed);
            return;
          }

          // restore cursors
          inputTextState.restoreCursors();

          // try to add new data string
          this._onPictureStringInput(dataString);
        },

        /**
         * manageKeyDown method.
         * @param {string} keyString - key combination
         * @param {object} domKeyEvent
         * @param {boolean} repeat
         * @returns {boolean} true if key has been processed
         * @private
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          const widget = /** @type {classes.FieldWidgetBase} */ this.getWidget();

          // Picture mask don't apply in Construct
          if (this.getWidget().getDialogType() === "Construct") {
            return false;
          }

          if (widget.isEnabled() && !widget.isReadOnly()) {

            const input = /** @type {HTMLInputElement} */ widget.getInputElement();
            const start = input.selectionStart;
            const value = input.value;
            let cursor = this._getNextCursor(start, value.length);

            // Manage picture specific special keys (left, right, backspace, del), then execute widget manageKeyDown rules.
            switch (keyString) {
              case widget.getStart():
                cursor = this._getPreviousCursor(start);
                if (cursor) {
                  input.setCursorPosition(cursor.start, cursor.start + 1);
                  keyProcessed = true;
                }
                break;
              case widget.getEnd():
                cursor = this._getNextCursor(start, value.length);
                if (cursor) {
                  input.setCursorPosition(cursor.start, cursor.start + 1);
                  keyProcessed = true;
                }
                break;
              case "backspace":
                keyProcessed = this._onPictureBackspaceKey();
                break;
              case "del":
              case "delete":
                keyProcessed = this._onPictureDeleteKey();
                break;
            }
          }

          if (keyProcessed) {
            return true;
          } else if (cls.KeyboardHelper.isSpecialCommand(keyString)) { // let browser manages native combination
            return false;
          }
        },

        /**
         * @returns {?string} The picture string
         */
        getPicture: function() {
          return this._picture;
        },

        /**
         * @param {string} picture - set the picture string
         */
        setPicture: function(picture) {
          this._picture = picture;

          this._groups = [];

          for (const element of this._picture) {
            this._groups.push(this._createGroup(element));
          }
        },

        /**
         * Parse the PICTURE letter and get a corresponding group rule
         * @param type
         * @returns {Object}
         * @private
         */
        _createGroup: function(type) {
          const group = {};
          switch (type) {
            case 'A': // Alpha numeric
              group.isEditable = true;
              group.isValid = cls.KeyboardHelper.isLetter;
              break;
            case '#': // Numeric only
              group.isEditable = true;
              group.isValid = cls.KeyboardHelper.isNumeric;
              break;
            case 'X': // All
              group.isEditable = true;
              group.isValid = cls.KeyboardHelper.isChar;
              break;
            default: // Mask separator
              group.isEditable = false;
              group.isValid = null;
              group.separator = type;
          }
          return group;
        },

        /**
         * Insert string at correct position if allowed by PICTURE mask. Otherwise, do nothing
         * @param {string} str
         * @private
         */
        _onPictureStringInput: function(str) { // paste

          const widget = /** @type {classes.FieldWidgetBase} */ this.getWidget();
          const input = /** @type {HTMLInputElement} */ widget.getInputElement();

          // Build new value till no conflict is met. when one conflict is met, take mask value for all remaining length.
          let newValue = "";
          let j = 0;

          const mask = this._picture;
          const pastedTextLength = str?.length || 0;

          let start = input.selectionStart;
          if (start === null) {
            return;
          }

          let value = input.value;
          let cursor = this._getNextCursor(start, value.length);

          // start at first editable position from cursor position (editable group)
          while (this._groups[start] && !this._groups[start].isEditable) {
            const separator = this._groups[start].separator;
            if (value[start] !== separator) {
              input.value = value = (value.substring(0, start) + separator + value.substring(start + 1));
              cursor = this._getNextCursor(start + 1, value.length);
            }
            start++;
          }

          // loop length will depend on parsedText length. If parsedText length is higher than mask (data.groups), we take mask length
          const length = pastedTextLength;
          let i = start;
          while (j < length) { // loop on each pastedText char from starting cursor position
            if (i >= this._groups.length) { // end of editable zone
              break;
            }
            const group = this._groups[i];
            if (!group.isEditable) { // separator are kept intact --> copy them into new value
              const separator = mask[i];
              newValue += separator;
              if (separator === str[j]) { // if current pasted char == current group seperator, we will not analyse it afterward
                j++;
              }
            } else { // current group is editable, check if current pasted char is valid
              let char = str[j];
              if (group.isValid && group.isValid(char)) {
                // if previously no conflict met and current char is valid, we add it to new value
                newValue += char;
                j++;
              } else { // char is not valid, take mask value (whitespace since it's not a separator)
                break;
              }
            }
            i++;
          }

          if (newValue !== "") {
            const existingValue = input.value;
            // Set input new value
            input.value = existingValue.substring(0, start) + newValue + existingValue.substring(start + newValue.length);
            const cursors = this._getNextCursor(i - 1, input.value.length);
            input.setCursorPosition(cursors.start, cursors.end);
            widget._editingTime = Date.now();
            widget.setEditing(widget.isEditing() || widget.getValue() !== widget._oldValue);

            // Picture has changed the widget value so set restored to false
            widget.getInputTextState().setRestored(false);
          }
        },

        /**
         * Manage backspace key. Erase previous key if allowed to.
         * @returns {boolean}
         * @private
         */
        _onPictureBackspaceKey: function() {
          const widget = /** @type {classes.FieldWidgetBase} */ this.getWidget();
          const input = widget.getInputElement();
          const start = input.selectionStart;
          const end = input.selectionEnd;

          const manySelected = end - start > 1;

          const cursor = this._getPreviousCursor(start);
          if (cursor || manySelected) {
            const value = input.value;

            // Correctly remove many char at the same time
            if (manySelected) {
              this._removeManyChars(input);
            } else {
              input.value = (value.substring(0, cursor.start) + ' ' + value.substring(cursor.start + 1));
              input.setCursorPosition(cursor.start, cursor.start + 1);
            }
            widget._editingTime = Date.now();
            widget.setEditing(widget.isEditing() || widget.getValue() !== widget._oldValue);
          }
          return true;
        },

        /**
         * Manage delete key.
         * @returns {boolean}
         * @private
         */
        _onPictureDeleteKey: function() {
          const widget = /** @type {classes.FieldWidgetBase} */ this.getWidget();
          const input = widget.getInputElement();
          const start = input.selectionStart;
          const end = input.selectionEnd;

          const value = input.value;
          let cursor = {
            start: start,
            end: start + 1
          };
          const manySelected = end - start > 1;
          if (manySelected) {
            this._removeManyChars(input);
          } else {
            if (start < value.length) {
              if (this._groups[start].isEditable) {
                input.value = (value.substring(0, start) + ' ' + value.substring(start + 1));
              }
              if (!this._groups[start].isEditable) {
                cursor = this._getNextCursor(start, value.length);
              }
              input.setCursorPosition(cursor.start, cursor.end);
            }
          }
          widget._editingTime = Date.now();
          widget.setEditing(widget.isEditing() || widget.getValue() !== widget._oldValue);
          return true;
        },

        /**
         * Remove all selected chars from PICTURE mask
         * @param input
         * @private
         */
        _removeManyChars: function(input) {
          const value = input.value;
          const start = input.selectionStart;
          const end = input.selectionEnd;

          const resultArray = value.split("");
          let tmpStart = start;

          while (this._groups.length > tmpStart && tmpStart !== end) {
            if (this._groups[tmpStart].isEditable) {
              resultArray[tmpStart] = " ";
            }
            tmpStart++;
          }
          let jumpStart = 0;
          let jumpStop = 0;

          // Set the cursor correctly
          while (this._groups[start + jumpStart] && !this._groups[start + jumpStart].isEditable) {
            jumpStart++;
          }
          while (this._groups[end + jumpStop - 1] && !this._groups[end + jumpStop - 1].isEditable) {
            jumpStop++;
          }
          input.value = resultArray.join("");
          input.setCursorPosition(start + jumpStart, end - jumpStop);
        },

        /**
         * Get previous editing position
         * @param ind
         * @returns {*}
         * @private
         */
        _getPreviousCursor: function(ind) {
          if (ind === 0) {
            return null;
          }
          let start = ind;
          let jump = false;
          while (start > 0 && this._groups[start - 1] && !this._groups[start - 1].isEditable) {
            jump = true;
            start--;
          }
          if (start === 0) {
            return null;
          } else {
            return {
              start: start - 1,
              jump: jump
            };
          }
        },

        /**
         * Get next editing position
         * @param ind
         * @param length
         * @returns {{start: *, end: *, jump: boolean}}
         * @private
         */
        _getNextCursor: function(ind, length) {
          let start = ind + 1;
          let jump = false;
          while (this._groups.length > start && !this._groups[start].isEditable) {
            jump = true;
            start++;
          }
          let end = start;
          if (start < length) {
            end = start + 1;
          }
          return {
            start: start,
            end: end,
            jump: jump
          };
        },

      }; // End return
    }); // End Class
  } // JS Face Function
); // End Modulum
