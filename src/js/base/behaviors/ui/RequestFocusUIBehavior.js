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

modulum('RequestFocusUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class RequestFocusUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.RequestFocusUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.RequestFocusUIBehavior.prototype */ {
        __name: "RequestFocusUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.focusListener = widget.when(context.constants.widgetEvents.requestFocus, this._onRequestFocus.bind(this,
              controller,
              data));
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.focusListener) {
            data.focusListener();
            data.focusListener = null;
          }
          if (data.focusReadyListener) {
            data.focusReadyListener();
            data.focusReadyListener = null;
          }
        },
        /**
         *
         * @param controller
         * @param data
         * @param opt
         * @private
         */
        _onRequestFocus: function(controller, data, opt) {
          const anchorNode = controller.getAnchorNode();
          const app = anchorNode.getApplication();

          // Keep capture allowed value when the event is received.
          const restoringFocus = app.focus.isRestoringVMFocus();
          if (restoringFocus) {
            return;
          }

          if (controller.isInMatrix()) {
            if (!this._requestFocusInMatrix(controller, anchorNode)) {
              return;
            }
          }

          if (controller.isInTable()) {
            if (!this._requestFocusInTable(controller, anchorNode)) {
              return;
            }
          }

          const originWidgetNode = app.getFocusedVMNodeAndValue(true);
          const widget = controller.getWidget();
          if (originWidgetNode !== anchorNode) {
            this._requestFocusFromAnotherOrigin(controller, anchorNode, opt, originWidgetNode);
          } else if (widget.hasFocus() && !widget.hasDOMFocus()) {
            widget.setFocus(true);
          }
        },

        /**
         * @returns {boolean} True if we should request the focus
         * @private
         */
        _requestFocusInMatrix: function(controller, anchorNode) {
          const matrixNode = controller.getNodeBindings().container;
          if (matrixNode.attribute("dialogType") === "DisplayArray") {
            const valueNodeIndex = anchorNode.getIndex();
            const offset = matrixNode.attribute('offset');
            const size = matrixNode.attribute('size');
            const currentRow = valueNodeIndex + offset;

            return currentRow < size;
          }
          return true;
        },

        /**
         * @returns {boolean} True if we should request the focus
         * @private
         */
        _requestFocusInTable: function(controller, anchorNode) {
          const tableColumnNode = controller.getNodeBindings().container;
          const tableNode = tableColumnNode.getParentNode();
          if (tableNode.attribute("active") === 0) {
            return false;
          }
          if (tableColumnNode.attribute("active") === 0) {
            // if column is not active don't request focus if currentRow doesn't change
            const currentRow = tableNode.attribute("currentRow");
            const valueNodeIndex = anchorNode.getIndex();
            const offset = tableNode.attribute('offset');
            const anchorNodeRow = valueNodeIndex + offset;
            return currentRow !== anchorNodeRow;
          }
          return true;
        },

        /**
         * @private
         */
        _requestFocusFromAnotherOrigin: function(controller, anchorNode, opt, originWidgetNode) {
          const widget = controller.getWidget();
          if (originWidgetNode) {
            const originWidgetController = originWidgetNode.getController();
            if (
              originWidgetController
            ) { // check if controller exists. In come case we could have a MenuAction node which doesn't have a controller
              const originWidget = originWidgetController.getWidget();
              if (originWidget) {
                originWidgetController.sendWidgetCursors();
                originWidgetController.sendWidgetValue();
              }
            }
          }

          let cursors = { // for widgets which don't support cursors send 0,0 to VM to set focus
            start: 0,
            end: 0
          };
          if (widget.hasCursors()) {
            cursors = widget.getCursors();
          }
          let rowIndex = -1;
          // check if widget has a defined row index
          if (widget.getRowIndex) {
            rowIndex = widget.getRowIndex();
          }
          const app = anchorNode.getApplication();
          app.scheduler.focusVMCommand(anchorNode, cursors.start, cursors.end, rowIndex);

          // indicates in the event that a focus has been requested
          let event = opt.data.length > 0 && opt.data[0];
          if (event) {
            event.gbcFocusRequested = true;
          }

          // needed to trigger & bubble focus when clicking on a webcomponent even if it's not focusable (gbc-1984)
          if (widget instanceof cls.WebComponentWidget) {
            widget.setFocus(true);
          }
        }
      };
    });
  });
