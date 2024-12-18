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

modulum('InterruptUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class InterruptUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.InterruptUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.InterruptUIBehavior.prototype */ {
        /** @type {string} */
        __name: "InterruptUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const node = controller.getAnchorNode();
          if (node.attribute('name') === 'interrupt') {
            const widget = controller.getWidget();
            if (widget) {
              const application = node?.getApplication();
              if (application && application.action) {
                application.action.registerInterruptWidget(widget);
              }
              if (!application.action.hasAction("interrupt")) {
                widget.setInterruptable(true);
                if (widget instanceof cls.TopMenuCommandWidget) {
                  let parentNode = node.getParentNode();
                  while (parentNode && parentNode.getController().getWidget() && parentNode.getController().getWidget() instanceof cls
                    .TopMenuGroupWidget) {
                    parentNode.getController().getWidget().setInterruptable(true);
                    parentNode = parentNode.getParentNode();
                  }
                }
                data.actionHandle = widget.when(gbc.constants.widgetEvents.click, this._onAction.bind(this, controller, data));
              }
            }
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            const node = controller.getAnchorNode();
            const application = node?.getApplication();
            if (application && application.action) {
              application.action.unregisterInterruptWidget(widget);
            }
            widget.setInterruptable(false);
          }
          if (this.actionHandle) {
            this.actionHandle();
            this.actionHandle = null;
          }
        },
        /**
         * Creates an action event and sends it to the VM
         */
        _onAction: function(controller) {
          const node = controller.getAnchorNode(),
            application = node?.getApplication();
          if (application) {
            if (application.isIdle()) {
              application.action.executeActionByName("interrupt");
            } else if (!application.action.hasAction("interrupt")) {
              application.interrupt();
            }
          }
        }
      };
    });
  });
