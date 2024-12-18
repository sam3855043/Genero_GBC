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

modulum('NavigationDots4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class NavigationDots4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.NavigationDots4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.NavigationDots4STBehavior.prototype */ {
        __name: "NavigationDots4STBehavior",

        usedStyleAttributes: ["navigationDots"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setNavigationDots) {
            const navigationDots = controller.getAnchorNode().getStyleAttribute('navigationDots');
            if (navigationDots) {
              widget.setNavigationDots(this.isSAYesLike(navigationDots));
            }
          }
        }
      };
    });
  });
