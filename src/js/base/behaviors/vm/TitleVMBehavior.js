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

modulum('TitleVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TitleVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TitleVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TitleVMBehavior.prototype */ {
        __name: "TitleVMBehavior",

        watchedAttributes: {
          anchor: ['comment', 'name', 'actionIdRef'],
          decorator: ['comment', 'actionIdRef']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (!widget) {
            return;
          }
          const bindings = controller.getNodeBindings();
          const commentNode = bindings.decorator ? bindings.decorator : bindings.anchor;
          const isDefined = commentNode.isAttributeSetByVM('comment');
          if (isDefined) {
            const text = commentNode.attribute('comment');
            widget.setTitle(text);

            /**
             * If the widget is in an array,
             * tell the column header that it should have a title too
             */
            if (widget.isInArray() && widget.getParentWidget()?.getColumnWidget) {
              // It will return a row
              widget.getParentWidget().getColumnWidget().setTitle(text);
            }
          }
        }
      };
    });
  });
