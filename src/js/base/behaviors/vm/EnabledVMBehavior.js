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

modulum('EnabledVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's 'enabled' state
     * @class EnabledVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.EnabledVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.EnabledVMBehavior.prototype */ {
        __name: "EnabledVMBehavior",

        watchedAttributes: {
          anchor: ['active', 'actionActive', 'notEditable'],
          container: ['active', 'dialogType', 'noEntry']
        },

        /**
         * Sets the widget 'enabled' or  'disabled' depending on the AUI tree state.
         */
        _apply: function(controller, data) {
          let activeNode = null;
          let dialogTypeNode = null;
          let actionActiveNode = null;
          let isConstruct = false;

          const bindings = controller.getNodeBindings();
          if (bindings.container) {
            activeNode = bindings.container;
            dialogTypeNode = bindings.container;
            isConstruct = (dialogTypeNode.attribute('dialogType') === context.constants.dialogType.construct);
          } else if (bindings.anchor.isAttributePresent('active')) {
            activeNode = bindings.anchor;
          }
          if (bindings.anchor.isAttributePresent('actionActive')) {
            actionActiveNode = bindings.anchor;
          }

          const widget = controller.getWidget();
          if (widget?.setEnabled) {
            let activeValue = false;
            if (activeNode) {
              activeValue = activeNode.attribute('active');
            }
            if (actionActiveNode) {
              activeValue = activeValue || actionActiveNode.attribute('actionActive');
            }
            let enabled = activeValue === 1;

            if (dialogTypeNode) {
              const dialogTypeValue = dialogTypeNode.attribute('dialogType');
              enabled = enabled &&
                dialogTypeValue !== context.constants.dialogType.display &&
                dialogTypeValue !== context.constants.dialogType.displayArray;
            }

            if (!enabled) { //isConstruct must be applied only on enabled elements
              isConstruct = false;
            }

            const noEntry = (activeNode && !isConstruct) ? activeNode.attribute('noEntry') :
              0; // In construct ignore noEntry attribute
            const notEditable = bindings.decorator ? bindings.decorator.attribute("notEditable") : 0;
            widget.getElement().toggleClass("readonly", noEntry === 1);
            if ((!enabled || noEntry === 1) && widget.setReadOnly) {
              widget.setReadOnly(true);
            } else if (notEditable === 1 && (widget.setReadOnly || widget.setNotEditable)) {
              if (widget.setNotEditable) {
                widget.setNotEditable(true);
                if (window.isMobile()) {
                  widget.setReadOnly(true);
                }
              } else {
                widget.setReadOnly(true);
              }
            } else {
              if (widget.setReadOnly) {
                widget.setReadOnly(false);
              }
            }
            if (enabled !== widget.isEnabled()) {
              widget.setEnabled(enabled); // note that a noentry field is inactive
            }
          }
        }
      };
    });
  });
