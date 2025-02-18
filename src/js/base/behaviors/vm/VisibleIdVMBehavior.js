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

modulum('VisibleIdVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class VisibleIdVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.VisibleIdVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.VisibleIdVMBehavior.prototype */ {
        __name: "VisibleIdVMBehavior",

        watchedAttributes: {
          anchor: ['visibleId']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const formNode = controller.getAnchorNode();
          const visibleId = formNode.attribute('visibleId');
          if (visibleId >= 0) {
            const visibleNode = formNode.getApplication().getNode(visibleId);
            if (visibleNode) {
              let ctrl = visibleNode.getController();
              let parentNode = visibleNode.getParentNode();
              while (!ctrl && parentNode) {
                ctrl = parentNode.getController();
                parentNode = parentNode.getParentNode();
              }
              if (ctrl) {
                ctrl.ensureVisible(true);
              }
            }
          }
        }
      };
    });
  });
