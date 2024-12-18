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

modulum('Highlight4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class Highlight4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.Highlight4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Highlight4STBehavior.prototype */ {
        __name: "Highlight4STBehavior",

        usedStyleAttributes: ["highlightColor", "highlightCurrentCell", "highlightCurrentRow", "highlightTextColor"],
        watchedAttributes: {
          anchor: ['dialogType', 'focusOnField'],
          parent: ['active']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          if (!(widget?.updateHighlight)) {
            return;
          }

          const anchorNode = controller.getAnchorNode();
          // -- TABLE & SCROLLGRID WIDGET -------------------------------------------------
          // In DISPLAY ARRAY without FOCUSONFIELD
          //   highlightCurrentRow is enable by default (yes) but can be explicitly set to yes or no.
          //   highlightCurrentCell is ignored.
          // In DISPLAY ARRAY with FOCUSONFIELD
          //   highlightCurrentRow is disable by default (no) but can be explicitly set to yes or no.
          //   highlightCurrentCell is enable by default (yes) but can be explicitly set to yes or no.
          // In INPUT ARRAY
          //   highlightCurrentRow is disable by default (no) but can be explicitly set to yes or no.
          //   highlightCurrentCell is disable by default (no) but can be explicitly set to yes or no.
          // ---------------------------------------------------
          // -- LISTVIEW WIDGET -------------------------------------------------
          // In DISPLAY ARRAY
          //   highlightCurrentRow is disable by default (no) but can be explicitly set to yes or no.
          //   highlightCurrentCell is ignored
          // FOCUSONFIELD, INPUT ARRAY --> not managed
          // ---------------------------------------------------

          const highlightColorAttr = anchorNode.getStyleAttribute("highlightColor");
          const highlightCurrentCellAttr = anchorNode.getStyleAttribute("highlightCurrentCell");
          const highlightCurrentRowAttr = anchorNode.getStyleAttribute("highlightCurrentRow");
          const highlightTextColorAttr = anchorNode.getStyleAttribute("highlightTextColor");
          let dialogType = anchorNode.attribute("dialogType");

          if (!dialogType) { // in case of scrollgrid use the dialogType of first Matrix
            const node = anchorNode.findNodeWithAttribute(null, "dialogType");
            dialogType = node ? node.attribute("dialogType") : "DisplayArray";
          }

          const isDisplayArray = (dialogType === "DisplayArray");

          let hasFocusOnField = false;
          if (anchorNode.getTag() === 'Table') {
            hasFocusOnField = anchorNode.attribute('focusOnField') === 1;
          } else {
            const matrix = anchorNode.findNodeWithAttribute('Matrix', 'currentRow', -1);
            hasFocusOnField = matrix && anchorNode.attribute('active') === 1;
          }
          const isListView = controller.isListView ? controller.isListView() : false;

          // set default values
          let highlightCurrentRow = false;
          let highlightCurrentCell = false;
          if (isDisplayArray) {
            if (hasFocusOnField) {
              highlightCurrentCell = true;
            } else if (!isListView) {
              highlightCurrentRow = true;
              highlightCurrentCell = highlightCurrentRow;
            }
          }

          // set 4ST values
          if (highlightCurrentRowAttr !== null) {
            highlightCurrentRow = this.isSAYesLike(highlightCurrentRowAttr);
          }
          if (highlightCurrentCellAttr !== null) {
            highlightCurrentCell = this.isSAYesLike(highlightCurrentCellAttr);
          }

          const isScrollgrid = anchorNode.getTag() === 'ScrollGrid';
          if (isDisplayArray && !hasFocusOnField && !isScrollgrid) {
            highlightCurrentCell = highlightCurrentRow; // highlight cell should be equal at highlight row in this case
          }

          widget.setHighlightCurrentRow(highlightCurrentRow);
          widget.setHighlightCurrentCell(highlightCurrentCell);

          // Defines the highlight color of row
          widget.setHighlightColor(highlightColorAttr);
          // Defines the highlighted text color of row
          widget.setHighlightTextColor(highlightTextColorAttr);

          widget.updateHighlight();
        }
      };
    });
  });
