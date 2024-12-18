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

modulum('HiddenVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's visibility
     * @class HiddenVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.HiddenVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.HiddenVMBehavior.prototype */ {
        __name: "HiddenVMBehavior",

        watchedAttributes: {
          anchor: ['hidden', 'defaultView'],
          container: ['hidden', 'pageSize', 'bufferSize']
        },

        /**
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         */
        setup: function(controller, data) {
          data.firstApply = true;
        },

        /**
         * Updates the widget's visibility depending on the AUI tree information
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          const bindings = controller.getNodeBindings();
          let hiddenNode = null;
          let defaultViewNode = null;
          if (bindings.container) {
            hiddenNode = bindings.container;
          } else {
            hiddenNode = bindings.anchor;
          }
          if (bindings.anchor.isAttributePresent('defaultView')) {
            defaultViewNode = bindings.anchor;
          }

          // Handle visibility in case of Matrix
          const isMatrix = hiddenNode.getTag() === "Matrix";
          if (isMatrix) {
            const valueList = hiddenNode.getFirstChild("ValueList");
            // A matrix initially set to hidden has no value list until it is shown for the first time
            if (!valueList) {
              return;
            }
            // Call scrollgrid's PagesizeVMbehavior to create controllers and widgets if needed
            const scrollGridNode = hiddenNode.getAncestor("ScrollGrid");
            if (scrollGridNode && !controller._isValueListCreationForced) {
              // flag to not re apply behaviors multiple times on each attribute change
              controller._isValueListCreationForced = true;
              const scrollGridController = scrollGridNode.getController();
              scrollGridController.applyBehaviors(null, true);
            }
            const pageSize = hiddenNode.attribute('pageSize');
            const bufferSize = hiddenNode.attribute('bufferSize');

            // Hide if Valuelist is bigger than pageSize
            if (valueList._children.indexOf(controller.getAnchorNode()) >= Math.max(pageSize, bufferSize)) {
              if (widget?.setHidden) {
                widget.setHidden(true);
                return;
              }
            }
          }

          if (widget?.setHidden) {
            const hidden = hiddenNode.attribute('hidden');
            let visible = hidden === context.constants.visibility.visible;
            const parentStyle = hiddenNode.getParentNode().attribute('style');
            if (visible && defaultViewNode && parentStyle !== "popup" && parentStyle !==
              "dialog") { // defaultView is not taken into account when in menu style is not popup and not dialog (GBC-600)
              const defaultView = defaultViewNode.attribute('defaultView');
              visible = defaultView === context.constants.viewType.showAlways;
              if (window.isMobile()) {
                // on mobile, action with context='row' should not be visible outside of rowbound
                visible = defaultViewNode.attribute('context') === 'row' ? false : visible;
              }
            }

            // Table column specific code
            const isTableColumn = hiddenNode.getTag() === "TableColumn";
            if (isTableColumn && widget.setAlwaysHidden) {
              widget.setAlwaysHidden(hidden === context.constants.visibility.hiddenByProgram);

              if (data.firstApply) {

                controller.setInitiallyHidden(hidden === context.constants.visibility.hiddenByProgram || hidden === context.constants
                  .visibility.hiddenByUser);

                // Stored settings columns
                let storedHidden = controller.getStoredSetting("hidden");
                if (storedHidden !== null && (hidden === context.constants.visibility.hiddenByUser) !== storedHidden) {
                  visible = !storedHidden;
                  // Send order to hide/show column
                  const event = new cls.VMConfigureEvent(hiddenNode.getId(), {
                    hidden: visible ? context.constants.visibility.visible : context.constants.visibility.hiddenByUser
                  });
                  hiddenNode.getApplication().dvm.onOrdersManaged(function() {
                    hiddenNode.getApplication().scheduler.eventVMCommand(event, hiddenNode);
                  }.bind(this), true);
                }
              }

            }

            widget.setHidden(!visible);

            data.firstApply = false;
          }
        }
      };
    });
  });
