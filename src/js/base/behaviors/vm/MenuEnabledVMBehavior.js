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

modulum('MenuEnabledVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class MenuEnabledVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.MenuEnabledVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.MenuEnabledVMBehavior.prototype */ {
        __name: "MenuEnabledVMBehavior",

        usedStyleAttributes: ["actionPanelPosition", "ringMenuPosition"],

        watchedAttributes: {
          anchor: ['active']
        },

        /**
         * Updates the widget's visibility depending on the AUI tree information
         */
        _apply: function(controller, data) {
          const thisWidget = controller.getWidget();
          if (!thisWidget) {
            return;
          }
          const anchorNode = controller.getAnchorNode();
          const isActive = anchorNode.attribute('active') === 1;

          if (thisWidget.setEnabled) {
            thisWidget.setEnabled(isActive);

            const nodeId = anchorNode.getId();
            controller.getPlaceholderControllers().forEach((controllerPlaceholder) => {
              if (isActive) {
                controllerPlaceholder.setActiveParentId(nodeId);
              } else if (nodeId === controllerPlaceholder.getWidget().getActiveParentId()) {
                controllerPlaceholder.setActiveParentId(0);
              }
            });

            const isHidden = anchorNode.attribute('hidden') === 1;
            if (isActive && !isHidden) {
              context.SessionService.getCurrent().getCurrentApplication().layout.afterLayout(function() {
                thisWidget.showModal();
              }, true);
            }
          }
        }
      };
    });
  });
