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

modulum('RowHover4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class RowHover4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RowHover4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.RowHover4STBehavior.prototype */ {
        __name: "RowHover4STBehavior",

        usedStyleAttributes: ["rowHover"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.setRowHover) {
            let tableNode = controller.getAnchorNode();
            let rowHover = tableNode.getStyleAttribute("rowHover");
            if (rowHover !== null) {
              let applyRowHover = this.isSAYesLike(rowHover);
              widget.setRowHover(applyRowHover);
            }
          }
        }
      };
    });
  });
