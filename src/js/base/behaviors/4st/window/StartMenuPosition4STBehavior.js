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

modulum('StartMenuPosition4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class StartMenuPosition4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.StartMenuPosition4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.StartMenuPosition4STBehavior.prototype */ {
        __name: "StartMenuPosition4STBehavior",

        usedStyleAttributes: ["startMenuPosition"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const node = controller.getAnchorNode();

          const type = node.getStyleAttribute("startMenuPosition");
          if (widget?.setStartMenuType) {
            if (type) {
              widget.setStartMenuType(type);
            }
          }
        }
      };
    });
  });
