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

modulum('ActionDefaultAcceleratorVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class ActionDefaultAcceleratorVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ActionDefaultAcceleratorVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ActionDefaultAcceleratorVMBehavior.prototype */ {
        __name: "ActionDefaultAcceleratorVMBehavior",

        watchedAttributes: {
          anchor: ['acceleratorName', 'acceleratorName2', 'acceleratorName3', 'acceleratorName4']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const bindings = controller.getNodeBindings();

          // register action default
          const app = bindings.anchor.getApplication();
          if (app) {
            const actionService = app.getActionApplicationService();
            if (actionService) {
              actionService.destroyActionDefault(bindings.anchor);
              actionService.registerActionDefault(bindings.anchor);
            }
          }
        },

        /**
         * @inheritDoc
         */
        _detach: function(controller, data) {
          const anchorNode = controller.getAnchorNode();
          const actionService = anchorNode.getApplication().getActionApplicationService();
          actionService.destroyActionDefault(anchorNode);
        }
      };
    });
  });
