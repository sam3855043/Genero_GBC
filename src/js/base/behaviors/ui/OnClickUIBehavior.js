/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('OnClickUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class OnClickUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.OnClickUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.OnClickUIBehavior.prototype */ {
        /** @type {string} */
        __name: "OnClickUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller?.getWidget()) {
            data.clickHandle = controller.getWidget().when(gbc.constants.widgetEvents.click, this._onClick.bind(this, controller,
              data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.clickHandle) {
            data.clickHandle();
            data.clickHandle = null;
          }
        },

        /**
         * Creates an action command
         */
        _onClick: function(controller, data, gbcEvent, element, domEvent, actionOnly) {
          const bindings = controller.getNodeBindings();
          const app = bindings.anchor.getApplication();
          const actionNode = bindings.decorator ? bindings.decorator : bindings.anchor;

          const options = {};
          if (!actionOnly) {
            options.sendValue = true;
          }

          app.action.executeAction(actionNode, options);
        }
      };
    });
  });
