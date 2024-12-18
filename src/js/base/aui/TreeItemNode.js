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

modulum('TreeItemNode', ['NodeBase', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class TreeItemNode
     * @memberOf classes
     * @extends classes.NodeBase
     */
    cls.TreeItemNode = context.oo.Class(cls.NodeBase, function($super) {
      return /** @lends classes.TreeItemNode.prototype */ {
        __name: "TreeItemNode",

        /**
         * Depth in the tree 
         * 0 is root
         * @type {number}
         */
        _depth: -1,

        /**
         * @constructs
         * @param {classes.NodeBase} parent parent node
         * @param {string|nodeInfo} tag tag name (WINDOW, GROUP, MENU, etc...) or an object containing type, id, attributes
         * @param {?number|classes.VMApplication} id id
         * @param {Object=} attributes attributes list
         * @param {classes.VMApplication} app application
         */
        constructor: function(parent, tag, id, attributes, app) {
          $super.constructor.call(this, parent, tag, id, attributes, app);

          this._depth = this._computeDepth();
        },

        /**
         *
         * @inheritDoc
         */
        _createController: function() {
          return cls.ControllerFactory.create(this._tag, {
            anchor: this,
            parent: this._parent,
            ui: this.getApplication().getNode(0),
            form: this.getAncestor("Form")
          });
        },

        /**
         * Depth of the item compared to the TreeInfoNode
         * @returns The depth of the item in the tree
         */
        getDepth: function() {
          return this._depth;
        },

        /**
         * Get the value node of the first column, at the row this treeitem is referencing
         * @returns The value node matching this treeItem
         */
        getValueNode: function() {
          const tableNode = this.getAncestor("Table");
          return tableNode.getValueNode(0, this.getRow());
        },

        /**
         * @private
         * @returns {number} The computed depth of this node in the tree
         */
        _computeDepth: function() {
          let node = this.getParentNode();
          let depth = 0;
          while (node && node.getTag() === 'TreeItem') {
            node = node.getParentNode();
            depth += 1;
          }
          return depth;
        },

        /**
         * @returns The value given by the row attribute
         */
        getRow: function() {
          return this.attribute("row");
        }

      };
    });
    cls.NodeFactory.register("TreeItem", cls.TreeItemNode);
  });
