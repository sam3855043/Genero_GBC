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

modulum('TableImageVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableImageVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableImageVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableImageVMBehavior.prototype */ {
        __name: "TableImageVMBehavior",

        watchedAttributes: {
          anchor: ['image']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (!widget) {
            return;
          }
          const tableItemWidget = widget.getParentWidget();
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;

          const auiImage = anchorNode.attribute('image');
          let image = null;
          const tableColumnNode = controller.getNodeBindings().container;
          const tableNode = tableColumnNode.getParentNode();
          const isListView = tableNode.getController().isListView();
          // for list view use only first column for images
          if (!isListView || tableNode.getChildren("TableColumn").indexOf(tableColumnNode) === 0) {
            image = tableNode.getApplication().wrapResourcePath(auiImage);
          }

          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          if (anchorNode.isInTable()) {
            const tableWidget = widget.getTableWidgetBase();
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();
              tableCachedDataModel.updateDataFromValueNode(anchorNode, "image", image);

              const tableNode = anchorNode.getAncestor("Table");
              if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                return;
              }
            }
          }

          if (tableItemWidget && tableItemWidget.setImage && image !== null) {
            tableItemWidget.setImage(image);
          }
        }

      };
    });
  });
