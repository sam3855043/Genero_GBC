/// FOURJS_START_COPYRIGHT(D,2023)
/// Property of Four Js*
/// (c) Copyright Four Js 2023, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('OpenDropDownUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * Handling open drop down on a widget
     *
     *
     * @class OpenDropDownUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.OpenDropDownUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.OpenDropDownUIBehavior.prototype */ {
        /** @type {string} */
        __name: "OpenDropDownUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller?.getWidget()) {
            data.openDropDownHandle = controller.getWidget().when(gbc.constants.widgetEvents.openDropDown, this._onOpenDropDown.bind(
              this, controller, data));
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.openDropDownHandle) {
            data.openDropDownHandle();
            data.openDropDownHandle = null;
          }
        },

        /**
         * Create a command to open drop down
         * @param controller
         * @param data
         * @private
         */
        _onOpenDropDown: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.openDropDown) {
            const anchorNode = controller.getAnchorNode();
            const app = anchorNode.getApplication();
            app.scheduler.openDropDownCommand(anchorNode);
          }
        }
      };
    });
  });
