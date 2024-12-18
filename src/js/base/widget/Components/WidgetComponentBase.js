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

modulum('WidgetComponentBase',
  function(context, cls) {

    /**
     * Widget Component
     * @class WidgetComponentBase
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc
     */
    cls.WidgetComponentBase = context.oo.Class(function() {

      return /** @lends classes.WidgetComponentBase.prototype */ {
        __name: "WidgetComponentBase",

        /**
         * The parent widget
         * @private
         * @type {classes.WidgetBase}
         */
        _widget: null,

        /**
         * @constructs
         * @param {classes.WidgetBase} widget The parent widget
         */
        constructor: function(widget) {
          this._widget = widget;
        },

        /**
         * Destroy properly the component
         */
        destroy: function() {
          this._widget = null;
        },

        /**
         * @returns {classes.WidgetBase} The parent widget
         */
        getWidget: function() {
          return this._widget;
        }
      };
    });
  }
);
