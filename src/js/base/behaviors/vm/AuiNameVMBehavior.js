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

modulum('AuiNameVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class AuiNameVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.AuiNameVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.AuiNameVMBehavior.prototype */ {
        __name: "AuiNameVMBehavior",

        watchedAttributes: {
          anchor: ['name'],
          container: ['name']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const bindings = controller.getNodeBindings();
          const node = bindings.container || bindings.anchor;
          const widget = controller.getWidget();
          if (widget?.setAuiName) {
            const name = node.attribute('name') || node.attribute('tabName');
            widget.setAuiName(name);
          }
        }
      };
    });
  });
