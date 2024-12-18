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

modulum('DummyRadioGroupWidget', ['RadioGroupWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * RadioGroup widget.
     * @class DummyRadioGroupWidget
     * @memberOf classes
     * @extends classes.RadioGroupWidget
     */
    cls.DummyRadioGroupWidget = context.oo.Class(cls.RadioGroupWidget, function($super) {
      return /** @lends classes.DummyRadioGroupWidget.prototype */ {
        __name: "DummyRadioGroupWidget",
        __templateName: "RadioGroupWidget",

        /**
         * @inheritDoc
         */
        getValue: function() {
          let value = "";
          const children = this._element.childrenExcept(this.__charMeasurer);
          for (const item of children) {
            if (item.getElementsByClassName("zmdi")[0].hasClass('checked')) {
              if (value.length !== 0) {
                value += '|';
              }
              value += item.getAttribute('data-value');
            }
          }
          return value;
        },

        /**
         * @inheritDoc
         */
        _setValue: function(value) {
          const values = ("" + value).split('|'),
            children = this._element.childrenExcept(this.__charMeasurer);
          for (const item of children) {
            const checkedElement = item.getElementsByClassName('zmdi')[0];
            // Reset radio checked
            if (values.indexOf(item.getAttribute("data-value")) !== -1) {
              checkedElement.addClass('checked');
              checkedElement.removeClass("unchecked");
            } else {
              checkedElement.addClass('unchecked');
              checkedElement.removeClass("checked");
            }
          }
          this.setEditing(this.getValue() !== this._oldValue);
        },

        /**
         * @param {number} index the value to display
         * @param {boolean} doSetValue
         * @private
         */
        _prepareValue: function(index, doSetValue) {
          let newValue = this.getValue();
          if (this.isEnabled()) {
            this._updateVisualAim();
            const children = this._element.childrenExcept(this.__charMeasurer);
            if (doSetValue) {
              const item = children[index].getElementsByClassName('zmdi')[0];
              item.toggleClass('checked', !item.hasClass('checked'));
              newValue = this.getValue();
              this.setEditing(newValue !== this._oldValue);
            }
          }
          return newValue;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('DummyRadioGroup', cls.DummyRadioGroupWidget);
  });
