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

modulum('RowAspect4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class RowAspect4STBehavior
     * @memberof classes
     * @extends classes.StyleBehaviorBase
     */
    cls.RowAspect4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.RowAspect4STBehavior */ {
        __name: "RowAspect4STBehavior",

        usedStyleAttributes: ["rowAspect"],

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          if (widget?.getRowAspectComponent) {
            const rowAspect = controller.getAnchorNode().getStyleAttribute('rowAspect');
            widget.getRowAspectComponent().setRowAspect(rowAspect);
          }
        }
      };
    });
  });
