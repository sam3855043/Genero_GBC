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

modulum('ToolBarItemsAlignment4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ToolBarItemsAlignment4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ToolBarItemsAlignment4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ToolBarItemsAlignment4STBehavior.prototype */ {
        __name: "ToolBarItemsAlignment4STBehavior",

        usedStyleAttributes: ["itemsAlignment"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const tbNode = controller.getAnchorNode();

          const align = tbNode.getStyleAttribute("itemsAlignment");
          tbNode.getApplication().layout.when(context.constants.widgetEvents.afterLayout,
            function() {
              if (widget?.setToolBarItemsAlignment) {
                if (align) {
                  widget.setToolBarItemsAlignment(align);
                } else {
                  widget.setToolBarItemsAlignment('left');
                }
              }
            }.bind(this), true);

        }
      };
    });
  });
