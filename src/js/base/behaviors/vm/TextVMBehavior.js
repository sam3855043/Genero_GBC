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

modulum('TextVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TextVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TextVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TextVMBehavior.prototype */ {
        __name: "TextVMBehavior",

        watchedAttributes: {
          anchor: ['text'],
          decorator: ['text']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setText) {
            const bindings = controller.getNodeBindings();
            const textNode = bindings.decorator?.isAttributeSetByVM('text') ? bindings.decorator : bindings.anchor;
            const text = textNode.attribute('text');
            widget.setText(text);
          }
        }
      };
    });
  });
