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

modulum('MaxLengthVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class MaxLengthVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.MaxLengthVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.MaxLengthVMBehavior.prototype */ {
        __name: "MaxLengthVMBehavior",

        watchedAttributes: {
          decorator: ['maxLength', 'autoNext', 'scroll', 'width']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {

          if (controller.getWidget() instanceof cls.LabelWidget) {
            // Table display array uses Label instead of edit
            // Label is not a FieldWidgetBase, it does not support maxLength, scroll, vmWidth, autoNext
            return;
          }

          const widget = /** @type {classes.FieldWidgetBase} */ controller.getWidget();
          const decoratorNode = controller.getNodeBindings().decorator;
          widget.setScroll(decoratorNode.attribute('scroll') === 1);
          widget.setVMWidth(decoratorNode.attribute('width'));
          widget.setMaxLength(decoratorNode.attribute('maxLength'));
          widget.setAutoNext(decoratorNode.attribute('autoNext') === 1);
        }
      };
    });
  });
