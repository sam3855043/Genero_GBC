/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('Sanitize4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class Sanitize4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.Sanitize4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Sanitize4STBehavior.prototype */ {
        __name: "Sanitize4STBehavior",

        usedStyleAttributes: ["sanitize"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          if (widget?.setSanitize) {
            const sanitize = controller.getAnchorNode().getStyleAttribute('sanitize');
            widget.setSanitize(sanitize === null || sanitize.toUpperCase() !== "NO");
          }
        }
      };
    });
  });
