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
/**
 * @typedef {Object} nodeInfo
 * @property {string} type
 * @property {number} id
 * @property {Object.<string, *>} attributes
 * @property {nodeInfo[]} children
 */

modulum('NodeFactory', ['Factory', 'StandardNode'],

  function(context, cls) {
    /**
     * @namespace classes.NodeFactory
     */
    cls.NodeFactory = context.oo.StaticClass(function() {
      /**
       *
       * @type {classes.Factory<classes.NodeBase>}
       */
      const factory = new cls.Factory("Node", cls.StandardNode);
      return /** @lends classes.NodeFactory */ {
        _ripWidgetCreated: false,

        /**
         *
         * @param {string} type
         * @param {Function} constructor
         */
        register: function(type, constructor) {
          factory.register(type, constructor);
        },
        /**
         *
         * @param {string} type
         */
        unregister: function(type) {
          factory.unregister(type);
        },
        /**
         *
         * @param {string} type
         * @returns {classes.NodeBase}
         */
        create: function(type, arg1, arg2, arg3, arg4, arg5) {
          return factory.create(type, arg1, arg2, arg3, arg4, arg5);
        },
        /**
         * Create recursively all model nodes for the given nodeInfo
         * @param {classes.NodeBase} parent parent node
         * @param {nodeInfo} nodeInfo node information
         * @param {classes.VMApplication=} app owner application
         * @param {classes.TreeModificationTracker} treeModificationTrack tree modifications log
         * @returns {classes.NodeBase[]} created nodes
         */
        createRecursive: function(parent, nodeInfo, app, treeModificationTrack) {
          this._ripWidgetCreated = false;
          return this._createRecursive(parent, nodeInfo, app, treeModificationTrack, true);
        },
        /**
         * Create recursively all model nodes for the given nodeInfo
         * Internal implementation
         * @param {classes.NodeBase} parent parent node
         * @param {nodeInfo} nodeInfo node information
         * @param {classes.VMApplication=} app owner application
         * @param {classes.TreeModificationTracker} treeModificationTrack tree modifications log
         * @param {boolean} isSubTreeRoot true if the node to create is a subtree root
         * @returns {classes.NodeBase[]} created nodes
         * @private
         */
        _createRecursive: function(parent, nodeInfo, app, treeModificationTrack, isSubTreeRoot) {
          if (app.ended) {
            // If app ended, get out of this recursive function
            return null;
          }
          const current = factory.create.call(factory, nodeInfo.type, parent, nodeInfo, app);
          if (nodeInfo.type.startsWith("Rip") && nodeInfo.type !== "RipGraphic") {
            this._ripWidgetCreated = true;
          }
          treeModificationTrack.nodeCreated(current._id, current._tag, isSubTreeRoot);
          if (nodeInfo.children && Array.isArray(nodeInfo.children)) {
            const jsonAuiProtocol = window.isURLParameterEnabled("json") || context.ThemeService.getValue("aui-json-protocol");
            for (const element of nodeInfo.children) {
              let child = element;
              if (jsonAuiProtocol && Array.isArray(element)) {
                child = {
                  type: element[0], // same as tag
                  id: element[1],
                  attributes: element[2],
                  children: element[3]
                };
              }
              this._createRecursive(current, child, app, treeModificationTrack);
            }
          }
          current.childrenCreated();
          return current;
        },

        /**
         * True if a widget type started with Rip was created in the last createRecursive
         * @returns {boolean}
         */
        ripWidgetCreated: function() {
          return this._ripWidgetCreated;
        }
      };
    });
  });
