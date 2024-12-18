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

modulum('ColorVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ColorVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ColorVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ColorVMBehavior.prototype */ {
        __name: "ColorVMBehavior",

        usedStyleAttributes: ["textColor"],

        watchedAttributes: {
          anchor: ['color', 'reverse'],
          decorator: ['color', 'reverse']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;
          let colorNode = anchorNode;
          if (bindings.decorator && !anchorNode.isAttributeSetByVM('color')) {
            colorNode = bindings.decorator;
          }

          const isReverse = colorNode.attribute('reverse') === 1;
          let color = null;
          if (!isReverse && colorNode.isAttributeSetByVM('color')) {
            color = colorNode.attribute('color');
            // Weird choice but what is white should be black if not reverse on modern UI
            if (color === 'white') {
              color = controller.getAnchorNode().getStyleAttribute('textColor');
              if (!color) {
                color = context.ThemeService.getValue("theme-secondary-color");
              }
            }
            color = this._resolveThemedColor(color);
          } else {
            color = controller.getAnchorNode().getStyleAttribute('textColor');
            if (color) {
              color = this._resolveThemedColor(color);
            }
          }

          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          if (anchorNode.isInTable()) {
            const tableWidget = widget.getTableWidgetBase();
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();
              tableCachedDataModel.updateDataFromValueNode(anchorNode, "textColor", color);

              const tableNode = anchorNode.getAncestor("Table");
              if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                return;
              }
            }
          }

          if (widget?.setColor) {
            widget.setColor(color);
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
          if (themedColor) {
            return themedColor;
          } else {
            return color;
          }
        }
      };
    });
  });
