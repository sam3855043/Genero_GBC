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

modulum('TopMenuDummyController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class TopMenuDummyController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.TopMenuDummyController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.TopMenuDummyController.prototype */ {
        __name: "TopMenuDummyController",

        constructor: function() {
          $super.constructor.call(this, {});
        },

        /**
         * @inheritDoc
         */
        destroy: function() {},

        /**
         * @inheritDoc
         */
        _initBehaviors: function() {},

        setWidget: function(widget) {
          this._widget = widget;
        },

        _createWidget: function(type) {
          //We only want to be able to create virtual widget
          if (this.getWidget()) {
            let params = this.getWidget().getBuildParameters();
            params.realWidget = this._widget;

            return cls.WidgetFactory.createWidget(type, params);
          }
        }
      };
    });
  });
