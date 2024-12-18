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

modulum('ImageVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ImageVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ImageVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ImageVMBehavior.prototype */ {
        __name: "ImageVMBehavior",

        watchedAttributes: {
          anchor: ['image'],
          decorator: ['image']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setImage) {
            const bindings = controller.getNodeBindings();
            let imageNode = null;
            if (bindings.decorator?.isAttributePresent('image')) {
              imageNode = bindings.decorator;
            } else {
              imageNode = bindings.anchor;
            }
            const image = imageNode.attribute('image');
            widget.setImage(imageNode.getApplication().wrapResourcePath(image));
          }
        }
      };
    });
  }
);
