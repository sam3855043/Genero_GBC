/// FOURJS_START_COPYRIGHT(D,2017)
/// Property of Four Js*
/// (c) Copyright Four Js 2017, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RowActionTrigger4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class RowActionTrigger4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RowActionTrigger4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.RowActionTrigger4STBehavior.prototype */ {
        __name: "RowActionTrigger4STBehavior",

        usedStyleAttributes: ["rowActionTrigger"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setRowActionTriggerByDoubleClick) {
            const node = controller.getAnchorNode();
            const rowActionTriggerStyle = node.getStyleAttribute("rowActionTrigger");

            let rowActionTriggerByDoubleClick;
            if (rowActionTriggerStyle === null) { // if there is no style, default depends on widget type
              rowActionTriggerByDoubleClick = !(controller?.isListView && controller.isListView());
            } else { // if there is a style, use it
              rowActionTriggerByDoubleClick = (rowActionTriggerStyle !== "singleClick");
            }

            widget.setRowActionTriggerByDoubleClick(rowActionTriggerByDoubleClick);
          }
        }
      };
    });
  });
