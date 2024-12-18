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

modulum('TableColumnNode', ['NodeBase', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class TableColumnNode
     * @memberOf classes
     * @extends classes.NodeBase
     */
    cls.TableColumnNode = context.oo.Class(cls.NodeBase, function($super) {
      return /** @lends classes.TableColumnNode.prototype */ {
        __name: "TableColumnNode",

        /** @type {number} */
        _initialTabIndex: -1,

        /**
         * @inheritDoc
         */
        constructor: function(parent, tag, id, attributes, app) {
          $super.constructor.call(this, parent, tag, id, attributes, app);

          this._initialTabIndex = this.attribute("tabIndex");
        },

        /**
         * @inheritDoc
         */
        _createChildrenControllers: function(_queue) {
          for (let i = 1; i < this._children.length; i++) {
            const child = this._children[i];
            if (child._tag === "ValueList") {
              for (const element of child._children) { // create value controller
                element.createController(_queue);
              }
            } else {
              child.createController(_queue);
            }
          }
        },

        /**
         * @inheritDoc
         */
        _createController: function() {
          const decoratorNode = this._children[0];

          return cls.ControllerFactory.create(this._tag, {
            anchor: this,
            parent: this._parent,
            ui: this.getApplication().getNode(0),
            decorator: decoratorNode,
            form: this.getAncestor("Form")
          });
        },

        /**
         * Returns initial tabIndex of column
         * @returns {number} initial tabIndex
         */
        getInitialTabIndex: function() {
          return this._initialTabIndex;
        }
      };
    });
    cls.NodeFactory.register("TableColumn", cls.TableColumnNode);
  });
