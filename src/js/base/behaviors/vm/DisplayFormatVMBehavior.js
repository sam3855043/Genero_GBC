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

modulum('DisplayFormatVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class DisplayFormatVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.DisplayFormatVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.DisplayFormatVMBehavior.prototype */ {
        __name: "DisplayFormatVMBehavior",

        watchedAttributes: {
          container: ['keyboardHint', 'varType']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setDisplayFormat) {
            const containerNode = controller.getNodeBindings().container;
            if (containerNode) {
              const varType = containerNode.attribute('varType');
              if (varType) {
                widget.setDisplayFormat(varType);
              }
            }
          }
        }
      };
    });
  });
