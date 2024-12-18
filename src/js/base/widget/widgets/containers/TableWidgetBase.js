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

modulum('TableWidgetBase', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TableWidgetBase widget (abstract class for TableWidget & ListViewWidget).
     * @class TableWidgetBase
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.TableWidgetBase = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.TableWidgetBase.prototype */ {
        __name: "TableWidgetBase",

        /** @type {boolean} */
        __virtual: true,

        /** @type {number} */
        _currentRow: 0,
        /** @type {number} */
        _size: 0,
        /** @type {number} */
        _offset: 0,
        /** @type {number} */
        _pageSize: 0,
        /** @type {number} */
        _bufferSize: 0,
        /** @type {?number} */
        _firstPageSize: null,
        /** @type {boolean} */
        _fixedPageSize: false,
        /** @type {number} */
        _visibleRowCount: 0,

        /** @type {boolean} */
        _inputMode: false,

        /** @type {?boolean} */
        _rowActionTriggerByDoubleClick: true,
        /** @type {classes.UserInterfaceWidget} */
        _uiWidget: null,
        /** @type {classes.FolderWidgetBase} */
        _folderPageWidget: null,

        /** Handlers */
        /** @function */
        _uiActivateHandler: null,
        /** @function */
        _pageActivateHandler: null,

        /** @type {HTMLElement} */
        _scrollAreaElement: null,

        /** @type {boolean} */
        _hasReduceFilter: false,

        /** @type {boolean} */
        _isTreeView: false,

        /** @type {boolean} */
        _focusOnField: false,

        /** @type {boolean} */
        _haveRowBoundActions: false,

        /**
         * Selection square in pixel
         * @type {object}
         **/
        _selectionSquareIdx: null,

        /** @type {classes.TableCachedDataModel} */
        _cachedDataModel: null,

        /**
         * @type {classes.HighlightWidgetComponent}
         */
        _highlightComponent: null,

        /**
         * @type {classes.RowAspectWidgetComponent}
         */
        _rowAspectComponent: null,

        /**
         * @constructs
         * @param {*} opts - Options passed to the constructor
         */
        constructor: function(opts) {
          opts = opts || {};
          this._uiWidget = opts.uiWidget;
          this._folderPageWidget = opts.folderPageWidget;
          this._isTreeView = Boolean(opts.isTreeView);

          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._uiActivateHandler) {
            this._uiActivateHandler();
            this._uiActivateHandler = null;
          }
          if (this._pageActivateHandler) {
            this._pageActivateHandler();
            this._pageActivateHandler = null;
          }
          this._uiWidget = null;
          this._folderPageWidget = null;
          this._scrollAreaElement = null;

          this._rowAspectComponent.destroy();
          this._rowAspectComponent = null;
          this._highlightComponent.destroy();
          this._highlightComponent = null;

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this.setFocusable(true);

          // TODO instead of having UserInterfaceWidget which emits an activate signal
          // TODO it should be directly the WindowWidget which should emit the signal
          // TODO also seems buggy we receive activate signal even when window is not added to DOM
          this._uiActivateHandler = this._uiWidget.onActivate(this._whenParentActivated.bind(this));
          if (this._folderPageWidget) {
            this._pageActivateHandler = this._folderPageWidget.onActivate(this._whenParentActivated.bind(this));
          }

          this._rowAspectComponent = new cls.RowAspectWidgetComponent(this);
          this._highlightComponent = new cls.HighlightWidgetComponent(this);
        },

        /**
         * When a parent widget is activated (added to DOM actually)
         * Used when parent window or parent folder page are removed from DOM and added again
         * we need to reapply context which are lost when table is removed from DOM
         * (scroll position)
         * @param {Object} opt - option of the emitted signal
         * @private
         */
        _whenParentActivated: function(opt) {},

        /**
         * @inheritDoc
         */
        resetLayout: function() {
          $super.resetLayout.call(this);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this.getRowBoundMenu()?.isVisible()) {
            keyProcessed = this.getRowBoundMenu().managePriorityKeyDown(keyString, domKeyEvent, repeat);
          }
          return keyProcessed;
        },

        /**
         * Set the DOM focus to the widget
         * @param {boolean} [noScroll] - if true try to disable auto scroll
         * @publicdoc
         */
        domFocus: function(noScroll) {
          if (this._element) {
            if (!noScroll) {
              this._element.domFocus();
            } else {
              // try to not scroll when focus
              this._element.domFocus(null, this.getFormWidget().getContainerElement());
            }
          }
        },

        /**
         * Change current row
         * @param {number} row - new current row
         * @param {boolean} [ensureRowVisible] - if true scroll to be sure row is visible (useful when first row is partially visible)
         * @param {?number} [vmCurrentRow] - vm real current row
         */
        setCurrentRow: function(row, ensureRowVisible = false, vmCurrentRow = null) {
          // TO BE IMPLEMENTED
        },

        /**
         * Returns current row
         * @returns {number} current row
         * @publicdoc
         */
        getCurrentRow: function() {
          return this._currentRow;
        },

        /**
         * Change current column
         * @param {number} col - new current column
         */
        setCurrentColumn: function(col) {
          // TO BE IMPLEMENTED, IF NEEDED
        },

        /**
         * Returns if "anticipate scrolling" is enabled
         * @returns {boolean} true if enabled
         */
        isAnticipateScrollingEnabled: function() {
          return this._cachedDataModel !== null; // && this.isDisplayMode();
        },

        /**
         * Get cached data model
         * @returns {classes.TableCachedDataModel} dataModel
         */
        getCachedDataModel: function() {
          return this._cachedDataModel;
        },

        /**
         * Defines the table pageSize
         * @param {number} pageSize - page size
         */
        setPageSize: function(pageSize) {
          this._setFirstPageSize(pageSize);
          this._pageSize = pageSize;
        },

        /**
         * Keep the first pageSize
         * @param {number} pageSize - page size
         */
        _setFirstPageSize: function(pageSize) {
          if (this._firstPageSize === null && pageSize > 0) {
            this._firstPageSize = pageSize;
          }
        },

        /**
         * Returns page size
         * @returns {?number} the page size
         * @publicdoc
         */
        getPageSize: function() {
          return this._pageSize;
        },

        /**
         * Defines the table bufferSize
         * @param {number} bufferSize - buffer size
         */
        setBufferSize: function(bufferSize) {
          this._bufferSize = bufferSize;
        },

        /**
         * Returns the buffer size
         * @returns {number}
         */
        getBufferSize: function() {
          return this._bufferSize;
        },

        /**
         * Defines if pageSize is fixed
         * @param {boolean} fixed - true if page size is fixed
         */
        setFixedPageSize: function(fixed) {
          if (this._fixedPageSize !== fixed) {
            this._fixedPageSize = fixed;
            this._layoutInformation.getStretched().setDefaultY(!fixed);
          }
        },

        /**
         * Store the row height from the row children height.
         * This value don't use decoration
         * @param {number} height The row height from the row children height
         */
        setRowHeight: function(height) {
          if (this.getRowHeight(false) === height) {
            return;
          }
          this.getLayoutInformation().setRowHeight(height);
          this.setStyle({
            '--rowHeight': `${height}px`
          });
        },

        /**
         * Store the row decoration height, used to get the complete row height for layout purpose
         * @param {number} decorationHeight The row decoration height (padding + border)
         */
        setRowDecorationHeight: function(decorationHeight) {
          if (this.getLayoutInformation().getRowDecorationHeight() === decorationHeight) {
            return;
          }
          this.getLayoutInformation().setRowDecorationHeight(decorationHeight);
          this.setStyle({
            '--rowDecorationHeight': `${decorationHeight}px`
          });
        },

        /**
         * @param {boolean} withDecoration Get the value with or without the decoration (padding  + border) Default = true
         * @returns {number} The rowHeight in pixels
         */
        getRowHeight: function(withDecoration = true) {
          if (withDecoration && this.getLayoutInformation().getDecoratedRowHeight) {
            return this.getLayoutInformation().getDecoratedRowHeight();
          }
          return this.getLayoutInformation().getRowHeight();
        },

        /**
         * Returns if pageSize is fixed
         * @returns {boolean} true if pageSize is fixed
         * @publicdoc
         */
        isFixedPageSize: function() {
          return this._fixedPageSize;
        },

        /**
         * Returns table size
         * @returns {number} the table size
         * @publicdoc
         */
        getSize: function() {
          return this._size;
        },

        /**
         * Defines the table size (total number of row)
         * @param {number} size - size value
         */
        setSize: function(size) {
          this._size = size;
        },

        /**
         * Defines the table offset
         * @param {number} offset - offset value
         */
        setOffset: function(offset) {
          if (offset < 0) {
            throw Error("Offset value shouldn't be lower than 0");
          }
          this._offset = offset;
        },

        /**
         * Returns table offset
         * @returns {number} the table offset
         * @publicdoc
         */
        getOffset: function() {
          return this._offset;
        },

        /**
         * Sets the number of visible rows
         * @param {number} visibleRows - number of visible rows
         */
        setVisibleRowCount: function(visibleRows) {
          this._visibleRowCount = visibleRows;
        },

        /**
         * Returns number of visible rows
         * @returns {number} the number of visible rows
         */
        getVisibleRowCount: function() {
          return this._visibleRowCount;
        },

        /**
         * @inheritDoc
         */
        setDialogType: function(dialogType) {
          $super.setDialogType.call(this, dialogType);
          this._element.toggleClass("inputMode", this.isInputMode() || this.isInputArrayMode());
        },

        /**
         * Returns if table is in input mode.
         * @returns {boolean} true if input mode
         * @publicdoc
         */
        isInputMode: function() {
          return this._dialogType === "Input" || this._dialogType === "Construct";
        },

        /**
         * Returns if table is in input array mode.
         * @returns {boolean} true if input array mode
         * @publicdoc
         */
        isInputArrayMode: function() {
          return this._dialogType === "InputArray";
        },

        /**
         * Returns if table is in display mode.
         * @returns {boolean} true if display mode
         * @publicdoc
         */
        isDisplayMode: function() {
          return !this.isInputArrayMode() && !this.isInputMode();
        },

        /**
         * Call when a widget in the table request the focus
         * @param {classes.WidgetBase} widget - widget that request focus
         * @param {Object} event - event that request focus
         */
        requestFocusFromWidget: function(widget, event) {
          if (this.isEnabled()) {
            widget.emit(context.constants.widgetEvents.requestFocus, event);
          }
        },

        /**
         * @returns {number} table data area height
         */
        getDataAreaHeight: function() {
          return this.getLayoutInformation().getAllocated().getHeight() - this.getLayoutInformation().getDecorating().getHeight();
        },

        /**
         * @returns {number} table data area width
         */
        getDataAreaWidth: function() {
          return this.getLayoutInformation().getAllocated().getWidth() - this.getLayoutInformation().getDecorating().getWidth();
        },

        /**
         * Indicates how the row action must be triggered.
         * @param {boolean} b - true if action is triggered by double click (else it is single click)
         */
        setRowActionTriggerByDoubleClick: function(b) {
          this._rowActionTriggerByDoubleClick = b;
        },

        /**
         * Indicates how the row action must be triggered.
         * @returns {boolean} true if action is triggered by double click (else it is single click)
         */
        isRowActionTriggerByDoubleClick: function() {
          return this._rowActionTriggerByDoubleClick;
        },

        /**
         * Defines the highlight color of rows for the table
         * @param {string} color - CSS color
         */
        setHighlightColor: function(color) {
          this._highlightComponent.setHighlightBackgroundColor(color);
        },

        /**
         * Defines the highlighted text color of rows for the table
         * @param {string} color - CSS color
         */
        setHighlightTextColor: function(color) {
          this._highlightComponent.setHighlightTextColor(color);
        },

        /**
         * Indicates if the current row must be highlighted
         * @param {boolean} b - true if current row must be highlighted
         */
        setHighlightCurrentRow: function(doHighlight) {
          this._highlightComponent.setShouldHighlightCurrentRow(doHighlight);
        },

        /**
         * Return if the current row must be highlighted
         * @returns {?boolean} true if current row must be highlighted
         * @publicdoc
         */
        isHighlightCurrentRow: function() {
          return this._highlightComponent.getShouldHighlightCurrentRow();
        },

        /**
         * Indicates if the current cell must be highlighted in a table
         * @param {boolean} b - true if current cell must be highlighted
         */
        setHighlightCurrentCell: function(doHighlight) {
          this._highlightComponent.setShouldHighlightCurrentCell(doHighlight);
        },

        /**
         * Return if the current cell must be highlighted
         * @returns {?boolean} true if current cell must be highlighted
         * @publicdoc
         */
        isHighlightCurrentCell: function() {
          return this._highlightComponent.getShouldHighlightCurrentCell();
        },

        /**
         * Set the widget color (specific code for widget in a table)
         * @param {classes.WidgetBase} widget - widget on which color will be applied
         * @param {string} color - a CSS color definition
         */
        setInTableWidgetColor: function(widget, color) {
          // TO BE IMPLEMENTED
        },

        /**
         * Set the widget background color (specific code for widget in a table)
         * @param {classes.WidgetBase} widget - widget on which bg color will be applied
         * @param {string} color - a CSS color definition
         */
        setInTableWidgetBackgroundColor: function(widget, color) {
          // TO BE IMPLEMENTED
        },

        /**
         * Update vertical scroll
         * @param {boolean} [forceScroll] - true to force scrolling
         */
        updateVerticalScroll: function(forceScroll) {
          this.setVerticalScroll(this.getOffset(), forceScroll);
        },

        /**
         * Scroll the table to the offset sent in parameter
         * @param {?number} offset
         * @param {boolean} [forceScroll]
         */
        setVerticalScroll: function(offset, forceScroll = false) {
          // TO BE IMPLEMENTED
        },

        /**
         * Returns scrollable area DOM Element
         * @returns {HTMLElement} scrollable area DOM Element
         */
        getScrollableArea: function() {
          // TO BE IMPLEMENTED
        },

        /**
         * Returns rowBound widget
         * @returns {classes.ContextMenuWidget} rowBound
         */
        getRowBoundMenu: function() {
          return this.getApplicationWidget().getRowBoundMenu();
        },

        /**
         * Set if we are sure that table has some rowBound actions
         * @param {boolean} b true if table has some rowBound actions
         */
        setHaveRowBoundActions: function(b) {
          this._haveRowBoundActions = b;
        },

        /**
         * Returns if we are sure that table has some rowBound actions
         * @returns {boolean} true if table has some rowBound actions
         */
        haveRowBoundActions: function() {
          return this._haveRowBoundActions;
        },

        /**
         * Indicates if the table can have a reduce filter
         * @param {boolean} b - true if table can have a reduce filter
         */
        setReduceFilter: function(b) {
          this._hasReduceFilter = b;
        },

        /**
         * Return if the table can have a reduce filter
         * @returns {boolean} true if table can have a reduce filter
         */
        hasReduceFilter: function() {
          return this._hasReduceFilter;
        },

        /**
         * Returns if table is a tree
         * @returns {boolean} true if table is a tree
         * @publicdoc
         */
        isTreeView: function() {
          return this._isTreeView;
        },

        /**
         * Sets table is scrolling
         * @param {boolean} up - scrolling up
         * @param {boolean} down - scrolling down
         */
        setScrolling: function(up, down) {},

        /**
         * Defines if focus in on a field (table item) or (default) on a row
         * @param {boolean} focusOnField - true if focus on field activated
         */
        setFocusOnField: function(focusOnField) {
          this._focusOnField = focusOnField;
        },

        /**
         * Returns if focus is on a field (table item) (by default focus is on a row)
         * @returns {boolean} true if focus on field activated
         */
        hasFocusOnField: function() {
          return this._focusOnField;
        },

        /**
         * Returns if current row is visible
         * @returns {boolean} true if current row is visible
         * @publicdoc
         */
        isCurrentRowVisible: function() {
          return this._currentRow >= 0 && this._currentRow <= this._pageSize;
        },

        /**
         * True if we can show the copy cell/copy row items in the context menu
         * @returns {boolean}
         */
        canShowCopyCellAndRow: function() {
          return this._currentRow >= 0 && this._selectionSquareIdx.left.x === null;
        },

        /**
         * Anticipate scrolling by directly load data from cached model without waiting for VM response
         */
        anticipateScrolling: function() {},

        // ============== START - COMPONENTS GETTERS =====================

        getRowAspectComponent: function() {
          return this._rowAspectComponent;
        },
        // ============== END - COMPONENTS GETTERS =====================

      };
    });
  });
