/// FOURJS_START_COPYRIGHT(D,2017)
/// Property of Four Js*
/// (c) Copyright Four Js 2017, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ScrollGridNode', ['StandardNode', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class ScrollGridNode
     * @memberOf classes
     * @extends classes.StandardNode
     */
    cls.ScrollGridNode = context.oo.Class(cls.StandardNode, function($super) {
      return /** @lends classes.ScrollGridNode.prototype */ {

        /**
         * @returns {boolean} True if the VM focused node is a child (whatever the depth) of this node
         */
        hasVMFocus: function() {
          // VM set the focus on matrix nodes when they are in VM
          for (const childMatrix of this.getDescendants("Matrix")) {
            // Into each child recursivelly ask focus until a positive result, or the end of children of children
            if (childMatrix.hasVMFocus()) {
              return true;
            }
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        autoCreateChildrenControllers: function() {
          // Stretchable and Paged ScrollGrids have their custom
          // line controllers in StretchableScrollGridPageSizeVMBehavior
          return this.attribute("wantFixedPageSize") !== 0;
        }
      };
    });
    cls.NodeFactory.register("ScrollGrid", cls.ScrollGridNode);
  });
