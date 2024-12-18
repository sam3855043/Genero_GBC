/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ActionPanelButtonTextAlign4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ActionPanelButtonTextAlign4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ActionPanelButtonTextAlign4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ActionPanelButtonTextAlign4STBehavior.prototype */ {
        __name: "ActionPanelButtonTextAlign4STBehavior",

        usedStyleAttributes: ["actionPanelButtonTextAlign", "ringMenuButtonTextAlign"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const panelNode = controller.getAnchorNode();
          let buttonTextAlign = null;
          if (panelNode.getTag() === 'Menu') {
            buttonTextAlign = panelNode.getStyleAttribute("ringMenuButtonTextAlign");
          } else {
            buttonTextAlign = panelNode.getStyleAttribute("actionPanelButtonTextAlign");
          }
          if (widget && buttonTextAlign && ["left", "right"].indexOf(buttonTextAlign) >= 0) {
            let i = 0;
            const children = widget.getChildren(),
              len = children.length;
            for (; i < len; i++) {
              const child = children[i];
              if (child && child.setContentAlign) {
                child.setContentAlign(buttonTextAlign);
              }
            }
          }
        }
      };
    });
  });
