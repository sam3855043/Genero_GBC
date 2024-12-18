/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('WindowState4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class WindowState4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.WindowState4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.WindowState4STBehavior.prototype */ {
        __name: "WindowState4STBehavior",

        usedStyleAttributes: ["windowState"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const windowNode = controller.getAnchorNode(),
            windowState = windowNode.getStyleAttribute("windowState");
          context.HostService.setWindowState(windowState);
        }
      };
    });
  });
