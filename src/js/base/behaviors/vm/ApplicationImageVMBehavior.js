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

modulum('ApplicationImageVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ApplicationImageVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ApplicationImageVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ApplicationImageVMBehavior.prototype */ {
        __name: "ApplicationImageVMBehavior",

        watchedAttributes: {
          anchor: ['image']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const anchor = controller.getAnchorNode(),
            application = anchor.getApplication(),
            image = anchor.attribute('image'),
            widget = anchor.getWidget(),
            currentImage = application.getImage(),
            // If image was set but is now empty, fallback on Theme Icon
            useThemeIcon = (currentImage?.length > 0 && image.length === 0);

          application.setImage(application.wrapResourcePath(image));
          widget.setImage(application.wrapResourcePath(image));

          // Tell native part to update icon as well
          context.__wrapper.nativeCall(context.__wrapper.param({
            name: "applicationIcon",
            args: {
              "type": useThemeIcon ? "theme" : "userInterface",
              "icon": useThemeIcon ? context.ThemeService.getResource("img/gbc_logo.ico") : image,
            }
          }, application));

        }
      };
    });
  }
);
