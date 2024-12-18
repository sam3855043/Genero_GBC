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

modulum('TreeItemDecorationVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TreeItemDecorationVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TreeItemDecorationVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TreeItemDecorationVMBehavior.prototype */ {
        __name: "TreeItemDecorationVMBehavior",

        watchedAttributes: {
          anchor: ['expanded', 'hasChildren', 'row']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const treeItemNode = controller.getAnchorNode();
          const tableColumnNode = treeItemNode.getAncestor('Table').getFirstChild('TableColumn');
          const tableNode = treeItemNode.getAncestor('Table');
          tableNode.getWidget().setAriaRole("tree");

          const treeItemChildren = treeItemNode.getParentNode().getChildren();
          const row = treeItemNode.attribute('row');

          if (row === -1) {
            return;
          }
          const valueList = tableColumnNode.getFirstChild("ValueList");

          if (!valueList) {
            return;
          }
          const valueNode = valueList.getChildren()[row];

          if (!valueNode) {
            return;
          }

          valueNode.getController().getNodeBindings().treeItem = treeItemNode; // set treeItem binding for value node
          valueNode.getController().updateNodeBindingsIds();
          const hasChildren = treeItemNode.attribute('hasChildren') !== 0;
          const isExpanded = hasChildren && treeItemNode.attribute('expanded') !== 0;
          const tableColumnWidget = tableColumnNode.getWidget();
          const tableWidget = tableNode.getWidget();

          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
          if (isAnticipateScrollingEnabled) {
            const tableCachedDataModel = tableWidget.getCachedDataModel();

            const tableOffset = tableNode.attribute('offset');
            const rowIndex = valueNode.getIndex() + tableOffset;
            tableCachedDataModel.updateRowData(rowIndex, tableOffset, "treeDepth", treeItemNode.getDepth());
            tableCachedDataModel.updateRowData(rowIndex, tableOffset, "treeLeaf", !hasChildren);
            tableCachedDataModel.updateRowData(rowIndex, tableOffset, "treeExpanded", hasChildren && isExpanded);

            if (valueNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
              // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
              return;
            }
          }

          const tableItemWidget = tableColumnWidget.getItem(row);
          if (tableItemWidget) {
            tableItemWidget.setAriaRole("treeitem");
            tableItemWidget.setAriaAttribute("setsize", treeItemChildren.length);
            tableItemWidget.setAriaAttribute("posinset", treeItemChildren.indexOf(treeItemNode) + 1);
            tableItemWidget.setDepth(treeItemNode.getDepth());
            tableItemWidget.setLeaf(!hasChildren);
            if (hasChildren) {
              tableItemWidget.setAriaExpanded(isExpanded.toString());
              tableItemWidget.setExpanded(isExpanded);
            }
          }
        }
      };
    });
  });
