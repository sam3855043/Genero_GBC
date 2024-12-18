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

modulum('WindowListVisible4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class WindowListVisible4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.WindowListVisible4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.WindowListVisible4STBehavior.prototype */ {
        __name: "WindowListVisible4STBehavior",

        usedStyleAttributes: ["windowListVisible"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode();
          let windowListVisible = node.getStyleAttribute('windowListVisible');
          if (windowListVisible === null) {
            windowListVisible = true;
          } else {
            windowListVisible = this.isSAYesLike(windowListVisible);
          }
          context.HostLeftSidebarService.setWindowListVisibility(windowListVisible);
        }
      };
    });
  });
