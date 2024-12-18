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

modulum('EnabledButtonVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's 'enabled' state
     * @class EnabledButtonVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.EnabledButtonVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.EnabledButtonVMBehavior.prototype */ {
        __name: "EnabledButtonVMBehavior",

        watchedAttributes: {
          parent: ['active'],
          anchor: ['active', 'actionActive', 'defaultView'],
          ui: ['runtimeStatus']
        },

        /**
         * Sets the widget 'enabled' or  'disabled' depending on the AUI tree state.
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const anchorNode = controller.getAnchorNode();
          const uiNode = anchorNode.getApplication().uiNode();
          const parentNode = controller.getNodeBindings().parent;

          const isInterrupt = anchorNode.attribute("name") === "interrupt";
          const isProcessing = uiNode.attribute("runtimeStatus") === "processing";

          if (widget?.setEnabled) {
            let hidden = anchorNode.isAttributePresent("hidden") ? anchorNode.attribute('hidden') : false;
            let activeValue = anchorNode.attribute('active');
            if (anchorNode.getParentNode().attribute("style") === "popup") {
              hidden = !activeValue;
            }

            if (anchorNode.isAttributePresent('actionActive')) {
              activeValue = activeValue || anchorNode.attribute('actionActive');
            }

            // When chromeBar theme is on, it changes some visibility behavior
            if (controller.isInChromeBar()) {
              const formNode = anchorNode.getAncestor("Form");
              if (formNode && formNode.attribute('hidden') === 1) {
                hidden = true;
              } else {
                const windowNode = anchorNode.getAncestor("Window");
                if (windowNode && !windowNode.isCurrentWindowNode()) {
                  // Do not display actions of a window that is not the current one
                  hidden = 1;
                }

                if (parentNode.isAttributePresent('active')) {
                  hidden = hidden ? hidden : parentNode.attribute("active") === 0;
                }
                if (anchorNode.isAttributePresent('defaultView')) {
                  hidden = hidden ? hidden : anchorNode.attribute("defaultView") === "no";
                  hidden = hidden ? hidden : anchorNode.attribute("hidden") === 1;
                }
                if (window.isMobile()) {
                  // on mobile, action with context='row' should not be visible outside of rowbound
                  hidden = hidden ? hidden : anchorNode.attribute('context') === 'row';
                }
              }
            }

            let enabled = activeValue === 1;
            if (isInterrupt && !anchorNode.getApplication().action.hasAction("interrupt")) {
              enabled = isProcessing || enabled;
            }

            widget.setEnabled(enabled);

            //hide it if menu popup
            if (widget.setHidden && (hidden || controller.isInChromeBar())) {
              widget.setHidden(hidden);
            }
          }
        }
      };
    });
  });
