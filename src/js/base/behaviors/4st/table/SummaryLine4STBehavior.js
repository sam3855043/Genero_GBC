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

modulum('SummaryLine4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableHeader4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.SummaryLine4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.SummaryLine4STBehavior.prototype */ {
        __name: "SummaryLine4STBehavior",

        usedStyleAttributes: ["backgroundColor", "textColor", "fontSize", "fontStyle", "fontWeight", "fontFamily"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget && widget instanceof cls.RTableWidget) {
            if (widget.hasFooter()) { //summaryLine style only applies on table's aggregate line
              let tableRowWidget = widget.getFooterAggregatesRowWidget();
              let tableNode = controller.getAnchorNode();
              let forcedPseudoSelectors = 'summaryLine';
              if (widget.setBackgroundColor) {
                let backgroundColor = tableNode.getStyleAttribute('backgroundColor', forcedPseudoSelectors);
                if (backgroundColor) {
                  tableRowWidget.setBackgroundColor(this._resolveThemedColor(backgroundColor));
                }
              }
              if (widget.setColor) {
                let color = tableNode.getStyleAttribute('textColor', forcedPseudoSelectors);
                if (color) {
                  tableRowWidget.setColor(this._resolveThemedColor(color));
                }
              }
              if (widget.setFontSize) {
                let fontSize = tableNode.getStyleAttribute('fontSize', forcedPseudoSelectors);
                if (fontSize) {
                  tableRowWidget.setFontSize(fontSize);
                }
              }
              if (widget.setFontStyle) {
                let fontStyle = tableNode.getStyleAttribute('fontStyle', forcedPseudoSelectors);
                if (fontStyle) {
                  tableRowWidget.setFontStyle(fontStyle);
                }
              }
              if (widget.setFontWeight) {
                let fontWeight = tableNode.getStyleAttribute('fontWeight', forcedPseudoSelectors);
                if (fontWeight) {
                  tableRowWidget.setFontWeight(fontWeight);
                }
              }
              if (widget.setFontFamily) {
                let fontFamily = tableNode.getStyleAttribute('fontFamily', forcedPseudoSelectors);
                if (fontFamily) {
                  tableRowWidget.setFontFamily(fontFamily);
                }
              }
            }
          }
        },

        /**
         * Get defined themed color corresponding to color name passed as argument
         * @param {string} color - color name
         * @returns {string} returns the color hexadecimal code
         * @private
         */
        _resolveThemedColor: function(color) {
          const themedColor = context.ThemeService.getValue("gbc-genero-" + color);
          return themedColor || color;
        }

      };
    });
  });
