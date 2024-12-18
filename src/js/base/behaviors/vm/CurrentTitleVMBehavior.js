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

modulum('CurrentTitleVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class CurrentTitleVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CurrentTitleVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CurrentTitleVMBehavior.prototype */ {
        __name: "CurrentTitleVMBehavior",

        watchedAttributes: {
          ui: ['currentWindow'],
          anchor: ['name', 'text', 'image']
        },

        /**
         * Switches the current window
         */
        _apply: function(controller, data) {
          const anchorNode = controller.getAnchorNode(),
            app = anchorNode.getApplication(),
            session = app.getSession();
          if (app === session.getCurrentApplication() || app === session.getHostApplication() || session.isInTabbedContainerMode()) {
            const uiNode = app.getNode(0),
              uiTitle = uiNode.attributeByVM("text") || uiNode.attributeByVM("name"),
              uiImage = uiNode.attributeByVM("image"),
              windowNode = (anchorNode.getTag() === "Window" ? anchorNode : anchorNode.getAncestor("Window")) ||
              uiNode.getFirstChildWithId(uiNode.attribute("currentWindow"));
            if (windowNode) {
              const formNode = windowNode.getFirstChild("Form"),
                menuNode = windowNode.getLastChild("Menu"),
                menuStyle = menuNode && menuNode.attribute("style"),
                title = (formNode || menuStyle === "winmsg" || menuStyle === "dialog") ?
                (windowNode.attributeByVM("text") || windowNode.attributeByVM("name")) :
                (menuNode ? (menuNode.attributeByVM("text") ||
                  windowNode.attributeByVM("text") ||
                  uiNode.attributeByVM("text") ||
                  menuNode.attributeByVM("name") ||
                  windowNode.attributeByVM("name") ||
                  uiNode.attributeByVM("name")) : null),
                image = (formNode && formNode.attributeByVM("image")) ||
                (menuNode && menuNode.attributeByVM("image")) ||
                windowNode.attributeByVM("image");

              const windowWidget = windowNode.getController().getWidget();
              if (title) {
                if (windowWidget.setText) {
                  windowWidget.setText(title);
                }
              }

              const windowType = windowNode.getStyleAttribute('windowType');
              if (context.HostService.getCurrentWindowNode() === windowNode && windowType !== 'modal') {
                const tabbedPage = windowNode.getApplication().getUI().getWidget()._tabbedPage;
                if (tabbedPage) {
                  if (!windowWidget.isModal) {
                    tabbedPage.setText(title);
                    // this is typical rule which enforces to manage title icon directly here and not in widgets
                    if (image || uiImage) {
                      tabbedPage.setImage(app.wrapResourcePath(image ? image : uiImage));
                    }
                  }
                  //} else {
                  //  console.log("x");
                  //A                  context.HostService.setCurrentTitle(title);
                  // this is typical rule which enforces to manage title icon directly here and not in widgets
                  //A                  context.HostService.setCurrentIcon(app.wrapResourcePath(image ? image : uiImage));
                }
              }
            } else {
              const userInterfaceWidget = uiNode.getController().getWidget();
              if (userInterfaceWidget.setText) {
                userInterfaceWidget.setText(uiTitle);
              }
              if (userInterfaceWidget.setImage) {
                userInterfaceWidget.setImage(uiImage);
              }
              //A              context.HostService.setCurrentIcon(uiImage ? app.wrapResourcePath(uiImage) : "", true);
            }
          }
        }
      };
    });
  });
