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

modulum('ActionDefaultNode', ['StandardNode', 'NodeFactory'],
  function(context, cls) {
    /**
     * AUI Node ActionDefault
     *
     * @class ActionDefaultNode
     * @memberOf classes
     * @extends classes.StandardNode
     */
    cls.ActionDefaultNode = context.oo.Class(cls.StandardNode, function($super) {
      return /** @lends classes.ActionDefaultNode.prototype */ {
        constructor: function(parent, tag, id, attributes, app) {
          $super.constructor.call(this, parent, tag, id, attributes, app);
        }
      };
    });
    cls.NodeFactory.register("ActionDefault", cls.ActionDefaultNode);
  });