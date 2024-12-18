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

modulum('AlternateRows4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class AlternateRows4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.AlternateRows4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.AlternateRows4STBehavior.prototype */ {
        __name: "AlternateRows4STBehavior",

        usedStyleAttributes: ["alternateRows"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.setAlternateRows) {
            let tableNode = controller.getAnchorNode();
            let alternateRows = tableNode.getStyleAttribute("alternateRows");
            if (alternateRows !== null) {
              let applyAlternateRows = this.isSAYesLike(alternateRows);
              widget.setAlternateRows(applyAlternateRows);
            }
          }
        }
      };
    });
  });