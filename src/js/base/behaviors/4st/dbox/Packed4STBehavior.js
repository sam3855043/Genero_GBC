/// FOURJS_START_COPYRIGHT(D,2023)
/// Property of Four Js*
/// (c) Copyright Four Js 2023, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('Packed4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class Packed4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.Packed4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Packed4STBehavior.prototype */ {
        __name: "Packed4STBehavior",

        usedStyleAttributes: ["packed"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setPacked) {
            const packed = controller.getAnchorNode().getStyleAttribute('packed');
            widget.setPacked(this.isSAYesLike(packed));
          }
        }
      };
    });
  });
