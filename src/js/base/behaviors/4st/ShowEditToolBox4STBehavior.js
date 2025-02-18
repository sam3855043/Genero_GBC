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

modulum('ShowEditToolBox4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ShowEditToolBox4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.ShowEditToolBox4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ShowEditToolBox4STBehavior.prototype */ {
        __name: "ShowEditToolBox4STBehavior",

        usedStyleAttributes: ["showEditToolBox"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.showEditToolBox) {
            let show = controller.getAnchorNode().getStyleAttribute('showEditToolBox');
            if (show !== "auto") {
              show = this.isSAYesLike(show) ? "show" : "hide";
            }
            widget.showEditToolBox(show);
          }
        }
      };
    });
  });
