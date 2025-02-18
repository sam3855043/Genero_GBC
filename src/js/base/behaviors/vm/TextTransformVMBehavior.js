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

modulum('TextTransformVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TextTransformVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TextTransformVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TextTransformVMBehavior.prototype */ {
        __name: "TextTransformVMBehavior",

        watchedAttributes: {
          decorator: ['shift']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setTextTransform && widget.removeTextTransform) {
            const bindings = controller.getNodeBindings();
            const shiftNode = bindings.decorator ? bindings.decorator : bindings.anchor;
            const shift = shiftNode.attribute('shift');
            widget.removeTextTransform();
            if (shift !== "none") {
              widget.setTextTransform(shift);
            }
          }
        }
      };
    });
  });
