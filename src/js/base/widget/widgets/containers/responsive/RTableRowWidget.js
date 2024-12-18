/// FOURJS_START_COPYRIGHT(D,2019)
/// Property of Four Js*
/// (c) Copyright Four Js 2019, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RTableRowWidget', ['WidgetGroupBase'],
  function(context, cls) {

    /**
     * Responsive Table row widget.
     * @class RTableRowWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.RTableRowWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.RTableRowWidget.prototype */ {
        __name: "RTableRowWidget",

        /** @type {boolean} */
        _isCurrent: false,

        /** @type {boolean} */
        _isSelected: false,

        /** @type {boolean} */
        _isHeader: false,

        /** @type {boolean} */
        _isFooter: false,

        /** @type {number} */
        _orderMultiplier: 10000,

        /** @type {classes.RowBoundDecoratorWidget} */
        _rowBoundDecoratorWidget: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          // no layout
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this.getRowBoundDecorator()) {
            this.getRowBoundDecorator().destroy();
            this._rowBoundDecoratorWidget = null;
          }

          this.destroyChildren();
          $super.destroy.call(this);
        },

        /**
         * @todo : Review the attach flow to be called automatically
         * @inheritdoc
         */
        onAttachedToParentTable: function() {
          const order = (this.getRowIndex() + 1) * this.getOrderMultiplier() * 10;
          this.setStyle(".left_spacer", {
            "order": order
          });

          this.addRowBoundDecorator();
        },

        /**
         * Request focus for this row
         * @param {*} domEvent - dom event object
         */
        requestFocus: function(domEvent) {
          this._children[0].requestFocus(domEvent);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          let tableWidget = this.getTableWidgetBase();

          if (!this._isHeader && !this._isFooter && tableWidget && !tableWidget.isRowActionTriggerByDoubleClick()) {
            tableWidget.emit(context.constants.widgetEvents.rowAction);
            return false;
          }

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          this.onDoubleClick(domEvent);
          return false;
        },

        /**
         * Handle double click on row event
         * @param {Object} event - dblclick dom event
         * @param {?number} colIndex - column index
         * @returns {boolean} true if event has been processed
         */
        onDoubleClick: function(event, colIndex = null) {
          const tableWidget = this.getTableWidgetBase();
          if (!this._isHeader && !this._isFooter && tableWidget && tableWidget.isRowActionTriggerByDoubleClick()) {
            tableWidget.emit(context.constants.widgetEvents.rowAction, colIndex);
            return true;
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {

          let item = null;
          if (options.headerItem) {
            item = widget;
          } else if (options.footerAggregateItem) {
            item = widget;
          } else {
            let opts = this.getBuildParameters();
            let colWidget = options.colWidget;
            opts.isTreeItem = colWidget.isTreeView();

            // data row
            item = cls.WidgetFactory.createWidget("RTableItem", opts);
            item.addChildWidget(widget);
            item.getElement().setAttribute("data-header", colWidget.getText());

            // position for DOM insertion is colIndex
            item.setColumnWidget(colWidget);
            colWidget.getChildren().push(item);

            // if add a widget in the first row need to measure widget to compute column width
            if (options.rowIndex === 0) {
              this.getParentWidget().resetMeasure();
            }
            if (options.noDOMInsert === true) {
              item.setDetachedFromDom(true);
            }
          }

          $super.addChildWidget.call(this, item, options);

          // initialize item after it has been added
          if (item.init) {
            item.init();
          }

          if (this.getRowBoundDecorator()) {
            this.getRowBoundDecorator().setOrder(this._getRowBoundDecoratorOrder());
          }

        },

        /**
         * Returns item widgets
         * @returns {classes.RTableItemWidget[]} array of item widgets
         * @publicdoc
         */
        getItems: function() {
          return this.getChildren();
        },

        /**
         * Returns row index in the table
         * @returns {number} row index in the table
         * @publicdoc
         */
        getRowIndex: function() {
          let tableWidget = this.getTableWidgetBase();
          if (tableWidget) {
            return tableWidget.getRows().indexOf(this);
          }
          return -1;
        },

        /**
         * Sets if the row is the current one
         * @param {boolean} current - true if row is the current one, false otherwise
         * @publicdoc
         */
        setCurrent: function(current) {
          if (this._isCurrent !== current) {
            this._isCurrent = current;
            if (current) {
              this._element.addClass("currentRow");
            } else {
              this._element.removeClass("currentRow");
            }
          }
        },

        /**
         * Returns if row is the current one
         * @returns {boolean} is the current row ?
         * @publicdoc
         */
        isCurrent: function() {
          return this._isCurrent;
        },

        /**
         * Sets if the row is the header row
         * @param {boolean} header - true if row is the header, false otherwise
         * @publicdoc
         */
        setHeader: function(header) {
          this._isHeader = header;
        },

        /**
         * Sets if the row is the footer row
         * @param {boolean} footer - true if row is the footer, false otherwise
         * @publicdoc
         */
        setFooter: function(footer) {
          this._isFooter = footer;
        },

        /**
         * Sets if row is selected
         * @param {boolean} selected - true if the row should be selected, false otherwise
         */
        setSelected: function(selected) {
          if (this._isSelected !== selected) {
            this._isSelected = selected;
            this._element.toggleClass("selectedRow", Boolean(selected));
          }
        },

        /**
         * Checks if row is selected
         * @returns {boolean} true if the row is selected, false otherwise
         */
        isSelected: function() {
          return this._isSelected;
        },

        /**
         * Return rowBound decorator widget
         * @return {classes.RowBoundDecoratorWidget} - rowBound decorator widget
         */
        getRowBoundDecorator: function() {
          return this._rowBoundDecoratorWidget;
        },

        /**
         * @returns {number} The rowBoundDecorator column index
         */
        _getRowBoundDecoratorOrder: function() {
          return parseInt(this.getParentWidget().getColumns().length + 1, 10);
        },

        /**
         * Creates and adds rowBound decorator element to DOM
         */
        addRowBoundDecorator: function() {
          if (this.getRowBoundDecorator() !== null) {
            return;
          }
          // Create the rowbound decoractor
          this._rowBoundDecoratorWidget = cls.WidgetFactory.createWidget("RowBoundDecorator", this.getBuildParameters());
          this.getRowBoundDecorator().setParentWidget(this);
          this.getRowBoundDecorator().setContextMenuWidget(this.getTableWidgetBase().getRowBoundMenu());

          this.getRowBoundDecorator().update();
          // hack to have the same css rule
          this.getRowBoundDecorator().addClass("gbc_RTableItemWidget");
          this.getRowBoundDecorator().addClass("gbc_WidgetBase_in_array");

          this._element.appendChild(this.getRowBoundDecorator().getElement());

          // rowbound is the very last column
          // rowbound div order = max visible columns + 10 to be sure it is the last one
          this.getRowBoundDecorator().setOrder(this._getRowBoundDecoratorOrder());

          if (this._isHeader || this._isFooter) {
            this.getRowBoundDecorator().setEnabled(false);
          }
        },

        /**
         * Create, update, destroy the rowbound depending on the situation
         */
        updateRowBound: function() {
          this.getRowBoundDecorator()?.update();
        },

        /**
         * Returns order multiplier used to handle all items
         * @returns {*}
         */
        getOrderMultiplier: function() {
          return this._orderMultiplier;
        },

        /**
         * @inheritDoc
         */
        setHidden: function(hidden) {
          if (this._hidden !== Boolean(hidden)) {
            this._hidden = Boolean(hidden);
            if (this._element) {
              if (this._hidden) {
                this.addClass("hidden");
              } else {
                this.removeClass("hidden");
              }
            }

            // hide/show all items of row
            for (const item of this.getItems()) {
              item.setHidden(hidden);
            }
          }
        },
      };
    });
    cls.WidgetFactory.registerBuilder('RTableRow', cls.RTableRowWidget);
  });
