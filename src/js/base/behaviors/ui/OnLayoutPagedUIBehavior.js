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

modulum('OnLayoutPagedUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class OnLayoutPagedUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.OnLayoutPagedUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.OnLayoutPagedUIBehavior.prototype */ {
        /** @type {string} */
        __name: "OnLayoutPagedUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const node = controller.getAnchorNode();
          data.afterLayoutHandler = node.getApplication().layout.afterLayout(this._onLayout.bind(this, controller, data));
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.afterLayoutHandler) {
            data.afterLayoutHandler();
            data.afterLayoutHandler = null;
          }
        },

        /**
         * On layout widget event: send new page size to vm
         * @private
         */
        _onLayout: function(controller, data) {
          const node = controller.getAnchorNode();
          const pageSize = node.attribute('pageSize');

          const widget = controller.getWidget();
          const app = node.getApplication();

          if (app) {
            const dataAreaWidth = widget.getDataAreaWidth();
            const dataAreaHeight = widget.getDataAreaHeight();

            let isVisible = widget.isElementInDOM() && widget.isVisibleRecursively();
            isVisible = isVisible && !isNaN(dataAreaHeight) && !isNaN(dataAreaWidth) && dataAreaHeight > 0 && dataAreaWidth > 0;
            // if widget is in a page which is not visible it is not necessary to send a pageSize
            if (isVisible) {
              const rowWidth = widget.getRowWidth();
              const rowHeight = widget.getRowHeight();

              let newPageSize = 1;
              if (rowHeight !== 0 && rowWidth !== 0) {
                const gutter = context.ThemeService.getGutterY();
                const margin = context.ThemeService.getValue("theme-margin-ratio") * 8; // Account for margin around each item
                // for small screens minimum should be 1
                const lines = Math.floor(dataAreaHeight / (rowHeight + (margin * 2 + gutter * 2))) || 1;
                const cols = Math.floor(dataAreaWidth / (rowWidth + 2 * margin)) || 1; // for small screens minimum should be 1
                newPageSize = lines * cols;
              }

              if (app.isIdle() && app.scheduler.hasNoCommandToProcess() && newPageSize !== data.requestedPageSize && (pageSize !==
                  newPageSize)) {
                let event = new cls.VMConfigureEvent(node.getId(), {
                  pageSize: newPageSize,
                  bufferSize: newPageSize
                });
                app.scheduler.eventVMCommand(event, node);
                data.requestedPageSize = newPageSize;
                event = new cls.VMConfigureEvent(node.getId(), {
                  offset: Math.floor(node.attribute('offset') / newPageSize) * newPageSize
                });
                app.scheduler.eventVMCommand(event, node);
              }
            }
          }
        }
      };
    });
  });
