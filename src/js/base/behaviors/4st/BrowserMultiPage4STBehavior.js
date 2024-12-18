/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('BrowserMultiPage4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class BrowserMultiPage4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.BrowserMultiPage4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.BrowserMultiPage4STBehavior.prototype */ {
        __name: "BrowserMultiPage4STBehavior",

        usedStyleAttributes: ["browserMultiPage"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            app = node?.getApplication(),
            session = app && app.getSession(),
            isAvailable = session &&
            (
              session.hasServerFeature("browser-multi-page") ||
              (cls.ServerHelper.compare(session.info().serverVersion, "GAS/3.00.22") >= 0)
            );

          if (isAvailable) {
            // Session (and GAS) is compatible with the feature
            if (this.isSAYesLike(node.getStyleAttribute('browserMultiPage')) || gbc.browserMultiPage) {
              session.activateBrowserMultiPageMode();
            }
          }
        }
      };
    });
  });
