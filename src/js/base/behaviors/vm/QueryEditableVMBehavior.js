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

modulum('QueryEditableVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class QueryEditableVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.QueryEditableVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.QueryEditableVMBehavior.prototype */ {
        __name: "QueryEditableVMBehavior",

        watchedAttributes: {
          decorator: ['queryEditable'],
          container: ['dialogType']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setQueryEditable) {
            const bindings = controller.getNodeBindings();
            const dialogType = bindings.container.attribute("dialogType");

            if (dialogType === 'Construct') {
              const queryEditableNode = bindings.decorator ? bindings.decorator : bindings.anchor;
              const queryEditable = Boolean(queryEditableNode.attribute('queryEditable'));

              //Only valid on construct mode
              widget.setQueryEditable(queryEditable);
            } else {
              widget.setQueryEditable(false);
            }
          }
        }
      };
    });
  });
