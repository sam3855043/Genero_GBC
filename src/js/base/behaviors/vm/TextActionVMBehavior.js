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

modulum('TextActionVMBehavior', ['BehaviorBase'],
  /**
   * Manage "Text" attribute only for Action widgets
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * @class TextActionVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TextActionVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TextActionVMBehavior.prototype */ {
        __name: "TextActionVMBehavior",

        watchedAttributes: {
          anchor: ['name', 'text', 'actionIdRef', "image", "hidden"],
          decorator: ['action', 'actionIdRef']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget && (widget.setText)) {
            let anchorNode = controller.getAnchorNode();
            let actionName = anchorNode.attribute('name');
            let text = anchorNode.attribute('text');
            let isTextDefined = anchorNode.isAttributeSetByVM('text');
            let isIconDefined = anchorNode.isAttributeSetByVM('image');

            if (context.ThemeService.getValue("theme-action-name-backward-compatibility")) {
              // if there is no text defined for action
              if (!isTextDefined) {
                let chromeBarTheme = controller.isInChromeBar();
                // case where we always fall back to name when no text
                let defaultActionsTags = ["Action", "Menu", "MenuAction"];
                let forceName = chromeBarTheme || defaultActionsTags.includes(anchorNode.getTag());
                if (!isIconDefined || forceName) {
                  text = anchorNode.attribute('name');
                }
              }
            } else {
              // if no text and no icon use name as text
              if (!isTextDefined && !isIconDefined) {
                text = anchorNode.attribute('name');
              }
            }

            // for topmenu
            let accelerator = anchorNode.attribute('acceleratorName');
            if (accelerator && !window.isMobile() && widget.setComment) { // don't show accelerator on mobile devices
              widget.setComment(accelerator);
            }

            //remove first occurence of & symbol (quick shortcut not available in webclient)
            text = text ? text.toString().replace(/&(.)/g, "$1") : "";

            if (widget.setText) {
              widget.setText(text);
            }

            if (anchorNode.getTag() === "Action") {
              let contextMenuAttribute = anchorNode.attribute('contextMenu');
              let isInContextMenu = (contextMenuAttribute === 'yes' || contextMenuAttribute === 'auto');

              let contextAttribute = anchorNode.attribute('context');
              let isInRowBoundMenu = (contextAttribute === 'row');

              let hiddenAttr = anchorNode.attribute('hidden');
              const application = anchorNode.getApplication();
              let imageAttr = application.wrapResourcePath(anchorNode.attribute('image'));

              if (isInContextMenu) {
                // update contextmenu corresponding action
                let contextMenuWidget = widget.getApplicationWidget().getContextMenu();
                contextMenuWidget.updateAction(actionName, text, imageAttr, accelerator, {
                  hidden: hiddenAttr
                });
              }
              if (isInRowBoundMenu) {
                // update rowboundmenu corresponding action
                let rowBoundMenuWidget = widget.getApplicationWidget().getRowBoundMenu();
                rowBoundMenuWidget.updateAction(actionName, text, imageAttr, accelerator, {
                  hidden: hiddenAttr
                });
              }
            }
          }
        }
      };
    });
  });
