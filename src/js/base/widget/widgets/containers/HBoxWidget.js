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

modulum('HBoxWidget', ['BoxWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * HBox widget
     * @publicdoc Widgets
     * @class HBoxWidget
     * @memberOf classes
     * @extends classes.BoxWidget
     */
    cls.HBoxWidget = context.oo.Class(cls.BoxWidget, function($super) {
      return /** @lends classes.HBoxWidget.prototype */ {
        __name: "HBoxWidget",

        /** @type {classes.GestureService} */
        _gesture: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          this._orientation = "horizontal";
          $super.constructor.call(this, opts);
          this._element.addClass("g_HBoxLayoutEngine");
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._gesture) {
            this._gesture.destroy();
            this._gesture = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        getDefaultOrientation: function() {
          return "horizontal";
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.HVBoxLayoutEngine(this);
          this._layoutEngine.setOrientation(this._orientation);
        },

        /**
         * Get the widget gesture service
         * @return {classes.GestureService}
         */
        getGestureService: function() {
          return this._gesture;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('HBox', cls.HBoxWidget);
  });
