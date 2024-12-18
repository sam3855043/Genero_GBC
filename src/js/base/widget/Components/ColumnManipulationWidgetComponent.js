/// FOURJS_START_COPYRIGHT(D,2024)
/// Property of Four Js*
/// (c) Copyright Four Js 2024, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ColumnManipulationWidgetComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * A component that hold column management behavior
     * Usefull for table
     * @class ColumnManipulationWidgetComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.ColumnManipulationWidgetComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {

      return /** @lends classes.ColumnManipulationWidgetComponent.prototype */ {
        __name: "ColumnManipulationWidgetComponent",

        $static: /** @lends classes.ColumnManipulationWidgetComponent */ {
          /**
           * @static
           * @type {string}
           */
          dndModeReordering: "columnReordering",
          /**
           * @static
           * @type {string}
           */
          dndModeResizing: "columnResizing",
        },

        //#region Private fields

        /**
         * The hovered column during DnD events
         * @type {classes.RTableColumnWidget}
         */
        _hoveredColumnWidget: null,

        /**
         * The dragged column during DnD reordering events
         * or the resized column during DnD resize events
         * @type {classes.RTableColumnWidget}
         */
        _manipulatedColumnWidget: null,

        /**
         * The current drag and drop mode. Null if no DnD process is occuring
         * @type {string|null}
         */
        _dndMode: null,

        /**
         * The current value horizontal drag when Resize process is occuring
         * null otherwise 
         * @type {number|null} 
         */
        _lastPointerPosX: null,

        //#endregion private fields

        //#region ============== DnD Events FUNCTIONS ===================

        /**
         * If the Dragged element is part of a column, a DnD process is started,
         * otherwise the method do nothing
         * @param {DragEvent} evt The dragstart event triggered by the browser
         * @returns True if the DnD process is started, false otherwise
         */
        onDragStart: function(evt) {
          const columnWidget = this._getTargetAsColumn(evt.target);
          if (!columnWidget) {
            return false;
          }

          if (evt.target.hasClass("resizer")) { // drag start on resizer
            return this._onResizerDragStart(evt, columnWidget);
          } else if (evt.target.hasClass("headerText")) { // drag start on headerText
            return this._onReorderingDragStart(evt, columnWidget);
          }
          return false;
        },

        /**
         * If the Dragged element is part of a column, a DnD process is started,
         * otherwise the method do nothing
         * @param {TouchEvent} evt The touchstart event triggered by the browser
         * @returns True if the DnD process is started, false otherwise
         */
        onTouchStart: function(evt) {
          const columnWidget = this._getTargetAsColumn(evt.target);
          if (!columnWidget) {
            return false;
          }

          if (evt.target.hasClass("resizer")) { // drag start on resizer
            return this._onResizerTouchStart(evt, columnWidget);
          }
          return false;
        },

        /**
         * If the Dragged element is part of a column, the current DnD process is stopped,
         * otherwise the method do nothing
         * @param {DragEvent} evt The dragend event triggered by the browser
         * @returns True if the DnD process end was managed correctly, false otherwise
         */
        onDragEnd: function(evt) {
          const columnWidget = this._getTargetAsColumn(evt.target);
          // If the column triggering the dragend event is not the manipulated column, what happen ?
          if (!columnWidget || columnWidget !== this._manipulatedColumnWidget) {
            return false;
          }

          if (this.isResizing()) { // drag end on resizer
            return this._onResizerDragEnd(evt);
          } else if (this.isReordering()) { // drag end on headerText
            return this._onReorderingDragEnd(evt);
          }
          return false;
        },

        /**
         * If the touch target element is part of a column, the current DnD process is stopped,
         * otherwise the method do nothing
         * @param {DragEvent} evt The dragend event triggered by the browser
         * @returns True if the DnD process end was managed correctly, false otherwise
         */
        onTouchEnd: function(evt) {
          const columnWidget = this._getTargetAsColumn(evt.target);
          if (!columnWidget) {
            return false;
          }

          if (evt.target.hasClass("resizer")) { // drag start on resizer
            return this._onResizerTouchEnd();
          }
          return false;
        },

        /**
         * Handle dragover event.
         * Dispatch the event depending on the DnD mode
         * Store the mouse position 
         * @param {DragEvent} evt The dragover event triggered by the browser
         * @returns {boolean} True if the DnD Process was handled
         */
        onDragOver: function(evt) {
          // Prevent default on dragover, to remove forbidden icon on drag
          if (this._dndMode) {
            evt.preventCancelableDefault();
          }

          // If we are resizing, quit the process ...
          if (this._onResizerDragOver(evt)) {
            return true;
          }

          // ... else try to reorder
          const hoveredColumn = this._getTargetAsColumn(evt.target);
          return this._onReorderingDragOver(evt, hoveredColumn);
        },

        /**
         * Manage the touch event to resize accordingly with the pointer position
         * @param {TouchEvent} evt The touchmove event triggered by the browser
         * @returns {boolean} True if the current DnD Process was handled correctly
         */
        onTouchMove: function(evt) {
          if (evt.target?.hasClass("resizer")) {
            return this._onResizerTouchMove(evt);
          }
          return false;
        },

        /**
         * Handle the dragleave event when reordering is on
         * @param {DragEvent} evt The dragleave event triggered by the browser
         * @returns True if the dragleave event was managed
         */
        onDragLeave: function(evt) {
          return this._onReorderingDragLeave(evt);
        },

        /**
         * Handle Drop event
         * @param {DragEvent} evt The drop event triggered by the browser
         * @returns True if the drop event was managed
         */
        onDrop: function(evt) {
          let dropTargetColumn = this._getTargetAsColumn(evt.target);
          return this._onReorderingDrop(evt, dropTargetColumn);
        },

        //#endregion

        //#region ============== Resize Event/DnD FUNCTIONS ===================

        /**
         * Handle resizer dragStart event on resizer element
         * @param {DragEvent} evt The dragstart event triggered by the browser
         * @param {classes.RTableColumnWidget} columnWidget The column triggering the event 
         * @returns {boolean} True if the process is managed
         * @private
         */
        _onResizerDragStart: function(evt, columnWidget) {
          if (!columnWidget.isSizable()) {
            return false;
          }

          this._setIsResizing();
          this._manipulatedColumnWidget = columnWidget;
          this._lastPointerPosX = evt.clientX || evt.screenX;
          return true;
        },

        /**
         * Handle the touch event and store the position of the touch
         * @param {TouchEvent} evt The touchstart event triggered by the browser
         * @param {classes.RTableColumnWidget} columnWidget The touched column
         * @returns False if the column is not resizable
         * @private
         */
        _onResizerTouchStart: function(evt, columnWidget) {
          if (!columnWidget.isSizable()) {
            return false;
          }

          this._setIsResizing();
          this._manipulatedColumnWidget = columnWidget;

          let touch = evt.touches[0];
          if (touch) {
            this._lastPointerPosX = touch.clientX || touch.screenX;
            evt.preventCancelableDefault();
            return true;
          }

          this._lastPointerPosX = null;
          return false;
        },

        /**
         * Handle resizer dragEnd event on resizer element
         * @param {DragEvent} evt The dragend event triggered by the browser
         * @private
         */
        _onResizerDragEnd: function(evt) {
          if (!this.isResizing()) {
            return false;
          }

          this._exitDndProcess();
          return true;
        },

        /**
         * End the resize process if any
         * @returns {boolean} False if no resize process is occuring
         * @private
         */
        _onResizerTouchEnd: function() {
          if (!this.isResizing()) {
            return false;
          }

          this._exitDndProcess();
          return true;
        },

        /**
         * Handle resizer drag event on resizer element
         * Compute the new width, and send it to the ColumnWidget
         * @param {DragEvent} evt The dragover event triggered by the browser
         * @returns {boolean} True if the process was handled
         * @private
         */
        _onResizerDragOver: function(evt) {
          if (!this.isResizing()) {
            return false;
          }

          evt.preventCancelableDefault();
          return this._onResizerDrag(evt.clientX || evt.screenX);
        },

        /**
         * Resize the manipulated column widget according to the last pointer position and the new one
         * @param {TouchEvent} evt The touchmove event triggered by the browser
         * @private
         */
        _onResizerTouchMove: function(evt) {
          if (!this.isResizing()) {
            return false;
          }

          evt.preventCancelableDefault();
          if (!evt.touches || evt.touches.length === 0) {
            return false;
          }

          return this._onResizerDrag(evt.touches[0].clientX || evt.touches[0].screenX);
        },

        /**
         * @param {number} pointerPosX The horizontal position of the pointer
         * @returns False if no resizing process is occuring, or if we have no pointer position stored
         * @private
         */
        _onResizerDrag: function(pointerPosX) {
          if (!this.isResizing()) {
            return false;
          }

          // If there is no _resizerDragX, or we didn't store any DragX value
          if (!this._lastPointerPosX || !pointerPosX) {
            return false;
          }

          let dragDelta = pointerPosX - this._lastPointerPosX;
          let columnWidth = this._manipulatedColumnWidget.getWidth();

          let newWidth = columnWidth + dragDelta;
          if (this._manipulatedColumnWidget.isReversed()) {
            newWidth = columnWidth - dragDelta;
          }

          this._lastPointerPosX = pointerPosX;
          // Clamp the width to 30 pixels
          newWidth = Math.max(newWidth, 30);
          this._manipulatedColumnWidget.setUserWidthFromInteraction(newWidth);

          return true;
        },

        // #endregion Resize Event/DnD FUNCTIONS

        //#region ============== Reordering Event/DnD FUNCTIONS ===================

        /**
         * Set the dndMode to reordering and store the manipulated column
         * @param {DragEvent} evt The dragstart event triggered by the browser
         * @param {classes.RTableColumnWidget} columnWidget The Dragged column widget
         * @returns {boolean} True if the drag process is managed
         * @private
         */
        _onReorderingDragStart: function(evt, columnWidget) {
          if (!columnWidget.isMovable()) {
            evt.preventCancelableDefault();
            return false;
          }

          this._setIsReordering();
          this._manipulatedColumnWidget = columnWidget;
        },

        /**
         * Exit the DndProcess if we were reordering
         * @param {DragEvent} evt The dragend event triggered by the browser
         * @private
         */
        _onReorderingDragEnd: function(evt) {
          if (!this.isReordering()) {
            return false;
          }

          this._exitDndProcess();
          return true;
        },

        /**
         * Handle reordering dragover event
         * @param {DragEvent} evt The dragover event triggered by the browser
         * @param {classes.RTableColumnWidget} hoveredColumn The column that have triggered the dragover event
         * @returns {boolean} True if the process is handled right
         * @private
         */
        _onReorderingDragOver: function(evt, hoveredColumn) {
          if (!this.isReordering()) {
            return false;
          }
          // Allow drop
          evt.preventCancelableDefault();

          if (this._hoveredColumnWidget === hoveredColumn) {
            return true;
          }

          if (hoveredColumn) {
            // Find the new hovered columns, that is in the drag limits
            const dragLimit = this._manipulatedColumnWidget.getDragLimit();

            let hoverIndex = hoveredColumn.getOrderedColumnIndex();
            hoverIndex = Math.clamp(hoverIndex, dragLimit.min, dragLimit.max);
            // Get the column that match the limited over index
            hoveredColumn = this.getWidget().getOrderedColumns()[hoverIndex];
          }
          this._setHoveredColumn(hoveredColumn);
          if (this._hoveredColumnWidget) {
            this._hoveredColumnWidget.setReorderingSide(this._manipulatedColumnWidget.getOrderedColumnIndex());
          }
          return true;
        },

        /**
         * Set the currently hovered column to null if we are in a reordering process
         * @param {DragEvent} evt The dragleave event triggered by the browser
         * @returns False if no reordering process is occuring
         */
        _onReorderingDragLeave: function(evt) {
          if (!this.isReordering()) {
            return false;
          }

          this._setHoveredColumn(null);
          return true;
        },

        /**
         * Handle the drop event when reordering columns.
         * @param {DragEvent} evt The drop event fired by the browser
         * @returns False if no reordering process is occuring
         */
        _onReorderingDrop: function(evt, dropTargetColumn) {
          if (!this.isReordering()) {
            return false;
          }
          evt.preventCancelableDefault();

          // The manipulated column might have been dropped after the last column
          // Assuming that this method is only called by a drop event on the right DOM Element
          if (!dropTargetColumn) {
            const orderedColumns = this.getWidget().getOrderedColumns();
            dropTargetColumn = orderedColumns[orderedColumns.length - 1];
          }

          this._reorderColumns(this._manipulatedColumnWidget, dropTargetColumn);
          this._exitDndProcess();
          return true;
        },

        //#endregion Reordering Event/DnD FUNCTIONS

        //#region ============== GETTERS ==============

        /**
         * @returns {string | null} The current dnd mode, null if not in dnd process
         */
        getDndMode: function() {
          return this._dndMode;
        },

        /**
         * @returns {boolean} True if the dndMode is set to Resizing
         */
        isResizing: function() {
          return this.getDndMode() === cls.ColumnManipulationWidgetComponent.dndModeResizing &&
            this._manipulatedColumnWidget;
        },

        /**
         * @returns {boolean} True if the dndMode is set to Reordering
         */
        isReordering: function() {
          return this.getDndMode() === cls.ColumnManipulationWidgetComponent.dndModeReordering &&
            this._manipulatedColumnWidget;
        },
        //#endregion

        //#region ============== SETTERS ==============

        /**
         * Set the dnd mode to resizing
         * @private
         */
        _setIsResizing: function() {
          this._dndMode = cls.ColumnManipulationWidgetComponent.dndModeResizing;
        },

        /**
         * Set the dnd mode to reordering
         * Store the 
         * @private
         */
        _setIsReordering: function(manipulatedColumn) {
          this._dndMode = cls.ColumnManipulationWidgetComponent.dndModeReordering;
        },

        /**
         * - Set the dnd mode to null
         * - Clean CSS state of hovered column if any
         * - Clean widgets variables
         * @private
         */
        _exitDndProcess: function() {
          // resizing vars
          this._lastPointerPosX = null;

          this._setHoveredColumn(null);

          // common vars
          this._manipulatedColumnWidget = null;
          this._dndMode = null;
        },

        /**
         * Reset the currently hovered column CSS if any,
         * store the newly hovered column
         * @param {classes.RTableColumnWidget} hoveredColumn The newly hovered column
         */
        _setHoveredColumn: function(hoveredColumn) {
          if (this._hoveredColumnWidget === hoveredColumn) {
            return;
          }

          if (this._hoveredColumnWidget) {
            this._hoveredColumnWidget.cleanReorderingState();
          }
          this._hoveredColumnWidget = hoveredColumn;
        },

        //#endregion

        //#region ============== UTILS ==============

        /**
         * Get the Column Widget associated with the target if possible
         * @param {Element} target Event Target
         * @returns {classes.RTableColumnWidget} The target as ColumnWidget, or null
         * @private
         */
        _getTargetAsColumn(target) {
          //@todo : replace "gbc_RTableColumnWidget" to make this more generic
          return gbc.WidgetService.getWidgetFromElement(target, "gbc_RTableColumnWidget");
        },

        /**
         * Use the droppedColumn and the target column 
         * to compute the new index of the manipulated column
         * and then update the parent widget
         * @param {classes.RTableColumnWidget} droppedColumn
         * @param {classes.RTableColumnWidget} targetColumn
         * @private
         */
        _reorderColumns(droppedColumn, targetColumn) {
          let reorderedColumns = this.getWidget().getOrderedColumns().slice();

          let dragColIndex = reorderedColumns.indexOf(droppedColumn);
          let dropColIndex = reorderedColumns.indexOf(targetColumn);

          const dragLimit = droppedColumn.getDragLimit();

          dropColIndex = Math.clamp(dropColIndex, dragLimit.min, dragLimit.max);

          reorderedColumns.removeAt(dragColIndex);
          reorderedColumns.insert(droppedColumn, dropColIndex);

          // First set correct order on each column
          for (let i = 0; i < reorderedColumns.length; i++) {
            let col = reorderedColumns[i];
            col.setOrder(i, true);
          }

          this.getWidget().update(true, false, true);

          // And only after emit signal to send tabIndex to VM
          // (Don't do it in the same loop)
          for (let i = 0; i < reorderedColumns.length; i++) {
            let col = reorderedColumns[i];
            col.emit(context.constants.widgetEvents.tableOrderColumn, i);
          }
        }
        //#endregion
      }; // End return
    }); // End Class
  } // JS Face Function
); // End Modulum
