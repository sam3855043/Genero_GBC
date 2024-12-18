/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ActionTitleVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ActionTitleVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ActionTitleVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ActionTitleVMBehavior.prototype */ {
        __name: "ActionTitleVMBehavior",

        watchedAttributes: {
          decorator: ['comment', 'action', 'actionIdRef']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setActionTitle) {
            const commentNode = controller.getNodeBindings().decorator;
            let comment = commentNode.attribute('comment');
            // TODO : see to add comment2 on FGL side to be able to display buttonedit button message without having to trick by searching in active dialog actions
            const actionName = commentNode.attribute('action');
            if (actionName) {
              const actionNode = commentNode.getApplication().getActionApplicationService().getActiveDialogActionForName(actionName);
              if (actionNode) {
                comment = actionNode.attribute('comment');
              }
            }
            widget.setActionTitle(comment);
          }
        }
      };
    });
  });
