/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RTableColumnWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Responsive Table column widget.
     * @class RTableColumnWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.RTableColumnWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.RTableColumnWidget.prototype */ {
        // JS DOC definition
        /**
         * @typedef {Object} DragLimit
         * @property {number} min - The minimum index possible to drop on 
         * @property {number} max - The maximum index possible to drop on 
         */

        /** @inheritdoc */
        __name: "RTableColumnWidget",

        /** @type {boolean} */
        _isTreeView: false,

        /** @type {boolean} */
        _isAlwaysHidden: false,

        /** @type {boolean} */
        _isUnhidable: false,

        /** @type {boolean} */
        _isLeftFrozen: false,
        /** @type {boolean} */
        _isLastLeftFrozen: false,
        /** @type {boolean} */
        _isRightFrozen: false,
        /** @type {boolean} */
        _isFirstRightFrozen: false,

        /** @type {number} */
        _leftFrozenPosition: 0,
        /** @type {number} */
        _rightFrozenPosition: 0,

        /**
         * The aggregate widget
         * @type {classes.LabelWidget}
         */
        _aggregateLabelWidget: null,

        /** @type {classes.ContextMenuWidget} */
        _contextMenu: null,

        /**
         * column width (user value)
         * @type {number|null}
         */
        _userWidth: null,

        /** @type {boolean} */
        _isSorted: false,

        /**
         * column order
         * @type {number|null}
         */
        _order: null,

        /**
         * is column draggable/movable
         * @type {boolean}
         */
        _isMovable: true,

        /**
         * is column resizable
         * @type {boolean}
         */
        _isSizable: true,

        /** @type {boolean} */
        _isCurrent: false,

        /**
         * is column detached from dom
         * @type {boolean}
         */
        _detachedFromDom: false,

        /** @type {Object} **/
        _saveStyle: null,

        /**
         * @constructs
         * @param {*} opts - Options passed to the constructor
         */
        constructor: function(opts) {
          opts = (opts || {});
          opts.inTable = true;
          this._isTreeView = opts.isTreeView;
          this._tableWidgetBase = opts.tableWidget;

          this.getTableWidgetBase().addColumn(this);
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._children = [];

          if (this._aggregateLabelWidget) {
            this._aggregateLabelWidget.destroy();
            this._aggregateLabelWidget = null;
          }

          if (this._contextMenu) {
            this._contextMenu.destroyChildren();
            this._contextMenu.destroy();
            this._contextMenu = null;
          }

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this._contextMenu && this._contextMenu.isVisible()) {
            keyProcessed = this._contextMenu.managePriorityKeyDown(keyString, domKeyEvent, repeat);
          }
          return keyProcessed;
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (!domEvent.target.hasClass("resizer") && !this.getTableWidgetBase()
            .isInputMode()) { // disable column header sorting in Input mode
            this.getTableWidgetBase().emit(context.constants.widgetEvents.tableHeaderSort, this.getColumnIndex());
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          let target = domEvent.target;

          // double click on resizer 
          if (target.hasClass("resizer") && !target.hasClass("unresizable")) {
            this.onResizerDoubleClick(domEvent);
            return false;
          }

          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseRightClick: function(domEvent) {
          if (!domEvent.shiftKey) {
            domEvent.preventCancelableDefault();
            this._buildContextMenu(domEvent);
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {

          options = options || {};
          options.isRowData = true;

          options.position = typeof(options.position) === "undefined" ? null : options.position;
          options.rowIndex = options.position !== null ? options.position : this._children.length;

          options.colWidget = this;

          if (this.isHidden()) { // if col is hidden do not add item in the DOM
            options.noDOMInsert = true;
            this.setDetachedFromDom(true);
          }
          this.getTableWidgetBase().addChildWidget(widget, options);
        },

        /**
         * Build context menu and show it
         */
        _buildContextMenu: function(domEvent) {

          if (this._contextMenu) {
            this._contextMenu.destroyChildren();
            this._contextMenu.destroy();
            this._contextMenu = null;
          }

          let opts = this.getBuildParameters();
          opts.inTable = false; // contextmenu is not really in the table, it is outside
          opts.ignoreLayout = true;
          opts.unHidable = this.isUnhidable(); // pass unHidable param

          this._contextMenu = cls.WidgetFactory.createWidget("ContextMenu", opts);
          this._contextMenu.allowMultipleChoices(true);
          this._contextMenu.setParentWidget(this);
          this._contextMenu.setColor(this.getColor());
          this._contextMenu.setBackgroundColor(this.getBackgroundColor());
          this._contextMenu.onClose(function() {
            this.afterDomMutator(function() {
              if (this._contextMenu) {
                this._contextMenu.destroyChildren();
                this._contextMenu.destroy();
                this._contextMenu = null;
              }
            }.bind(this));
          }.bind(this), true);

          let tableWidget = this.getTableWidgetBase();
          let columns = tableWidget.getColumns();

          if (tableWidget.isFrozenTable()) {
            let leftFrozenLabel = cls.WidgetFactory.createWidget("Label", opts);
            let rightFrozenLabel = cls.WidgetFactory.createWidget("Label", opts);
            let unfreezeLabel = cls.WidgetFactory.createWidget("Label", opts);
            let freezeIndex = 0;
            let columnCount = 0;

            leftFrozenLabel.setValue(i18next.t("gwc.contextMenu.freezeLeft"));
            rightFrozenLabel.setValue(i18next.t("gwc.contextMenu.freezeRight"));
            unfreezeLabel.setValue(i18next.t("gwc.contextMenu.unfreezeAll"));

            leftFrozenLabel.addClass("gbc_freezeLeft_action");
            rightFrozenLabel.addClass("gbc_freezeRight_action");
            unfreezeLabel.addClass("gbc_unfreezeAll_action");

            leftFrozenLabel.setEnabled(!this.isRightFrozen());
            rightFrozenLabel.setEnabled(!this.isLeftFrozen());

            this._contextMenu.addChildWidget(leftFrozenLabel, {
              clickCallback: function() {
                if (leftFrozenLabel.isEnabled()) {
                  freezeIndex = this.getOrderedColumnIndex() + 1;
                  tableWidget.setLeftFrozenColumns(freezeIndex);
                  tableWidget.updateFrozenColumns();
                  tableWidget.updateVisibleColumnsInDom();

                  tableWidget.emit(gbc.constants.widgetEvents.tableLeftFrozen, freezeIndex);
                }
              }.bind(this)
            });
            this._contextMenu.addChildWidget(rightFrozenLabel, {
              clickCallback: function() {
                if (rightFrozenLabel.isEnabled()) {
                  columnCount = columns.length;
                  freezeIndex = this.getOrderedColumnIndex();
                  tableWidget.setRightFrozenColumns(columnCount - freezeIndex);
                  tableWidget.updateFrozenColumns();
                  tableWidget.updateVisibleColumnsInDom();

                  tableWidget.emit(gbc.constants.widgetEvents.tableRightFrozen, columnCount - freezeIndex);
                }
              }.bind(this)
            });
            this._contextMenu.addChildWidget(unfreezeLabel, {
              clickCallback: function() {
                tableWidget.setLeftFrozenColumns(0);
                tableWidget.setRightFrozenColumns(0);
                tableWidget.updateFrozenColumns();
                tableWidget.updateVisibleColumnsInDom();
                tableWidget.emit(gbc.constants.widgetEvents.tableLeftFrozen, 0);
                tableWidget.emit(gbc.constants.widgetEvents.tableRightFrozen, 0);
              }.bind(this)
            });
          }

          // Reset sort order action
          if (this._isSorted) {
            if (tableWidget.isFrozenTable()) {
              this._contextMenu.addSeparator();
            }

            let resetLabel = cls.WidgetFactory.createWidget("Label", opts);
            resetLabel.setValue(i18next.t("gwc.contextMenu.restoreColumnSort"));
            resetLabel.addClass("gbc_restoreColumnSort_action");
            this._contextMenu.addChildWidget(resetLabel, {
              clickCallback: function() {
                tableWidget.emit(context.constants.widgetEvents.tableHeaderSort, -1);
              }.bind(this)
            });
          }

          // hide other columns action
          if (!this.isUnhidable() && !((tableWidget.isInputMode() || tableWidget.isInputArrayMode()) && !this.isCurrent())) {
            //if (this.isCheckable()) {
            let hideOtherColumnsLabel = cls.WidgetFactory.createWidget("Label", opts);
            hideOtherColumnsLabel.setValue(i18next.t("gwc.contextMenu.hideAllButSelected"));
            hideOtherColumnsLabel.addClass("gbc_hideAllButSelected_action");
            this._contextMenu.addChildWidget(hideOtherColumnsLabel, {
              clickCallback: function() {
                this.hideOtherColumns();
              }.bind(this)
            });
            this._contextMenu.addSeparator();
          }

          this.getTableWidgetBase().fillContextMenu(this._contextMenu, opts);

          // beware setFocus should not raise a scroll event (it will immediately close contextmenu)
          this._element.domFocus(null, this.getElement());

          this._contextMenu.parentElement = this.getElement();
          this._contextMenu.show();
        },

        /**
         * Hide other columns
         */
        hideOtherColumns: function() {
          let tableWidget = this.getTableWidgetBase();
          let columns = tableWidget.getColumns();
          for (let column of columns) {
            if (!column.isAlwaysHidden() && !column.isUnhidable() && column !== this) {
              column.emit(gbc.constants.widgetEvents.tableShowHideCol, "hide");
            }
          }
          // we hide other columns but we must show current column
          this.emit(gbc.constants.widgetEvents.tableShowHideCol, "show");
        },

        /**
         * Returns Table items of this column
         * @returns {classes.RTableItemWidget[]}
         */
        getItems: function() {
          return this._children;
        },

        /**
         * Returns column item at the specified index (row)
         * @param {number} index - index of the item (row)
         * @returns {classes.RTableItemWidget} item widget
         * @publicdoc
         */
        getItem: function(index) {
          return this._children[index];
        },

        /**
         * Sets column title text
         * @param {string} text - the title text
         * @publicdoc
         */
        setTitleText: function(text) {
          this._setTextContent(text, function() {
            return this._element.getElementsByClassName("headerText")[0];
          }.bind(this));

          // add data-header on each item
          for (const item of this._children) {
            item.getElement().setAttribute("data-header", text);
          }
        },

        /**
         * Returns column title text
         * @returns {string} the title text
         * @publicdoc
         */
        getText: function() {
          return this._element.getElementsByClassName("headerText")[0].textContent;
        },

        /**
         * Returns the element used to resize the column
         * @returns {HTMLElement} the resizer element
         * @publicdoc
         */
        getResizerElement: function() {
          return this._element.getElementsByClassName("resizer")[0];
        },

        /**
         * Returns index of the column in the parent table (vm aui index)
         * @returns {number} index of the column in the table
         * @publicdoc
         */
        getColumnIndex: function() {
          let tableWidget = this.getTableWidgetBase();
          if (tableWidget) {
            return tableWidget.getColumns().indexOf(this);
          }
          return -1;
        },

        /**
         * Returns index of the column in the parent table only in visible columns
         * @returns {number} index of the visible column in the table
         * @publicdoc
         */
        getVisibleColumnIndex: function() {
          let tableWidget = this.getTableWidgetBase();

          let index = 0;
          let found = false;
          for (const colWidget of tableWidget.getOrderedColumns()) {
            if (colWidget === this) {
              found = true;
              break;
            }
            if (!colWidget.isDetachedFromDom()) { // detachedFromDom = hidden + out of view
              index++;
            }
          }

          return found ? index : -1;
        },

        /**
         * Returns index of the column in the parent table (visual index)
         * @returns {number} index of the column in the table
         * @publicdoc
         */
        getOrderedColumnIndex: function() {
          let tableWidget = this.getTableWidgetBase();
          if (tableWidget) {
            return tableWidget.getOrderedColumns().indexOf(this);
          }
          return -1;
        },

        /**
         * Returns true if column is detached from DOM (column not visible)
         * @returns {boolean}
         */
        isDetachedFromDom: function() {
          return this._detachedFromDom;
        },

        /**
         * Flag column as detached from DOM
         * @param detached
         */
        setDetachedFromDom: function(detached) {
          this._detachedFromDom = detached;
        },

        /**
         *  Remove all items (container element) from DOM
         */
        detachItemsFromDom: function() {
          if (!this.isDetachedFromDom()) {
            this.setDetachedFromDom(true);
            this.getElement().remove();
          }
          for (const itemWidget of this.getChildren()) {
            if (!itemWidget.isDetachedFromDom()) {
              itemWidget.setDetachedFromDom(true);
              itemWidget.getElement().remove();
            }
          }
        },

        /**
         * Attach all items (container element) to DOM
         * @param prepend
         */
        attachItemsToDom: function(prepend = false) {
          let colIndex = 0;
          // we try to keep a proper order of columns in the DOM even if columns order is corrected by css order attributes
          // this is why we will determine column dom position relative to current columns being in the DOM
          if (prepend === true) { // add in begining but after last left frozen column
            colIndex = this.getTableWidgetBase().getLeftFrozenColumns();
          } else {
            colIndex = this.getVisibleColumnIndex();
          }
          if (this.isDetachedFromDom()) {
            this.setDetachedFromDom(false);
            this.getElement().insertAt(colIndex, this.getParentWidget().getContainerElement());
          }

          // insert column items the same way
          for (const itemWidget of this.getChildren()) {
            if (itemWidget.isDetachedFromDom()) {
              let rowWidget = itemWidget.getParentWidget();
              if (rowWidget) {
                itemWidget.setDetachedFromDom(false);
                itemWidget.getElement().insertAt(colIndex, rowWidget.getContainerElement());

              }
            }
          }
        },

        /**
         * @inheritDoc
         */
        setHidden: function(state) {
          // optimization : do not recalculate when no state change
          if (this.isHidden() === state) {
            return;
          }

          $super.setHidden.call(this, state);

          if (this._aggregateLabelWidget) {
            this._aggregateLabelWidget.setHidden(this.isHidden());
          }

          // update table
          let tableWidget = this.getTableWidgetBase();

          if (!this.getLayoutInformation().getMeasured()
            .hasSize()) { // TODO add an explicit function for (this.getLayoutInformation().getMeasured().hasSize())
            // Unknown size (it means column has never been measured) => force measurement
            tableWidget.resetMeasure();
          }

          // col has already been measured, just update columns in DOM
          // delay this operation in scheduler to group all updates when multiple columns are set hidden by VM
          const app = context.SessionService.getCurrent().getCurrentApplication();
          app.scheduler.callbackCommand(function() {
            if (tableWidget && !tableWidget.isDestroyed()) {
              tableWidget.update(false, tableWidget.isFlipped(), !tableWidget.isFlipped());
              tableWidget.updateVisibleColumnsInDom();
            }
          }.bind(this));

        },

        /**
         * Sets if the column must be always hidden
         * @param {boolean} isAlwaysHidden - is always hidden ?
         * @publicdoc
         */
        setAlwaysHidden: function(isAlwaysHidden) {
          this._isAlwaysHidden = isAlwaysHidden;
        },

        /**
         * Returns true if column must be always hidden
         * @returns {boolean} true if column is always hidden
         * @publicdoc
         */
        isAlwaysHidden: function() {
          return this._isAlwaysHidden;
        },

        /**
         * Sets if the column can be hidden by the user
         * @param {boolean} isUnhidable - is not hiddable ?
         */
        setUnhidable: function(isUnhidable) {
          this._isUnhidable = isUnhidable;
        },

        /**
         * Returns true if column is unhidable
         * @returns {boolean} true if column is unhidable
         */
        isUnhidable: function() {
          return this._isUnhidable;
        },

        /**
         * Returns true if column can be checked (show/hide)
         * @returns {boolean}
         */
        isCheckable: function() {
          return !this.isUnhidable() && !((this.getTableWidgetBase().isInputMode() || this.getTableWidgetBase().isInputArrayMode()) && this
            .isCurrent());
        },

        /**
         * Sets if the column can be moved by the user
         * @param {boolean} isMovable - is movable ?
         * @publicdoc
         */
        setMovable: function(isMovable) {
          this._isMovable = isMovable;
        },

        /**
         * Return true if the column can be moved
         * @returns {boolean} true if column is movable and not frozen 
         * @publicdoc
         */
        isMovable: function() {
          return this._isMovable;
        },

        /**
         * Sets if the column can be sized by the user
         * @param {boolean} isSizable - is sizable ?
         * @publicdoc
         */
        setSizable: function(isSizable) {
          if (this._isSizable !== isSizable) {
            this._isSizable = isSizable;
            this.getResizerElement().toggleClass("unresizable", !isSizable);
          }
        },

        /**
         * Returns true if column is sizable
         * @returns {boolean} true il column is sizable
         * @publicdoc
         */
        isSizable: function() {
          return this._isSizable;
        },

        /**
         * Returns true if column is a tree
         * @returns {boolean} true if is a tree
         * @publicdoc
         */
        isTreeView: function() {
          return this._isTreeView;
        },

        /**
         * Sets the sort decorator caret.
         * @param {string} sortType - "asc", "desc" or ""
         */
        setSortDecorator: function(sortType) {

          if (this._element === null) {
            return;
          }

          let sortClass = null;
          if (sortType === "asc") {
            sortClass = "sort-asc";
          } else if (sortType === "desc") {
            sortClass = "sort-desc";
          }

          this._element.removeClass("sort-asc");
          this._element.removeClass("sort-desc");

          if (sortClass !== null) {
            this._element.addClass(sortClass);
          }

          this._isSorted = (sortClass !== null);
        },

        /**
         * Set text alignment
         * @param {string} align - (left, center, right)
         * @param {boolean} [force] - force alignment even if not auto
         */
        setTextAlign: function(align, force = false) {

          let tableWidget = this.getTableWidgetBase();

          if (this._textAlign === align) {
            return;
          }

          // Header alignment: alignment is applied only if headerAlignment is auto
          if (force || tableWidget.getHeaderAlignment() === "auto") {
            if (align) {
              this.setStyle({
                "text-align": align
              });
            }
          }

          // Aggregate alignment
          if (this._aggregateLabelWidget) {
            this._aggregateLabelWidget.setTextAlign(align);

            let rightAlign = (align === "right");
            this._aggregateLabelWidget.setStyle(".gbc-label-text-container", {
              "float": rightAlign ? "right" : null
            }); // float right to overflow on left side
            this._aggregateLabelWidget.setStyle({
              "overflow": rightAlign ? "visible" : null
            }); // activate overflow on left side
          }

          this._textAlign = align;
        },

        /**
         * Set/add an aggregate footer
         * @param text - aggregate text & value, if null don't upgrade aggregate value, if "" do nothing
         */
        setAggregate: function(text) {
          if (text === null) {
            return;
          }
          let tableWidget = this.getTableWidgetBase();
          tableWidget.setHasFooter(true);

          if (!this._aggregateLabelWidget) {
            this._aggregateLabelWidget = cls.WidgetFactory.createWidget("Label", this.getBuildParameters());
            let options = {};
            options.footerAggregateItem = true;
            options.colWidget = this;
            tableWidget.getFooterAggregatesRowWidget().addChildWidget(this._aggregateLabelWidget, options);
          }

          //Ensure the correct date format
          if (this.getChildren().length > 0) {
            const item = this.getItem(0);
            const widget = item.getChildren().length > 0 ? item.getChildren()[0] : null;
            if (widget?.getFormat) { // use same date format as first widget of column
              text = cls.DateTimeHelper.toDbDateFormat(text, widget.getFormat());
            }
          }

          this._aggregateLabelWidget.setValue(text);

          this._aggregateLabelWidget.setHidden(this.isHidden());

          this.reorderAggregateLabel();
          if (this._textAlign) {
            this._aggregateLabelWidget.setTextAlign(this._textAlign);
          }
        },

        /**
         * Sets the width of column (define from user)
         * @param {?number} width - column width (pixels)
         * @param {boolean} ignoreRelayout - if false, asks the table to check and update its layout
         * @publicdoc
         */
        setUserWidth: function(width, ignoreRelayout = false) {
          if (this._userWidth === width) {
            return;
          }

          this._userWidth = width;

          // update table
          if (!ignoreRelayout) {
            let tableWidget = this.getTableWidgetBase();
            tableWidget.update(false, false, true);
          }
        },

        /**
         * Set width (from a user interaction)
         * @param {number} width - column width (pixels)
         * @param {boolean} ignoreRelayout - if false, asks the table to check and update its layout
         */
        setUserWidthFromInteraction: function(width, ignoreRelayout = false) {
          this.setUserWidth(width, ignoreRelayout);
          this.emit(gbc.constants.widgetEvents.tableResizeCol, width);
          if (!ignoreRelayout) {
            this.getTableWidgetBase().updateVisibleColumnsInDom();
          }
        },

        /**
         * Returns column width (define from user)
         * @returns {?number} column width (pixels)
         * @publicdoc
         */
        getUserWidth: function() {
          return this._userWidth;
        },

        /**
         * Reset width column
         * @publicdoc
         */
        resetWidth: function() {
          this.setUserWidth(null);
        },

        /**
         * Returns column width (user or if not define measured)
         * @returns {?number} column width (pixels)
         * @publicdoc
         */
        getWidth: function() {
          return this.getUserWidth() || this.getLayoutInformation().getMeasured().getWidth();
        },

        /**
         * Update aggregate css grid definition according to its column position
         */
        reorderAggregateLabel: function() {
          // remove spacer column from start
          if (!this._aggregateLabelWidget) {
            return;
          }

          //Hide the aggregate when the column is no longer visible
          this._aggregateLabelWidget.setHidden(this.isDetachedFromDom());
          if (this.isDetachedFromDom()) {
            return;
          }
          let start = this.getVisibleColumnIndex() + 2;
          if (this.isLeftFrozen()) {
            start = this.getVisibleColumnIndex() + 1;
          }
          this._aggregateLabelWidget.setStyle({
            "grid-column-start": start,
            "order": this.getOrder()
          });
        },

        /**
         * Sets index order of column
         * @param {number} index - order index
         * @param {boolean} noLayout - if true, no table update and relayouts will be fired
         */
        setOrder: function(index, noLayout = false) {
          // make the index starts with 1 instead of 0 which is for the spacer
          index = index + 1;
          if (this._order === index) {
            return;
          }

          // set order style on header column
          this.getElement().style.order = index;

          // set order style on aggregate
          if (this._aggregateLabelWidget) {
            this._aggregateLabelWidget.getElement().style.order = index;
          }

          // set order style on each column item
          for (const itemWidget of this.getChildren()) {
            itemWidget.setOrder(index);
          }

          this._order = index;

          // if noLayout is true, no table update will be executed meaning no measure of rows/cols will be done
          if (!noLayout) {
            // update table
            const tableWidget = this.getTableWidgetBase();
            tableWidget.update(true, false, true);
          }
        },

        /**
         * Returns index order of column
         * @returns {number} order index
         * @publicdoc
         */
        getOrder: function() {
          return this._order;
        },

        /**
         * Table Header are not affected by color
         * @override
         */
        setColor: function(color) {},

        /**
         * Defines if column is the current or not
         * @param {boolean} current - true if the column is the current one, false otherwise
         */
        setCurrent: function(current) {
          if (this._isCurrent === Boolean(current)) {
            return;
          }

          this._isCurrent = Boolean(current);
          this.getElement().toggleClass("currentColumn", this._isCurrent);

          for (const itemWidget of this.getChildren()) {
            itemWidget.setCurrentColumn(this._isCurrent);
          }
        },

        /**
         * Returns if column is the current one
         * @returns {boolean} is the current column ?
         * @publicdoc
         */
        isCurrent: function() {
          return this._isCurrent;
        },

        /**
         * Handle resizer double click event
         */
        onResizerDoubleClick: function() {
          this.autoSetWidth();
        },

        /**
         * Auto set width according to max length of column values
         * @param {boolean} ignoreRelayout - if false, asks the table to check and update its layout
         */
        autoSetWidth: function(ignoreRelayout = false) {
          if (this.isHidden()) {
            return;
          }

          let children = this.getChildren();
          let width = null;
          let widget = null;
          let tableColumnItemWidget = null;
          let i;

          // measure title width
          const colOutOfDom = this.isDetachedFromDom();
          // temporarily add column to DOM to be able to measure it
          if (colOutOfDom && !this.getTableWidgetBase().isFlipped()) {
            this.attachItemsToDom();
          }

          this.getElement().addClass("g_TableMeasuring");

          let maxWidth = this.getElement().getBoundingClientRect().width;

          this.getElement().removeClass("g_TableMeasuring");

          // measure widgets width
          if (children.length > 0) {
            let firstWidget = children[0].getChildren()[0];
            let measureDataElement = firstWidget.getLayoutEngine().getDataContentMeasureElement();
            let hasInputElement = firstWidget.getElement().getElementsByTagName("input").length > 0;
            // if widgets are inputs, use the first charMeasurer to measure to search the larger
            if (hasInputElement && measureDataElement) {

              firstWidget.getElement().addClass("g_measuring");
              firstWidget.getElement().addClass("g_TableMeasuring");
              let initialContent = measureDataElement.textContent;

              for (i = 0; i < children.length; ++i) {
                tableColumnItemWidget = children[i];
                widget = tableColumnItemWidget.getChildren()[0];

                if (widget.getFormattedValue) {
                  measureDataElement.textContent = widget.getFormattedValue(widget.getValue());
                } else {
                  measureDataElement.textContent = widget.getValue();
                }
                width = firstWidget.getElement().getBoundingClientRect().width;
                if (width > maxWidth) {
                  maxWidth = width;
                }
              }
              measureDataElement.textContent = initialContent;
              firstWidget.getElement().removeClass("g_TableMeasuring");
              firstWidget.getElement().removeClass("g_measuring");
            }
            // if widgets are not inputs, measure each widget and keep the larger size
            else {
              for (i = 0; i < children.length; ++i) {
                tableColumnItemWidget = children[i];
                tableColumnItemWidget.getElement().addClass("g_TableMeasuring");
                width = tableColumnItemWidget.getElement().getBoundingClientRect().width;
                tableColumnItemWidget.getElement().removeClass("g_TableMeasuring");

                if (width > maxWidth) {
                  maxWidth = width;
                }
              }
            }
          }
          this.setUserWidthFromInteraction(maxWidth, ignoreRelayout);

          // remove column from DOM if it was previously the case
          if (colOutOfDom && !this.getTableWidgetBase().isFlipped()) {
            this.detachItemsFromDom();
          }
        },

        /**
         * Enable Dnd of items
         * @param {boolean} enableDndItem
         */
        setDndItemEnabled: function(enableDndItem) {
          let items = this.getChildren();
          for (let item of items) {
            item.setDndEnabled(enableDndItem);
          }
        },

        // ============== START - Reordering Event/DnD FUNCTIONS ===================

        /**
         * Apply the correct CSS class depending on the other column index
         * If the other column index is smaller, then the column comes from the left
         * so we reorder to the right 
         * else it comes from the right, so we reorder to the lef
         * If the indexes are the same, remove classes
         * @param {number} otherColumnIndex The other column index
         */
        setReorderingSide: function(otherColumnIndex) {
          const orderedIndex = this.getOrderedColumnIndex();
          if (orderedIndex === otherColumnIndex) {
            this.cleanReorderingState();
          } else {
            this.getElement().addClass(otherColumnIndex < orderedIndex ? "drop-target-after" :
              "drop-target-before");
          }
        },

        /**
         * Remove the CSS classes displaying reordering state 
         */
        cleanReorderingState: function() {
          this.getElement()
            .removeClass("drop-target-before").removeClass("drop-target-after");
        },

        /**
         * Compute and return the min and max index on which it's possible to drop the column when dragged
         * @returns {DragLimit} The drag limit indexes.
         */
        getDragLimit() {
          const tableWidget = this.getTableWidgetBase();
          const orderedColumns = tableWidget.getOrderedColumns();
          /**
           * Right Frozen columns should be movable only between right frozen columns
           * Left Frozen columns should be movable only between left frozen columns
           * Not Frozen columns should be movable only between not frozen columns
           */
          const lastIndex = orderedColumns.length - 1;

          let minDragIndex = tableWidget.getLeftFrozenColumns();
          let maxDragIndex = lastIndex - tableWidget.getRightFrozenColumns();
          if (this.isLeftFrozen()) {
            minDragIndex = 0;
            maxDragIndex = tableWidget.getLeftFrozenColumns() - 1;
          } else if (this.isRightFrozen()) {
            minDragIndex = orderedColumns.length - tableWidget.getRightFrozenColumns();
            maxDragIndex = lastIndex;
          }

          return {
            min: minDragIndex,
            max: maxDragIndex
          };
        },

        // ============== END - Reordering Event/DnD FUNCTIONS ===================

        // ============== START - FROZEN COLUMNS FUNCTIONS ===================
        /**
         * Sets if the column is left frozen
         * @param {boolean} isLeftFrozen - is left frozen ?
         * @publicdoc
         */
        setLeftFrozen: function(isLeftFrozen) {
          this._isLeftFrozen = isLeftFrozen;
          this.toggleClass("leftFrozen", isLeftFrozen);
          this.toggleClass("lastLeftFrozen", this.isLastLeftFrozen());

          let tableWidget = this.getTableWidgetBase();

          // search the sum of all previous columns widths
          this._leftFrozenPosition = 0;
          const orderedColumns = tableWidget.getOrderedColumns();
          for (const colWidget of orderedColumns) {
            if (colWidget === this) {
              break;
            }
            if (!colWidget.isHidden()) {
              this._leftFrozenPosition += colWidget.getWidth();
            }
          }

          for (const itemWidget of this._children) {
            itemWidget.setLeftFrozen(isLeftFrozen);
          }

          if (isLeftFrozen) {
            this.setStyle({
              "left": this._leftFrozenPosition + "px"
            });
          }
          this.reorderAggregateLabel();
        },

        /**
         * Sets if the column is right frozen
         * @param {boolean} doFreezeRight - is right frozen ?
         * @publicdoc
         */
        setRightFrozen: function(doFreezeRight) {
          this._isRightFrozen = doFreezeRight;
          this.toggleClass("rightFrozen", doFreezeRight);
          this.toggleClass("firstRightFrozen", this.isFirstRightFrozen());

          let tableWidget = this.getTableWidgetBase();

          // search the sum of all previous columns widths
          this._rightFrozenPosition = tableWidget.haveRowBoundActions() ? 32 : 0;
          for (let i = tableWidget.getOrderedColumns().length - 1; i >= 0; i--) {
            const colWidget = tableWidget.getOrderedColumns()[i];
            if (colWidget === this) {
              break;
            }
            if (!colWidget.isHidden()) {
              this._rightFrozenPosition += colWidget.getWidth();
            }
          }

          for (const itemWidget of this._children) {
            itemWidget.setRightFrozen(doFreezeRight);
          }

          if (doFreezeRight) {
            this.setStyle({
              "right": this._rightFrozenPosition + "px"
            });
          }
          this.reorderAggregateLabel();
        },

        /**
         * Returns if the column is left frozen
         * @return {boolean} is left frozen ?
         * @publicdoc
         */
        isLeftFrozen: function() {
          return this._isLeftFrozen;
        },

        /**
         * Sets if the column is last left frozen
         * @param {boolean} isLastLeftFrozen - is last left frozen ?
         * @publicdoc
         */
        setLastLeftFrozen: function(isLastLeftFrozen) {
          this._isLastLeftFrozen = isLastLeftFrozen;
        },

        /**
         * Returns if the column is the last left frozen
         * @return {boolean} is last left frozen ?
         * @publicdoc
         */
        isLastLeftFrozen: function() {
          return this._isLastLeftFrozen;
        },

        /**
         * Returns the left frozen position (pixels)
         * @return {number} left frozen column position
         */
        getLeftFrozenPosition: function() {
          return this._leftFrozenPosition;
        },

        /**
         * Returns if the column is right frozen
         * @return {boolean} is right frozen ?
         * @publicdoc
         */
        isRightFrozen: function() {
          return this._isRightFrozen;
        },

        /**
         * Sets if the column is first right frozen
         * @param {boolean} isFirstRightFrozen - is first right frozen ?
         * @publicdoc
         */
        setFirstRightFrozen: function(isFirstRightFrozen) {
          this._isFirstRightFrozen = isFirstRightFrozen;
        },

        /**
         * Returns if the column is the first right frozen
         * @return {boolean} is first right frozen ?
         * @publicdoc
         */
        isFirstRightFrozen: function() {
          return this._isFirstRightFrozen;
        },

        /**
         * Returns the right frozen position (pixels)
         * @return {number} right frozen column position
         */
        getRightFrozenPosition: function() {
          return this._rightFrozenPosition;
        },

        /**
         * Indicates if table has frozen columns
         * @returns {boolean} returns true if table has frozen columns
         * @publicdoc
         */
        isFrozen: function() {
          return this.isRightFrozen() || this.isLeftFrozen();
        },

        // ============== END - FROZEN COLUMNS FUNCTIONS ===================

      };
    });
    cls.WidgetFactory.registerBuilder('RTableColumn', cls.RTableColumnWidget);
  });
