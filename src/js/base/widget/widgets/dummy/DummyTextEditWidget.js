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

modulum('DummyTextEditWidget', ['TextEditWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TextEdit widget.
     * @class DummyTextEditWidget
     * @memberOf classes
     * @extends classes.TextEditWidget
     */
    cls.DummyTextEditWidget = context.oo.Class(cls.TextEditWidget, function($super) {
      return /** @lends classes.DummyTextEditWidget.prototype */ {
        __name: "DummyTextEditWidget",
        __dataContentPlaceholderSelector: cls.WidgetBase.selfDataContent,

        setHtmlControl: function(jcontrol) {
          jcontrol.innerHTML = this.getValue();
          this._inputElement.replaceWith(jcontrol);
          this._hasHTMLContent = true;
          this._inputElement = jcontrol;
        },

        /**
         * @inheritDoc
         */
        _setValue: function(value, fromVM) {
          this._inputElement.value = value;
        },

        /**
         * @inheritDoc
         */
        setReadOnly: function(readonly) {
          $super.setReadOnly.call(this, readonly);
          this._setInputReadOnly(readonly);
        },

        /**
         * @inheritDoc
         */
        setMaxLength: function(maxLength) {
          // do nothing, no maxlength in Dummy widget
        },

        /**
         * All input widgets in constructs are left aligned (because of search criteria)
         */
        setTextAlign: function(align) {
          this.setStyle({
            "text-align": this.getStart()
          });
        }
      };
    });
    cls.WidgetFactory.registerBuilder('DummyTextEdit', cls.DummyTextEditWidget);
  });
