/// FOURJS_START_COPYRIGHT(D,2017)
/// Property of Four Js*
/// (c) Copyright Four Js 2017, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ChangePageUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class ChangePageUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.ChangePageUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.ChangePageUIBehavior.prototype */ {
        /** @type {string} */
        __name: "ChangePageUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.changeHandle = widget.when(context.constants.widgetEvents.change, this._pageChanged.bind(this, controller, data));
            data.requestFocusHandle = widget.when(context.constants.widgetEvents.requestFocus, this._requestFocus.bind(this,
              controller, data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.changeHandle) {
            data.changeHandle();
            data.changeHandle = null;
          }
          if (data.requestFocusHandle) {
            data.requestFocusHandle();
            data.requestFocusHandle = null;
          }
        },

        /**
         * Page changed
         * @param controller
         * @param data
         * @param evt
         * @param folder
         * @param page
         * @param {boolean=} executeAction - true if we need to execute action on page change, false otherwise
         * @param {boolean} [refreshLayoutImmediately]
         * @private
         */

        _pageChanged: function(controller, data, evt, folder, page, executeAction, refreshLayoutImmediately = false) {
          const node = controller.getAnchorNode();
          const app = node.getApplication();

          app.getUI().getWidget().getLayoutInformation().invalidateMeasure();
          // Force direct refresh to ensure page layout is executed before VM's response
          if (refreshLayoutImmediately) {
            app.layout.refreshLayout();
          }
          // Queue layout command to be executed once VM answered
          app.scheduler.layoutCommand();

          // If not specified, execute action
          executeAction = typeof executeAction !== "undefined" ? executeAction : true;
          if (app && app.action && executeAction) {
            const currentPageWidget = node.getWidget().getCurrentPage();
            if (currentPageWidget) {
              app.action.executeActionById(currentPageWidget._auiTag);
            }
          }
        },

        /**
         * If current focused node is child of previous page, request focus on first focusable widget of the current page
         * @private
         */
        _requestFocus: function(controller, data) {
          const node = controller.getAnchorNode();
          const folderWidget = controller.getWidget();
          let focusedWidget = null;
          const focusedNode = node.getApplication().getFocusedVMNodeAndValue(true);
          if (focusedNode) {
            focusedWidget = focusedNode.getController().getWidget();
          }
          if (!focusedWidget || focusedWidget.isChildOf(folderWidget)) {
            const pageIndex = folderWidget.getCurrentPage() ? folderWidget.getCurrentPage().getPageIndex() : -1;
            if (pageIndex >= 0 && pageIndex < node.getChildren().length) {
              const pageNode = node.getChildren()[pageIndex];

              const pageHasActiveAction = pageNode.attribute("actionActive") !== 0;

              //1. When no action is associated to a folder page,
              //   the front-end can choose to set the focus to the next focusable element (here inside a sub-page).
              //2. When an action is associated to a folder page,
              //   it's typically in the hands of the program to decide what to do,
              //   and the front-end should not overwrite this.
              if (!pageHasActiveAction) {
                // request focus on the first active widget
                let firstActiveNode = this._getFirstFocusableField(pageNode);
                if (firstActiveNode) {
                  if (firstActiveNode.getCurrentValueNode && firstActiveNode.getCurrentValueNode(false)) {
                    firstActiveNode = firstActiveNode.getCurrentValueNode(false);
                  }
                  const firstActiveController = firstActiveNode.getController();
                  if (firstActiveController) {
                    const firstActiveWidget = firstActiveController.getWidget();
                    if (firstActiveWidget) {
                      if (firstActiveNode.isInTable()) {
                        // if we land in a table, this one should ask the VM rather than the field
                        firstActiveWidget.getTableWidgetBase().emit(context.constants.widgetEvents.requestFocus);
                      } else {
                        firstActiveWidget.emit(context.constants.widgetEvents.requestFocus);
                      }
                    }
                  }
                }
              }
            }
          }
        },

        /**
         *
         * @param node
         * @return {*}
         * @private
         */
        _getFirstFocusableField: function(node) {
          if (['FormField', 'Table', 'Matrix', 'Button'].indexOf(node.getTag()) !== -1 &&
            (node.attribute("active") > 0 || node.attribute("actionActive") > 0) &&
            (!node.isAttributeSetByVM("tabIndex") || node.attribute("tabIndex") !== 0)) {
            return node;
          }
          // get first active field sorted by tabindex
          const nodeChildren = node.getTabIndexSortedChildren();
          for (const currentNode of nodeChildren) {
            if (currentNode.attribute('hidden') !== 1) { // exclude hidden nodes from being focusable
              const focusableNode = this._getFirstFocusableField(currentNode);
              if (focusableNode) {
                return focusableNode;
              }
            }
          }
          return null;
        }
      };
    });
  });
