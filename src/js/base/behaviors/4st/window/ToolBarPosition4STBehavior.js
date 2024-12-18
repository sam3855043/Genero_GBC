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

modulum('ToolBarPosition4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ToolBarPosition4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ToolBarPosition4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ToolBarPosition4STBehavior.prototype */ {
        __name: "ToolBarPosition4STBehavior",

        usedStyleAttributes: ["toolBarPosition"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const tbNode = controller.getAnchorNode();

          const tbPosition = tbNode.getStyleAttribute("toolBarPosition");
          if (widget?.setToolBarPosition) {
            if (tbPosition) {
              widget.setToolBarPosition(tbPosition);
            } else {
              widget.setToolBarPosition('top');
            }
          }
        }
      };
    });
  });
