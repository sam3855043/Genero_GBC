/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ValueListNode', ['NodeBase', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class ValueListNode
     * @memberOf classes
     * @extends classes.NodeBase
     */
    cls.ValueListNode = context.oo.Class(cls.NodeBase, function($super) {
      return /** @lends classes.ValueListNode.prototype */ {

        /**
         * @inheritDoc
         */
        addChildNode: function(node) {
          ( /** @type {classes.ValueNode} */ node).setIndex(this._children.length);
          return $super.addChildNode.call(this, node);
        },
      };
    });
    cls.NodeFactory.register("ValueList", cls.ValueListNode);
  });
