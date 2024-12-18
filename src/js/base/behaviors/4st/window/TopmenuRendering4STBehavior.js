/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TopmenuRendering4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * Used to set the Topmenu Rendering ('classic'[default] or 'sidebar')
     * @class TopmenuMobileRendering4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TopmenuRendering4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.TopmenuRendering4STBehavior.prototype */ {
        __name: "TopmenuRendering4STBehavior",

        usedStyleAttributes: ["topmenuDesktopRendering", "topmenuMobileRendering"],

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const windowNode = controller.getAnchorNode();
          const winWidget = controller.getWidget();
          const uiNode = windowNode.getAncestor("UserInterface");
          const uiWidget = uiNode.getWidget();

          const topmenuRendering = {
            desktop: windowNode.getStyleAttribute("topmenuDesktopRendering") || 'classic',
            mobile: windowNode.getStyleAttribute("topmenuMobileRendering") || 'sidebar'
          };

          if (winWidget && winWidget.setTopmenuRendering) {
            // Handle window's topmenus
            winWidget.setTopmenuRendering(topmenuRendering.desktop, topmenuRendering.mobile);
          }
          if (uiWidget && uiWidget.setTopmenuRendering) {
            // Handle UserInterface's topmenus
            uiWidget.setTopmenuRendering(topmenuRendering.desktop, topmenuRendering.mobile);
          }

        }
      };
    });
  });
