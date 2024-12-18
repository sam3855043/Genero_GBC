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

modulum('OnLayoutUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class OnLayoutUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.OnLayoutUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.OnLayoutUIBehavior.prototype */ {
        /** @type {string} */
        __name: "OnLayoutUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          let node = controller.getAnchorNode();
          data.afterLayoutHandler = node.getApplication().layout.afterLayout(this._onLayout.bind(this, controller, data));

          let widget = controller.getWidget();
          if (widget) {
            data.layoutHandler = widget.when(context.constants.widgetEvents.layout, this._onLayout.bind(this,
              controller,
              data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.afterLayoutHandler) {
            data.afterLayoutHandler();
            data.afterLayoutHandler = null;
          }
          if (data.layoutHandler) {
            data.layoutHandler();
            data.layoutHandler = null;
          }
        },

        /**
         * On layout widget event: send new page size to vm
         * @private
         */
        _onLayout: function(controller, data) {
          let widget = controller.getWidget();

          let isVisible = widget.isPageVisible ? widget.isPageVisible() : true;
          isVisible = isVisible && widget.isElementInDOM() && widget.isVisibleRecursively();
          // if widget is in a page which is not visible it is not necessary to send a pageSize
          if (isVisible && widget.getDataAreaHeight && widget.getRowHeight) {
            let dataAreaHeight = widget.getDataAreaHeight();
            let rowHeight = widget.getRowHeight();
            if (!isNaN(dataAreaHeight) && dataAreaHeight > 0 && rowHeight > 0) {
              let newPageSize = Math.floor(dataAreaHeight / rowHeight + 0.1); // add 0.1 for values like 9,99
              newPageSize = Number.isNaN(newPageSize) ? 1 : Math.max(newPageSize, 1);
              // Add 2 to the buffer size for the drag and drop to work when droping after the last row
              let newBufferSize = newPageSize + 2;

              let node = controller.getAnchorNode();
              let app = node.getApplication();

              if (app && !app.scheduler.hasPendingFunctionCallResultCommands(true)) {
                let pageSize = node.attribute('pageSize');
                let bufferSize = node.attribute('bufferSize');
                if (pageSize !== newPageSize || bufferSize !== newBufferSize) {
                  app.scheduler.pageSizeVMCommand(node, newPageSize, newBufferSize);
                }
              }
            }
          }
        }
      };
    });
  });
