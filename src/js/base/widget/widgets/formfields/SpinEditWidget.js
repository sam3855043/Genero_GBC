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

modulum('SpinEditWidget', ['SpinEditWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * SpinEdit widget.
     * @class SpinEditWidget
     * @memberOf classes
     * @extends classes.SpinEditWidgetBase
     * @publicdoc Widgets
     */
    cls.SpinEditWidget = context.oo.Class(cls.SpinEditWidgetBase, function($super) {
      return /** @lends classes.SpinEditWidget.prototype */ {
        __name: 'SpinEditWidget',

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this.isEnabled() && !this.isReadOnly()) {

            if (!this.isInArray()) {
              keyProcessed = this._manageNavigationKey(keyString);
            } else {
              if ((keyString === "home" && this.getMin() !== null) || (keyString === "end" && this.getMax() !== null)) {
                return false; // don't process this key
              }
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

          if (this.isEnabled() && !this.isReadOnly()) {
            if (!this.isInArray()) {
              keyProcessed = this._manageNavigationKey(keyString);
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Manage navigation keys
         * @param {string} keyString - key string representation
         * @returns {boolean} returns if the key has been processed
         * @private
         */
        _manageNavigationKey: function(keyString) {
          let keyProcessed = false;
          let updateValue = 0;
          switch (keyString) {
            case "down":
              updateValue = -1;
              break;
            case "pagedown":
              updateValue = -10;
              break;
            case "up":
              updateValue = 1;
              break;
            case "pageup":
              updateValue = 10;
              break;
            case "home":
              const min = this.getMin();
              if (min !== null) {
                this.setEditing(this._oldValue !== min);
                this.setValue(min);
                keyProcessed = true;
              }
              break;
            case "end":
              const max = this.getMax();
              if (max !== null) {
                this.setEditing(this._oldValue !== max);
                this.setValue(max);
                keyProcessed = true;
              }
              break;
          }

          if (!keyProcessed && updateValue !== 0) {
            this._updateValue(updateValue);
            keyProcessed = true;
          }

          if (keyProcessed) {
            this.triggerValueChangedEvent(this.getValue());
          }

          return keyProcessed;
        }

      };
    });
    cls.WidgetFactory.registerBuilder('SpinEdit', cls.SpinEditWidget);
  });
