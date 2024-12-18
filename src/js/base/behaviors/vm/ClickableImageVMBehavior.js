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

modulum('ClickableImageVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ClickableImageVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ClickableImageVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ClickableImageVMBehavior.prototype */ {
        __name: "ClickableImageVMBehavior",

        watchedAttributes: {
          decorator: ['action', "actionActive"],
          anchor: ['action', "actionActive"]
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setClickableImage) {
            const imgNode = controller.getNodeBindings().decorator || controller.getNodeBindings().anchor;
            let active = imgNode.attribute("actionActive") === 1;
            // Make image visually clickable when in scrollgrid
            if (imgNode.isInScrollGrid()) {
              active = imgNode.getParentNode().attribute("active") === 1;
            }
            if (imgNode.isAttributeSetByVM('action') && imgNode.isAttributeSetByVM('actionActive')) {
              widget.setClickableImage(imgNode.attribute("action") && active);
            }
          }
        }
      };
    });
  });
