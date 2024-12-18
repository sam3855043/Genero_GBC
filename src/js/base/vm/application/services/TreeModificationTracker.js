/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TreeModificationTracker', [],
  function(context, cls) {
    /**
     * Records AUI tree modifications
     * @class TreeModificationTracker
     * @memberOf classes
     */
    cls.TreeModificationTracker = context.oo.Class(function($super) {
      return /** @lends classes.TreeModificationTracker.prototype */ {
        __name: "TreeModificationTracker",

        $static: /** @lends classes.TreeModificationTracker */ {
          stylesTag: ["StyleList", "Style", "StyleAttribute"]
        },

        /** @type {Map<number,*>}*/
        _modifications: null,
        _involvesStyle: false,

        constructor: function() {
          this._modifications = new Map();
        },

        /**
         * Returns the tree modifications for the given node. Creates a new entry if not found
         * @param {number} nodeId node idRef
         * @return {*} the modifications for the given node
         * @private
         */
        _fetch: function(nodeId) {
          let mods = this._modifications.get(nodeId);
          if (!mods) {
            mods = {
              createdSubTreeRoot: false,
              created: false,
              removed: false,
              updatedAttributes: {}
            };
            this._modifications.set(nodeId, mods);
          }
          return mods;
        },

        /**
         * @param {number} nodeId
         * @return {*} the node's modifications or undefined
         */
        get: function(nodeId) {
          return this._modifications.get(nodeId);
        },

        /**
         * @param {number} nodeId
         * @return {boolean} true if the node's modifications exists
         */
        has: function(nodeId) {
          return this._modifications.has(nodeId);
        },

        /**
         * @param {number[]} nodeIds
         * @param {Set<string>} watchedAttributes
         * @param watchesStyleNodeBinding
         * @return {boolean} true if the node's modifications exists
         */
        hasOne: function(nodeIds, watchedAttributes, watchesStyleNodeBinding) {
          if (watchesStyleNodeBinding && this._involvesStyle) {
            return true;
          }
          let find = nodeIds.find(id => {
            let modification = this._modifications.get(id);
            if (modification) {
              if (modification.created || modification.createdSubTreeRoot || modification.removed ||
                Object.keys(modification.updatedAttributes).find(attr => watchedAttributes.has(attr))) {
                return true;
              }
            }
            return false;
          });
          return find >= 0;
        },

        /**
         * Records a node creation
         * @param {number} nodeId node idRef
         * @param {string} tag
         * @param subTreeRoot true if this is a VM order subtree root node
         */
        nodeCreated: function(nodeId, tag, subTreeRoot) {
          const mods = this._fetch(nodeId);
          mods.created = true;
          mods.tag = tag;
          mods.isStyleTag = cls.TreeModificationTracker.stylesTag.indexOf(tag) >= 0;
          this._involvesStyle = this._involvesStyle || mods.isStyleTag;
          mods.createdSubTreeRoot = Boolean(subTreeRoot);
        },

        /**
         * @param {number} nodeId node idRef
         * @return {boolean} true if the node has been created
         */
        isNodeCreated: function(nodeId) {
          const mods = this._modifications.get(nodeId);
          return mods ? mods.created : false;
        },

        /**
         * @param {number} nodeId node idRef
         * @return {*} true if the node is a VM subtree root node
         */
        isNodeCreatedAndSubTreeRoot: function(nodeId) {
          const mods = this._modifications.get(nodeId);
          return mods ? mods.createdSubTreeRoot : false;
        },

        /**
         * Records a removed node
         * @param {number} nodeId node idRef
         * @param {string} tag
         */
        nodeRemoved: function(nodeId, tag) {
          let mods = this._fetch(nodeId);
          mods.removed = true;
          mods.tag = tag;
          mods.isStyleTag = cls.TreeModificationTracker.stylesTag.indexOf(tag) >= 0;
          this._involvesStyle = this._involvesStyle || mods.isStyleTag;
        },

        /**
         * Clean the tree modification tracker for a given aui node
         * @param {classes.NodeBase} node AUI node
         */
        clean: function(node) {
          const children = node.getChildren();
          for (const child of children) {
            this.clean(child);
          }
          //Remove definitely a node from tree modification tracker
          this._modifications.delete(node.getId());
        },

        /**
         * @param {number} nodeId node idRef
         * @return {boolean} true if the node has been removed
         */
        isNodeRemoved: function(nodeId) {
          const mods = this._modifications.get(nodeId);
          return mods ? mods.removed : false;
        },

        /**
         * Records an attribute modification
         * @param {number} nodeId node idRef
         * @param {string} attributeName name of the attribute
         */
        attributeChanged: function(nodeId, attributeName) {
          this._fetch(nodeId).updatedAttributes[attributeName] = true;
        },

        /**
         * @param {number} nodeId node idRef
         * @return {{string:boolean}} the updated attributes
         */
        getChangedAttributes: function(nodeId) {
          const mods = this._modifications.get(nodeId);
          return mods ? mods.updatedAttributes : {};
        },

        /**
         * @param {number} nodeId node idRef
         * @param attributeName attribute name
         * @return {boolean} true if the attribute value has changed
         */
        isNodeAttributeChanged: function(nodeId, attributeName) {
          const mods = this._modifications.get(nodeId);
          return mods ? mods.updatedAttributes[attributeName] : false;
        },

        /**
         * Iterate over all modifications
         * @param {Function} handler callback with value, keys arguments
         */
        forEach: function(handler) {
          this._modifications.forEach(handler);
        }
      };
    });
  }
);
