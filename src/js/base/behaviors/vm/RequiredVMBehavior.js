/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RequiredVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Handle field validation: Required
     * @class RequiredVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RequiredVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.RequiredVMBehavior.prototype */ {
        __name: "RequiredVMBehavior",

        watchedAttributes: {
          container: ['required']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setRequired) {
            const containerNode = controller.getNodeBindings().container;
            const required = containerNode.attribute('required') === 1;
            widget.setRequired(required);
          }
        }
      };
    });
  });
