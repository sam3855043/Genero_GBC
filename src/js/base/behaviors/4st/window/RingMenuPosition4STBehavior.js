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

modulum('RingMenuPosition4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class RingMenuPosition4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RingMenuPosition4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.RingMenuPosition4STBehavior.prototype */ {
        __name: "RingMenuPosition4STBehavior",

        usedStyleAttributes: ["ringMenuPosition"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const menuNode = controller.getAnchorNode();
          const isInChromeBar = controller.isInChromeBar();

          const ringMenuPosition = menuNode.getStyleAttribute("ringMenuPosition");
          if (widget?.setActionPanelPosition) {
            if (!isInChromeBar) {
              if (ringMenuPosition) {
                widget.setActionPanelPosition(ringMenuPosition);
              } else {
                widget.setActionPanelPosition('right');
              }
            }
          }
        }
      };
    });
  });
