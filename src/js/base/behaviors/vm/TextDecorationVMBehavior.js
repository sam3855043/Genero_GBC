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

modulum('TextDecorationVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TextDecorationVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TextDecorationVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TextDecorationVMBehavior.prototype */ {
        __name: "TextDecorationVMBehavior",

        watchedAttributes: {
          anchor: ['underline'],
          decorator: ['underline']
        },

        usedStyleAttributes: ["textDecoration"],

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;

          let underlineNode = null;
          let textDecoration = null;
          if (bindings.anchor.isAttributeSetByVM('underline')) {
            underlineNode = bindings.anchor;
          } else if (bindings.decorator) {
            if (bindings.decorator.isAttributeSetByVM('underline')) {
              underlineNode = bindings.decorator;
            }
          }
          if (underlineNode) {
            textDecoration = underlineNode.attribute('underline') === 1 ? "underline" : null;
          } else {
            textDecoration = controller.getAnchorNode().getStyleAttribute('textDecoration');
          }

          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          if (anchorNode.isInTable()) {
            const tableWidget = widget.getTableWidgetBase();
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();
              tableCachedDataModel.updateDataFromValueNode(anchorNode, "textDecoration", textDecoration);

              const tableNode = anchorNode.getAncestor("Table");
              if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                return;
              }
            }
          }

          if (widget?.setTextDecoration) {
            widget.setTextDecoration(textDecoration);
          }
        }
      };
    });
  });
