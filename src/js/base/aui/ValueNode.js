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

modulum('ValueNode', ['NodeBase', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class ValueNode
     * @memberOf classes
     * @extends classes.NodeBase
     */
    cls.ValueNode = context.oo.Class(cls.NodeBase, function($super) {
      return /** @lends classes.ValueNode.prototype */ {
        __name: "ValueNode",

        /** @type ?number */
        _index: null,

        /**
         * @inheritDoc
         */
        _createController: function() {
          const containerNode = this._parent?._parent;
          const decoratorNode = containerNode?._children[0];
          const controllerType = decoratorNode?._tag;
          const tableNode = containerNode._tag === 'TableColumn' ? containerNode._parent : undefined;
          return cls.ControllerFactory.create(controllerType, {
            anchor: this,
            parent: this._parent,
            ui: this.getApplication().getNode(0),
            decorator: decoratorNode,
            container: containerNode,
            table: tableNode,
            treeItem: null,
            form: this.getAncestor("Form")
          });
        },

        /**
         * @inheritDoc
         */
        getStyleAttribute: function(styleAttr, forcedPseudoSelectors) {
          // On value nodes, the styles should be interpreted as if they were asked on the decorator node
          const decoratorNode = this._parent._parent._children[0];
          const pseudoSelectors = forcedPseudoSelectors || this._computePseudoSelectors();
          return decoratorNode._getStyleAttributeImpl(styleAttr, pseudoSelectors);
        },

        /**
         * @inheritDoc
         */
        _populatePseudoSelectors: function(pseudoSelectors, focusedNodeIdRef) {
          const container = this._parent._parent;
          let positionHolder = container;
          const index = this.getIndex();
          let offset = null;
          const tag = container.getTag();

          if (tag === 'TableColumn' || tag === 'Matrix') {
            const table = tag === 'TableColumn' ? container._parent : container;
            if (table.getId() === focusedNodeIdRef) {
              pseudoSelectors.focus = false;
              const dialogType = container.attribute('dialogType');
              if (dialogType === "Input" || dialogType === "InputArray") {
                const currentRow = table.attribute('currentRow');
                offset = table.attribute('offset');
                if (currentRow - offset === index) {
                  if (tag === 'TableColumn') {
                    const currentColumn = table.attribute('currentColumn');
                    if (currentColumn === container.getIndex()) {
                      pseudoSelectors.focus = true;
                    }
                  } else {
                    pseudoSelectors.focus = true;
                  }
                }
              }
            }
            positionHolder = table;
          }

          offset = positionHolder.attribute('offset');
          if ((offset + index + 1) % 2) {
            pseudoSelectors.odd = true;
          } else {
            pseudoSelectors.even = true;
          }
          return $super._populatePseudoSelectors.call(this, pseudoSelectors, focusedNodeIdRef);
        },

        /**
         * @inheritDoc
         */
        getIndex: function(tag) {

          // value nodes can only have value nodes as sibling, no need to consider "tag" parameter
          return this._index;
        },

        /**
         * Set node index in its parent's children
         * @param index
         */
        setIndex: function(index) {
          this._index = index;
        },

        /**
         * @returns {any} The value of the "value" attribute
         */
        getValue: function() {
          return this.attribute("value");
        },

        /**
         * @returns{cls.TableNode} The parent TableNode that contains this node
         */
        getTableNode: function() {
          return this.getAncestor("Table");
        },

        /**
         * @inheritDoc
         */
        hasVMFocus: function() {
          return this === this.getApplication().getFocusedVMNodeAndValue(true);
        },
      };
    });
    cls.NodeFactory.register("Value", cls.ValueNode);
  });
