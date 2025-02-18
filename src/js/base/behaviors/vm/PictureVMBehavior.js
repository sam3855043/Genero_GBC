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

modulum('PictureVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class PictureVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.PictureVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.PictureVMBehavior.prototype */ {
        __name: "PictureVMBehavior",

        watchedAttributes: {
          decorator: ['picture'],
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const decoratorNode = controller.getNodeBindings().decorator;
          const pictureSet = decoratorNode.isAttributeSetByVM('picture');
          const pictureString = pictureSet ? decoratorNode.attribute("picture") : null;

          if (pictureString === null || pictureString.length <= 0) {
            // Picture not defined
            return;
          }

          const widget = controller.getWidget();
          if (widget.setPicture) { // On table (display array) edits are transformed into Labels and labels has no setPicture function
            widget.setPicture(pictureString);
          }
        }
      };
    });
  });
