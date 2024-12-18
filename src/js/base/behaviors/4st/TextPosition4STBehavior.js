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

modulum('TextPosition4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class TextPosition4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.TextPosition4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.TextPosition4STBehavior.prototype */ {
        __name: "TextPosition4STBehavior",

        usedStyleAttributes: ["toolBarTextPosition"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.getElement) {
            const format = controller.getAnchorNode().getStyleAttribute('toolBarTextPosition');
            const element = widget.getElement();
            if (element) {
              if (format === "textBesideIcon") {
                widget.setAspect("iconAndText");

              } else {
                widget.setAspect("iconAboveText");

              }
            }
          }
        }
      };
    });
  });
