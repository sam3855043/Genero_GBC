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

modulum('StyleVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class StyleVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.StyleVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.StyleVMBehavior.prototype */ {
        __name: "StyleVMBehavior",

        watchedAttributes: {
          anchor: ['style'],
          decorator: ['style']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const bindings = controller.getNodeBindings();
          const styleNode = bindings.decorator ? bindings.decorator : bindings.anchor;
          if (widget) {
            const style = styleNode.attribute('style');
            if (widget.getRawStyles() === style) {
              return;
            }

            if (style !== undefined) {
              widget.setApplicationStyles(style);
            }
          }

          controller.setStyleBasedBehaviorsDirty();
        }
      };
    });
  });
