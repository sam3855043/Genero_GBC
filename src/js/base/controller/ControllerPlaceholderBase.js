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

modulum('ControllerPlaceholderBase', ['ControllerBase'],
  function(context, cls) {
    /**
     * @class ControllerPlaceholderBase
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.ControllerPlaceholderBase = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.ControllerPlaceholderBase.prototype */ {
        __name: "ControllerPlaceholderBase",

        /**
         * Set of behavior name to be applied by the placeholder on the virtual widgets
         * @type {Set}
         */
        _behaviorsApplyedByPlaceholderOnVirtualWidget: null,

        constructor: function(bindings) {
          this._behaviorsApplyedByPlaceholderOnVirtualWidget = new Set();

          $super.constructor.call(this, bindings);
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        attachUI: function() {
          //If we are a placeholder only children are added to the parent widget (ex:TopMenuGroup)
          const anchorNode = this.getAnchorNode();
          const parentWidget = anchorNode.getParentNode().getWidget();

          if (parentWidget.isChromeBar && anchorNode.getParentNode().getController().isInChromeBar()) {
            //If we are in the chromebar put the placeholder in the DOM
            this.getWidget().setPositionInParent(0);
            $super.attachUI.call(this);
          } else {
            this.getWidget().setPositionInParent(anchorNode.getVirtualIndex());
            this.getWidget().setParentWidget(parentWidget);
          }
        },

        /**
         * Return the common behaviours
         * @param {classes.ControllerBase} controller
         * @return {Set} common behaviors
         */
        _commonBehaviors: function(controller) {
          const res = new Set();

          this._behaviorsNameList.forEach((behaviorName) => {
            if (!this._behaviorsApplyedByPlaceholderOnVirtualWidget.has(behaviorName) && controller._behaviorsNameList.has(
                behaviorName)) {
              res.add(behaviorName);
            }
          });

          return res;
        },

        /**
         * Link behavior to the controller
         * @param {Function} BehaviorClass the behavior class to link
         * @param {boolean} applyOnlyByPlaceholderWidget true if the behavior must be applied to the virtual widgets
         * @param {*} [config] configuration object
         * @protected
         */
        _addBehavior: function(BehaviorClass, applyOnlyByPlaceholderWidget, config) {
          $super._addBehavior.call(this, BehaviorClass, config);

          if (applyOnlyByPlaceholderWidget) {
            this._behaviorsApplyedByPlaceholderOnVirtualWidget.add(BehaviorClass.__name);
          }
        },

        /**
         * Set the active parent id (example: Menu id)
         * @param {number} parentId
         */
        setActiveParentId: function(parentId) {
          const anchorNode = this.getAnchorNode();
          const placeholderWidget = this.getWidget();

          placeholderWidget.setPositionInParent(anchorNode.getVirtualIndex());
          placeholderWidget.setActiveParentId(parentId);
        }

      };
    });
  });
