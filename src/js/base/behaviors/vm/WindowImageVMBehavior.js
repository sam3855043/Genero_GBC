/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('WindowImageVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class WindowImageVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.WindowImageVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.WindowImageVMBehavior.prototype */ {
        __name: "WindowImageVMBehavior",

        watchedAttributes: {
          anchor: ['image']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const windowNode = controller.getAnchorNode(),
            application = windowNode.getApplication(),
            image = windowNode && windowNode.attribute('image');
          windowNode.setIcon(application.wrapResourcePath(image));

          if (image.length > 0) {
            // Tell native part to update icon as well
            context.__wrapper.nativeCall(context.__wrapper.param({
              name: "applicationIcon",
              args: {
                "type": "window",
                "icon": image,
              }
            }, application));
          }
        }
      };
    });
  }
);
