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

modulum('TableNode', ['StandardNode', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class TableNode
     * @memberOf classes
     * @extends classes.StandardNode
     */
    cls.TableNode = context.oo.Class(cls.StandardNode, function($super) {
      return /** @lends classes.TableNode.prototype */ {

        __name: "TableNode",

        /** @type boolean */
        _isTree: false,

        /**
         * @inheritDoc
         */
        setInitialStyleAttributes: function() {
          $super.setInitialStyleAttributes.call(this);
          let defaultWidget = context.ThemeService.getValue("theme-table-default-widget");

          if (this._initialStyleAttributes.tableType === "normal" ||
            this._initialStyleAttributes.tableType === "frozenTable") {
            this._initialStyleAttributes.tableType = "table";
          }

          if (defaultWidget && typeof(this._initialStyleAttributes.tableType) === "undefined") {
            defaultWidget = defaultWidget.toLowerCase();
            if (!this._isTree && defaultWidget === "listview") {
              // if theme default is listView and there is no tableType 4ST defined
              this._initialStyleAttributes.tableType = "listView";
            } else if (defaultWidget === "table") {
              // if theme default is table and there is no tableType 4ST defined
              this._initialStyleAttributes.tableType = "table";
            }
          }
        },

        /**
         * @inheritDoc
         */
        autoCreateChildrenControllers: function() {
          // Tables as ListViews have their custom line controllers in ListViewPageSizeVMBehavior
          return !this.isListView();
        },

        /**
         * @inheritDoc
         */
        updateAttributes: function(attributes) {
          $super.updateAttributes.call(this, attributes);
          if (attributes.bufferSize !== undefined) {
            const treeInfo = this.getFirstChild('TreeInfo');
            if (treeInfo) {
              treeInfo.applyBehaviors(null, true, true);
            }
          }
        },

        /**
         * Return if table is a tree view.
         * @return {boolean} true if it is a tree
         */
        isTreeView: function() {
          return this._isTree;
        },

        /**
         * Return if table is a listView.
         * @return {boolean} true if it is a listView
         */
        isListView: function() {
          return (this._initialStyleAttributes.tableType === "listView");
        },

        /**
         * Returns current row index in the table viewport
         * @return {number} - row index
         */
        getCurrentRowValueIndex: function() {
          return this.attribute('currentRow') - this.attribute('offset');
        },

        /**
         * Will get current value node in table
         * @param {boolean} inputModeOnly - return value node only if is node is in INPUT mode
         * @returns {*}
         */
        getCurrentValueNode: function(inputModeOnly) {
          const dialogType = this.attribute('dialogType');
          const isInputMode = (dialogType === "Input" || dialogType === "InputArray" || dialogType === "Construct");
          if (inputModeOnly && !isInputMode) {
            return null;
          }
          const valueIndex = this.getCurrentRowValueIndex();
          const bufferSize = this.attribute('bufferSize');
          // check valueIndex validity
          if (valueIndex < 0 || valueIndex >= bufferSize) {
            return null;
          }
          if (!this.isAttributeSetByVM('currentColumn')) {
            return null; // if attribute is not specified by VM consider that there is no current value
          }
          const columnNodes = this.getChildren('TableColumn');
          const currentColumn = this.attribute('currentColumn');

          if (currentColumn >= columnNodes.length) {
            return null;
          }

          const columnNode = columnNodes[currentColumn];
          const valueListNode = columnNode.getFirstChild('ValueList');
          if (!valueListNode) {
            return null;
          }

          const valueNodes = valueListNode.getChildren();
          if (valueIndex < valueNodes.length) {
            return valueNodes[valueIndex];
          }

          return null;
        },

        /**
         * @inheritDoc
         */
        ignoreAction: function(actionName) {
          let actionsIgnored = ["nextpage", "prevpage"]; // always ignored page action, it is managed by the GBC directly
          if (this.attribute("dialogType") === "DisplayArray") {
            actionsIgnored.push("nextfield", "prevfield"); // next field et prev field should do nothing in DisplayArray
          }
          return actionsIgnored.contains(actionName);
        },

        /**
         * @returns {Array<cls.TableColumnNode>} All the tableColumn nodes of this table
         */
        getColumns() {
          return this.getChildren("TableColumn");
        },

        /**
         * Get the TreeInfo node if exist, undefined otherwise
         * @returns {cls.TreeInfoNode|undefined}
         */
        getTreeInfo() {
          const [treeInfo] = this.getChildren("TreeInfo");
          return treeInfo;
        },

        /**
         * @param {number} rowIndex The row index of the treeItem to find
         * @returns {cls.TreeItemNode|null} The treeItemNode that is located at the rowIndex parameter. Null if there is none
         */
        getTreeItemNodeAtRow(rowIndex) {
          const treeInfo = this.getTreeInfo();
          if (!treeInfo) {
            return null;
          }
          return treeInfo.findNodeWithAttribute("TreeItem", "row", rowIndex);
        },

        /**
         * 
         * @param {number} columnIndex 
         * @param {number} rowIndex 
         * @returns {cls.ValueNode|null} The value node matching the row and column
         */
        getValueNode: function(columnIndex, rowIndex) {
          const columns = this.getColumns();
          if (columnIndex >= columns.length) {
            throw new Error("The column index is greater than the table column count");
          }

          const valueListNode = columns[columnIndex]?.getFirstChild("ValueList");
          return valueListNode?.getChildren()[rowIndex];
        }
      };
    });
    cls.NodeFactory.register("Table", cls.TableNode);
  });
