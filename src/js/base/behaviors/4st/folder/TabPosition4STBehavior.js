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

modulum('TabPosition4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class TabPosition4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.TabPosition4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.TabPosition4STBehavior.prototype */ {
        __name: "TabPosition4STBehavior",

        usedStyleAttributes: ["position"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setTabPosition) {
            const pos = controller.getAnchorNode().getStyleAttribute('position');
            if (pos) {
              widget.setTabPosition(pos);
            } else {
              widget.setTabPosition('top');
            }
          }
        }
      };
    });
  });
