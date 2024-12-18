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

modulum('AllowedOrientations4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class AllowedOrientations4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.AllowedOrientations4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.AllowedOrientations4STBehavior.prototype */ {
        __name: "AllowedOrientations4STBehavior",

        usedStyleAttributes: ["allowedOrientations"],

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            app = node?.getApplication();

          if (app) {
            const allowedOrientations = node.getStyleAttribute('allowedOrientations');
            if (allowedOrientations) {
              context.__wrapper.nativeCall(context.__wrapper.param({
                name: "allowedOrientations",
                args: {
                  "orientations": allowedOrientations
                }
              }, app));
            }

          }

        }
      };
    });
  });
