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

modulum('RTableItemWidget', ['WidgetGroupBase'],
  function(context, cls) {

    /**
     * Responsive Table item widget.
     * @class RTableItemWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.RTableItemWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.RTableItemWidget.prototype */ {
        __name: "RTableItemWidget",

        /** @type {Element|null} */
        _treeAnchor: null,
        /** @type {classes.ImageWidget} */
        _imageWidget: null,
        /** @type {Function} */
        _imageClickHandler: null,
        /** @type {boolean} */
        _dndEnabled: false,
        /** @type {boolean} */
        _isBlurred: false,
        /** @type {string|null} */
        _currentImagePath: null,
        /** @type {boolean} */
        _clientSelected: false,
        /** @type {boolean} */
        _isTreeItem: false,
        /** @type {classes.RTableColumnWidget} */
        _columnWidget: null,
        /**
         * is item detached from dom
         * @type {boolean}
         */
        _detachedFromDom: false,

        /**
         * @constructs
         * @param {*} opts - Options passed to the constructor
         */
        constructor: function(opts) {
          opts = (opts || {});
          this._isTreeItem = opts.isTreeItem;
          opts.inTable = true;
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          this._element.onDoubleTap("RTableItemWidget", this.manageMouseDblClick.bind(this, null));
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
        isLayoutMeasureable: function(deep) {
          // first table item of each row is measurable
          return true;
        },

        /**
         * Init item
         */
        init: function() {
          this.setLeftFrozen(this._columnWidget.isLeftFrozen());
          this.setRightFrozen(this._columnWidget.isRightFrozen());
          const columnOrder = this._columnWidget.getOrder();
          this.setOrder(columnOrder !== null ? columnOrder : this._columnWidget
            .getOrderedColumnIndex()); // use ordered column index on first display when no order has been computed
          this.setCurrentColumn(this._columnWidget.isCurrent());
          this.setDndEnabled(this.getTableWidgetBase().isDndItemEnabled());
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._treeAnchor = null;

          if (this._imageClickHandler) {
            this._imageClickHandler();
            this._imageClickHandler = null;
          }
          if (this._imageWidget) {
            this._imageWidget.destroy();
            this._imageWidget = null;
          }
          this._columnWidget = null;

          this._element.offDoubleTap("RTableItemWidget");

          $super.destroy.call(this);
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
          }
        },

        /**
         * Request focus for this row (keep current column)
         * @param {*} domEvent - dom event object
         */
        requestFocus: function(domEvent) {
          let tableWidget = this.getTableWidgetBase();
          if (tableWidget) {
            tableWidget.requestFocusFromWidget(this.getWidget(), domEvent);
          }
        },

        /**
         * Returns item widget
         * @returns {classes.WidgetBase}
         */
        getWidget: function() {
          return this._children[0];
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (domEvent.target === this.getElement()) { // click on item, but not on sub element
            this.getTableWidgetBase().requestFocusFromWidget(this.getWidget(), domEvent);
          } else if (domEvent.target === this._treeAnchor) { // click on tree anchor
            let index = this.getRowIndex();
            let tableWidget = this.getTableWidgetBase();
            tableWidget.emit(context.constants.widgetEvents.toggleClick, index);
            return false;
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          if (domEvent && domEvent.target === this._treeAnchor) {
            // if double-click on tree anchor, do nothing
            return false;
          }
          const rowWidget = /** @type classes.RTableRowWidget */ this.getParentWidget();
          // Call double-click on the row, with the right column index
          const processed = rowWidget.onDoubleClick(domEvent, this.getColumnWidget().getColumnIndex());

          return !processed;
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          if (this._children.length !== 0) {
            throw new Error("A item only contain a single child");
          }

          this._layoutInformation = widget.getLayoutInformation();
          $super.addChildWidget.call(this, widget, options);

          if (this._isTreeItem) {
            this._treeAnchor = document.createElement("span");
            this._treeAnchor.addClass("gbc_TreeAnchor");
            this._element.prependChild(this._treeAnchor);
            this.setLeaf(true);
          }
        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          if (this._backgroundColor !== color) {
            this._backgroundColor = color;
            this.setStyle({
              "background-color": color && !this._ignoreBackgroundColor ? color : null
            });
          }
        },

        /**
         * Enable drag and drop
         * @param {boolean} b - true to enable
         */
        setDndEnabled: function(b) {
          if (this._dndEnabled !== b) {
            this._dndEnabled = b;
            if (b) {
              this._element.setAttribute("draggable", "true");
            } else {
              this._element.removeAttribute("draggable");
            }
          }
        },

        /**
         * Check if item is tree item
         * @returns {boolean} true if the element is a tree item, false otherwise
         * @publicdoc
         */
        isTreeItem: function() {
          return this._isTreeItem;
        },

        /**
         * Sets if item is a leaf of tree
         * @param {boolean} leaf - true if the item is a leaf item, false otherwise
         */
        setLeaf: function(leaf) {
          if (this.isTreeItem()) {
            this.setAriaExpanded(null);
            if (leaf) {
              this._treeAnchor.removeClass("treeExpanded");
              this._treeAnchor.removeClass("treeCollapsed");
            }
            this._treeAnchor.toggleClass("treeLeaf", leaf);

          }
        },

        /**
         * Checks if item is tree leaf item
         * @returns {boolean} leaf true if the item is a leaf item, false otherwise
         * @publicdoc
         */
        isLeaf: function() {
          return this.isTreeItem() && this._treeAnchor.hasClass("treeLeaf");
        },

        /**
         * Expands or collapse tree item
         * @param {boolean} expanded - true if the item should be expanded, false otherwise
         * @publicdoc
         */
        setExpanded: function(expanded) {
          if (this.isTreeItem() && !this.isLeaf()) {
            this.setAriaExpanded(expanded);
            this._treeAnchor.toggleClass("treeExpanded", "treeCollapsed", expanded);

            if (gbc.qaMode) {
              // add qa expanded info
              let qaElement = this.getContainerElement().querySelector("[data-gqa-name]");
              if (qaElement) {
                qaElement.setAttribute('data-gqa-expanded', expanded.toString());
              }
            }
          }
        },

        /**
         * Sets aria attribute expanded
         * @param {boolean} expanded - true if the item should be expanded, false otherwise
         */
        setAriaExpanded: function(expanded) {
          this.setAriaAttribute("expanded", expanded);
          if (this.getWidget()) {
            this.getWidget().setAriaAttribute("expanded", expanded);
          }
        },

        /**
         * @inheritDoc
         */
        isReversed: function() {
          return this.getParentWidget().isReversed();
        },

        /**
         * Sets tree item depth
         * @param {number} depth - item depth
         */
        setDepth: function(depth) {
          let depthObj = {};
          depthObj["padding-" + this.getStart()] = depth + 'em';
          this.setStyle(depthObj);
        },

        /**
         * Sets if the item is left frozen
         * @param {boolean} b - is left frozen ?
         * @publicdoc
         */
        setLeftFrozen: function(b) {
          this.toggleClass("leftFrozen", b);
          this.toggleClass("lastLeftFrozen", this.getColumnWidget().isLastLeftFrozen());
          if (b) {
            this.setStyle({
              "left": this.getColumnWidget().getLeftFrozenPosition() + "px"
            });
          }
        },

        /**
         * Sets if the item is right frozen
         * @param {boolean} b - is right frozen ?
         * @publicdoc
         */
        setRightFrozen: function(b) {
          this.toggleClass("rightFrozen", b);
          this.toggleClass("firstRightFrozen", this.getColumnWidget().isFirstRightFrozen());
          if (b) {
            this.setStyle({
              "right": this.getColumnWidget().getRightFrozenPosition() + "px"
            });
          }
        },

        /**
         * Sets if the item is in the current column
         * @param {boolean} b - is in current column ?
         * @publicdoc
         */
        setCurrentColumn: function(b) {
          this.toggleClass("currentColumn", b);
        },

        /**
         * Blur data on item widget
         * @param enable
         */
        blur: function(enable) {
          if (enable === this._isBlurred) {
            return;
          }
          this._isBlurred = enable;
          this.toggleClass("blurred", this._isBlurred);
        },

        /**
         * Sets index order  (row + col)
         * @param {number} colIndex - order column index
         */
        setOrder: function(colIndex) {
          let rowWidget = this.getParentWidget();
          // take row index, start index with 1 (instead of 0) and generate a 4 digits number
          const rowIndex = (rowWidget.getRowIndex() + 1) * rowWidget.getOrderMultiplier();
          // add column index to row index
          let order = rowIndex + colIndex;
          // then multiply it by ten allowing to have children ordering
          order = order * 10;
          this._order = order;
          this.setStyle({
            "--order": order
          });
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
         * Sets image item
         * @param {string} path - image path
         * @publicdoc
         */
        setImage: function(path) {
          if (this._currentImagePath === path) {
            return;
          }

          if (path && path !== "") {
            if (!this._imageWidget) {
              let opts = this.getBuildParameters();
              opts.inTable = true;
              this._imageWidget = cls.WidgetFactory.createWidget("ImageWidget", opts);
              this._imageWidget.getElement().addClass("gbc_RTableItemImage");
              this._imageWidget.setParentWidget(this);
              this._imageClickHandler = this._imageWidget.when(context.constants.widgetEvents.click, function(event) {
                this.getTableWidgetBase().requestFocusFromWidget(this.getWidget(), event);
              }.bind(this));
              this._element.prependChild(this._imageWidget.getElement());
            }
            this._imageWidget.setSrc(path, true);
            this._imageWidget.setHidden(false);
          } else if (this._imageWidget) {
            this._imageWidget.setSrc(path, true);
            this._imageWidget.setHidden(true);
          }
          this._currentImagePath = path;
        },

        /**
         * Checks if item is client selected
         * @returns {boolean} true if the row item is client selected, false otherwise
         */
        isClientSelected: function() {
          return this._clientSelected;
        },

        /**
         * Sets if item is client selected
         * @param {boolean} selected - true if the item is client selected, false otherwise
         */
        setClientSelected: function(selected) {
          this._clientSelected = selected;
        },

        /**
         * Returns column widget which contains this item
         * @returns {classes.RTableColumnWidget} column widget
         */
        getColumnWidget: function() {
          return this._columnWidget;
        },

        /**
         * Sets the column widget wich contains this itme
         * @param {classes.RTableColumnWidget} colWidget - column widget
         */
        setColumnWidget: function(colWidget) {
          this._columnWidget = colWidget;
        },

        /**
         * Returns row index of the item
         * @returns {number} row index of the item
         * @publicdoc
         */
        getRowIndex: function() {
          let parent = this.getParentWidget();
          if (parent) {
            return parent.getRowIndex();
          }
          return -1;
        },

        /**
         * Handle dragStart event
         * @param {Object} evt - dragstart event
         */
        onDragStart: function(evt) {
          if (window.browserInfo.isFirefox) { // Firefox 1.0+
            try {
              evt.dataTransfer.setData('text/plain', ''); // for Firefox compatibility
            } catch (ex) {
              console.error("evt.dataTransfer.setData('text/plain', ''); not supported");
            }
          }

          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDragStart, this.getRowIndex(), evt);
        },

        /**
         * Handle dragEnd event
         */
        onDragEnd: function(evt) {
          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDragEnd, evt);
        },

        /**
         * Handle dragOver event
         * @param {Object} evt - dragover event
         */
        onDragOver: function(evt) {
          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDragOver, this.getRowIndex(), evt);
        },

        /**
         * Handle dragEnter event
         * @param {Object} evt - dragenter event
         */
        onDragEnter: function(evt) {
          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDragEnter, this.getRowIndex(), evt);
        },

        /**
         * Handle dragLeave event
         * @param {Object} evt - dragleave event
         */
        onDragLeave: function(evt) {
          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDragLeave, this.getRowIndex(), evt);
        },

        /**
         * Handle drop event
         * @param {DragEvent} evt - drop event
         */
        onDrop: function(evt) {
          this.getColumnWidget().emit(gbc.constants.widgetEvents.tableDrop, this.getRowIndex(), evt);
        }
      };
    });
    cls.WidgetFactory.registerBuilder('RTableItem', cls.RTableItemWidget);
  });
