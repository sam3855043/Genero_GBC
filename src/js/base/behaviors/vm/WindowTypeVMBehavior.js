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

modulum('WindowTypeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class WindowTypeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.WindowTypeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.WindowTypeVMBehavior.prototype */ {
        __name: "WindowTypeVMBehavior",

        usedStyleAttributes: ["windowType"],

        watchedAttributes: {
          anchor: ['style']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const windowNode = controller.getAnchorNode(),
            application = windowNode && windowNode.getApplication(),
            session = application && application.getSession();
          if ((!windowNode.isAttributeSetByVM("active") || windowNode.attribute("active") === 1) &&
            (!windowNode.isAttributeSetByVM("hidden") || windowNode.attribute("hidden") === 0)) {
            const widget = windowNode.getController().getWidget();
            if (widget?.setAsModal) {
              let windowTypeAttr = windowNode.attribute("style");
              if (!this._isMenuSpecial(widget, windowTypeAttr)) {
                windowTypeAttr = windowNode.getStyleAttribute("windowType");
              }
              if (this._isMenuSpecial(widget, windowTypeAttr)) {
                // in this case windowNode is the menuNode (fgl_winmsg case)
                widget.setAsModal(windowTypeAttr);
                const freeHandle = windowNode.getApplication().layout.afterLayout(function() {
                  widget._updateModalPosition();
                });
                widget.when(context.constants.widgetEvents.destroyed, function() {
                  freeHandle();
                });
              } else if (widget.isInstanceOf(cls.WindowWidget) && windowNode.isModal()) {
                const opt = {
                  storedSettingsKey: windowNode.getController().getStoredSettingKey()
                };
                const modalWidget = widget.setAsModal(opt); // pass options to modal

                if (modalWidget) {
                  const app = windowNode.getApplication();
                  modalWidget.when(context.constants.widgetEvents.modalResize, function() {
                    app.getUI().getWidget().getLayoutInformation().invalidateMeasure();
                    app.scheduler.layoutCommand({
                      resize: true
                    });
                  }.bind(this));
                }

                modalWidget.onClose(() => {
                  if (session) {
                    session.getNavigationManager().unfreezeApplication(application);
                  }
                });
                if (session) {
                  session.getNavigationManager().freezeApplication(application);
                }
              }
            }
          }
        },

        _isMenuSpecial: function(widget, styleAttr) {
          return (widget.isInstanceOf(cls.MenuWidget) && (styleAttr === "winmsg" || styleAttr === "dialog" || styleAttr === "popup"));
        }
      };
    });
  });
