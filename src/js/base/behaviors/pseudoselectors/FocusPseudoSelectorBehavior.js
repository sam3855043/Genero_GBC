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

modulum('FocusPseudoSelectorBehavior', ['PseudoSelectorBehaviorBase'],
  function(context, cls) {
    /**
     * @class FocusPseudoSelectorBehavior
     * @memberOf classes
     * @extends classes.PseudoSelectorBehaviorBase
     */
    cls.FocusPseudoSelectorBehavior = context.oo.Singleton(cls.PseudoSelectorBehaviorBase, function($super) {
      return /** @lends classes.FocusPseudoSelectorBehavior.prototype */ {
        __name: "FocusPseudoSelectorBehavior",

        watchedAttributes: {
          ui: ["focus"]
        },

        focusChanged: function(controller, data, event, node, eventData) {
          const uiNode = controller.getAnchorNode();
          if (uiNode._pseudoSelectorsUsedInSubTree.focus) {
            if (eventData.old) {
              const oldFocusedNode = uiNode.getApplication().getNode(eventData.old);
              // Previously focused node may have been removed from the AUI tree.
              if (oldFocusedNode) {
                if (oldFocusedNode._pseudoSelectorsUsedInSubTree.focus) {
                  this.setStyleBasedBehaviorsDirty(oldFocusedNode);
                }
              }
            }
            const newFocusedWidget = uiNode.getApplication().getNode(eventData.new);
            if (newFocusedWidget && newFocusedWidget._pseudoSelectorsUsedInSubTree.focus) {
              this.setStyleBasedBehaviorsDirty(newFocusedWidget);
            }
          }
        },

        _attach: function(controller, data) {
          const uiNode = controller.getAnchorNode();
          data.onFocusAttributeChanged = uiNode.onAttributeChanged('focus', this.focusChanged.bind(this, controller, data));
        },

        _detach: function(controller, data) {
          if (data.onFocusAttributeChanged) {
            data.onFocusAttributeChanged();
            data.onFocusAttributeChanged = null;
          }
        },

        setStyleBasedBehaviorsDirty: function(rootNode) {
          rootNode.forThisAndEachDescendant(function(node) {
            const controller = node.getController();
            if (controller) {
              controller.setStyleBasedBehaviorsDirty(null, null, false);
            }
          });
        }
      };
    });
  }
);
