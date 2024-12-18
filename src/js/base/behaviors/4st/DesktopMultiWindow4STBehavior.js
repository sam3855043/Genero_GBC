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
// Temp name: ActivateSdi4STBehavior
modulum('DesktopMultiWindow4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class DesktopMultiWindow4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.DesktopMultiWindow4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.DesktopMultiWindow4STBehavior.prototype */ {
        __name: "DesktopMultiWindow4STBehavior",

        usedStyleAttributes: ["desktopMultiWindow"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            app = node?.getApplication();

          if (this.isSAYesLike(node.getStyleAttribute('desktopMultiWindow'))) {
            context.__wrapper.nativeCall(context.__wrapper.param({
              name: "desktopMultiWindow",
              args: {}
            }, app));
          }
        }
      };
    });
  });
