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

modulum('Size4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * Size 4ST for toolbar rendering
     * @class Size4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.Size4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Size4STBehavior.prototype */ {
        __name: "Size4STBehavior",

        usedStyleAttributes: ["size"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const tbNode = controller.getAnchorNode();

          // size should be one of those values
          //  - small : displays many actions (~7 icons)
          //  - medium: displays some actions (~5 icons) default
          //  - large: display few actions (~3 icons)
          const buttonSize = tbNode.getStyleAttribute("size");
          if (widget?.setButtonSize) {
            if (buttonSize) {
              widget.setButtonSize(buttonSize);
            }
          }
        }
      };
    });
  });
