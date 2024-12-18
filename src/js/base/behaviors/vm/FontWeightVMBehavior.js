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

modulum('FontWeightVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class FontWeightVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.FontWeightVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.FontWeightVMBehavior.prototype */ {
        __name: "FontWeightVMBehavior",

        watchedAttributes: {
          anchor: ['bold'],
          decorator: ['bold']
        },

        usedStyleAttributes: ["fontWeight"],

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;
          let fontWeight = null;
          let boldNode = null;
          if (bindings.anchor.isAttributeSetByVM('bold')) {
            boldNode = bindings.anchor;
          } else if (bindings.decorator?.isAttributeSetByVM('bold')) {
            boldNode = bindings.decorator;
          }

          if (boldNode) {
            fontWeight = boldNode.attribute('bold') === 1 ? "bold" : null;
          } else {
            fontWeight = controller.getAnchorNode().getStyleAttribute('fontWeight');
          }

          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          if (anchorNode.isInTable()) {
            const tableWidget = widget.getTableWidgetBase();
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();
              tableCachedDataModel.updateDataFromValueNode(anchorNode, "fontWeight", fontWeight);

              const tableNode = anchorNode.getAncestor("Table");
              if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                return;
              }
            }
          }

          if (widget?.setFontWeight) {
            widget.setFontWeight(fontWeight);
          }
        }
      };
    });
  }
);
