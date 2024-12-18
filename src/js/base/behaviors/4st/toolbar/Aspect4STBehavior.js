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

modulum('Aspect4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * Aspect 4ST behavior for toolbars and icon / text rendering
     * @class Aspect4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.Aspect4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Aspect4STBehavior.prototype */ {
        __name: "Aspect4STBehavior",

        usedStyleAttributes: ["aspect"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const tbNode = controller.getAnchorNode();

          // aspect should be one of those values
          //  - icon: display icons (fallback to text if no icon defined),
          //  - text: display text (fallback to actionname if no display text defined),
          //  - iconAndText: display icon and text beside
          //  - iconAboveText : display icon above text (default)
          const tbAspect = tbNode.getStyleAttribute("aspect");
          if (widget?.setAspect) {
            if (tbAspect) {
              widget.setAspect(tbAspect);
            }
          }
        }
      };
    });
  });
