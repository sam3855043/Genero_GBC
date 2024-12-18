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

modulum('MatrixNode', ['StandardNode', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class MatrixNode
     * @memberOf classes
     * @extends classes.StandardNode
     */
    cls.MatrixNode = context.oo.Class(cls.StandardNode, function() {
      return /** @lends classes.MatrixNode.prototype */ {
        __name: "MatrixNode",
        /**
         * @inheritDoc
         */
        _createChildrenControllers: function(_queue) {
          for (let i = 1; i < this._children.length; i++) {
            this._children[i].createController(_queue);
          }
        },

        /**
         * Will get current value node in matrix
         * @param {boolean} inputModeOnly - return value node only if is node is in INPUT mode
         * @returns {*}
         */
        getCurrentValueNode: function(inputModeOnly) {
          const dialogType = this.attribute('dialogType');
          const isInputMode = (dialogType === "Input" || dialogType === "InputArray" || dialogType === "Construct");
          if (!inputModeOnly || isInputMode) {
            const currentRow = this.attribute("currentRow") || 0;
            const offset = this.attribute("offset");
            const valueIndex = currentRow - offset;
            if (this._children[1]._children[valueIndex]) {
              return this._children[1]._children[valueIndex];
            }
          }
          return null;
        }
      };
    });
    cls.NodeFactory.register("Matrix", cls.MatrixNode);
  });
