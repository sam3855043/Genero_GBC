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

modulum('ShowGrid4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ShowGrid4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ShowGrid4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ShowGrid4STBehavior.prototype */ {
        __name: "ShowGrid4STBehavior",

        usedStyleAttributes: ["showGrid"],
        watchedAttributes: {
          anchor: ['dialogType']
        },

        /**
         * Indicates if the grid lines must be visible in a table.
         * Values can be "yes" (default when INPUT ARRAY),"no" (default when DISPLAY ARRAY). (1 or 0 on older front-ends).
         *
         * By default, when a Table is in editable mode (INPUT ARRAY), the front-end displays grid lines in the table.
         * You can change this behavior by setting this attribute to "no".
         *
         * By default, when a Table is in editable mode (DISPLAY ARRAY), the front-end does not display grid lines in the table.
         * You can change this behavior by setting this attribute to "yes".
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget) {
            let tableNode = controller.getAnchorNode();
            let showGrid = tableNode.getStyleAttribute("showGrid");
            let dialogType = tableNode.attribute("dialogType");
            let isInputDialog = (dialogType === "Input" || dialogType === "InputArray" || dialogType === "Construct");

            let applyShowGridX = false;
            let applyShowGridY = false;

            // if showGrid is not define
            if (showGrid === null) {
              applyShowGridX = isInputDialog;
              applyShowGridY = isInputDialog;
            } else {
              if (this.isSAYesLike(showGrid)) {
                applyShowGridX = true;
                applyShowGridY = true;
              } else if (showGrid === "horizontal") {
                applyShowGridX = true;
              } else if (showGrid === "vertical") {
                applyShowGridY = true;
              }
            }

            if (widget.setShowGridX && widget.setShowGridY) {
              widget.setShowGridX(applyShowGridX);
              widget.setShowGridY(applyShowGridY);
            } else if (widget.setShowGrid) { // TODO deprecated only for old tables
              widget.setShowGrid(applyShowGridX && applyShowGridY);
            }
          }
        }
      };
    });
  });
