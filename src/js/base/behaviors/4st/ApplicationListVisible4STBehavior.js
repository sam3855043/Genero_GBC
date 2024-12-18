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

modulum('ApplicationListVisible4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * Define the applicationListVisible 4ST.
     * Possible values are 'yes', 'no', 'auto'
     * @class ApplicationListVisible4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.ApplicationListVisible4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ApplicationListVisible4STBehavior.prototype */ {
        __name: "ApplicationListVisible4STBehavior",

        usedStyleAttributes: ["applicationListVisible"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            applicationListVisible = node.getStyleAttribute('applicationListVisible') || "auto"; // use "auto" as default if not specified
          context.HostLeftSidebarService.setApplicationListVisibility(
            this.isSAYesLike(applicationListVisible) ? true :
            this.isSANoLike(applicationListVisible) ? false :
            "auto");
          context.HostLeftSidebarService.setApplicationListVisible(applicationListVisible);
        }
      };
    });
  });
