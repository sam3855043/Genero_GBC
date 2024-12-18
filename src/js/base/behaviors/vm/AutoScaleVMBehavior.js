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

modulum('AutoScaleVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class AutoScaleVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.AutoScaleVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.AutoScaleVMBehavior.prototype */ {
        __name: "AutoScaleVMBehavior",

        watchedAttributes: {
          decorator: ['autoScale', 'sizePolicy', 'stretch']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setAutoScale) {
            const bindings = controller.getNodeBindings();
            const node = bindings.decorator ? bindings.decorator : bindings.anchor;
            const autoScale = node.attribute('autoScale');
            const sizePolicy = node.attribute('sizePolicy');
            const hasStretch = node.isAttributeSetByVM('stretch');
            if (widget.setStretch) {
              widget.setStretch(hasStretch);
            }
            widget.setAutoScale(((sizePolicy === 'fixed' || hasStretch) && Boolean(autoScale)) || (sizePolicy === 'initial' &&
              Boolean(autoScale)));
          }
        }
      };
    });
  });
