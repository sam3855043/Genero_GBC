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

modulum('BackgroundColorVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class BackgroundColorVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.BackgroundColorVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.BackgroundColorVMBehavior.prototype */ {
        __name: "BackgroundColorVMBehavior",

        usedStyleAttributes: ["backgroundColor"],

        watchedAttributes: {
          anchor: ['color', 'reverse'],
          decorator: ['color', 'reverse'],
          container: ['dialogType', 'currentRow', 'offset']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.setBackgroundColor) {
            const bindings = controller.getNodeBindings();
            const anchorNode = bindings.anchor;
            let colorNode = anchorNode;
            let useDecoratorNode = false;

            if (bindings.container && bindings.container.getTag() === "TableColumn") {
              // in table apply bg color on table item
              widget = widget.getParentWidget();
            }

            if (bindings.decorator && !anchorNode.isAttributeSetByVM('color')) {
              colorNode = bindings.decorator;
              useDecoratorNode = true;
            }

            const isReverse = colorNode.attribute('reverse') === 1;
            let color = null;
            let bgColor = null;
            let notImportant = false;
            if (isReverse && colorNode.isAttributeSetByVM('color')) {
              color = colorNode.attribute('color');
              if (color === "white") {
                color = context.ThemeService.getValue("theme-field-disabled-background-color");
              }
              if (useDecoratorNode && bindings.container && bindings.container.getTag() === "Matrix") {
                //Cell default color (not important)
                bgColor = this._resolveThemedColor(color);
                notImportant = true;
              } else {
                bgColor = this._resolveThemedColor(color);
              }
            } else {
              color = controller.getAnchorNode().getStyleAttribute('backgroundColor');
              if (color) {
                color = color.trim();
                bgColor = this._resolveThemedColor(color);
              } else {
                bgColor = isReverse ? "lightgrey" : null;
              }
            }

            // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
            if (anchorNode.isInTable()) {
              const tableWidget = widget.getTableWidgetBase();
              const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
              if (isAnticipateScrollingEnabled) {
                const tableCachedDataModel = tableWidget.getCachedDataModel();
                tableCachedDataModel.updateDataFromValueNode(anchorNode, "backgroundColor", bgColor);

                const tableNode = anchorNode.getAncestor("Table");
                if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                  // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                  return;
                }
              }
            }

            if (widget?.setBackgroundColor) {
              widget.setBackgroundColor(bgColor, notImportant);
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
