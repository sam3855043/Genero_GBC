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

modulum('IsPasswordVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class IsPasswordVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.IsPasswordVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.IsPasswordVMBehavior.prototype */ {
        __name: "IsPasswordVMBehavior",

        watchedAttributes: {
          anchor: ['isPassword', 'active'],
          decorator: ['isPassword', 'active']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setIsPassword) {
            const bindings = controller.getNodeBindings();
            let isPasswordNode = null;
            if (bindings.anchor.isAttributeSetByVM('isPassword')) {
              isPasswordNode = bindings.anchor;
            } else {
              isPasswordNode = bindings.decorator;
            }
            const isPassword = isPasswordNode.attribute('isPassword');
            widget.setIsPassword(isPassword);
          }
        }
      };
    });
  });
