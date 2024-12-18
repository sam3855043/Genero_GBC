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

modulum('RTableWidget', ['TableWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Responsive table widget.
     * @class RTableWidget
     * @memberOf classes
     * @extends classes.TableWidgetBase
     * @publicdoc
     */
    cls.RTableWidget = context.oo.Class(cls.TableWidgetBase, function($super) {
      return /** @lends classes.RTableWidget.prototype */ {

        $static: /** @lends classes.RTableWidget */ {
          /**
           * Table widget which has a client items selection
           * @type {classes.RTableWidget}
           */
          _tableWithItemsSelection: null,

          /**
           * Store Table widget which has a client items selection
           * @param {classes.RTableWidget} table
           */
          setTableWithItemsSelection: function(table) {
            this._tableWithItemsSelection = table;
          },
          /**
           * Get Table widget which has a client items selection
           * @returns {classes.RTableWidget}
           */
          getTableWithItemsSelection: function() {
            return this._tableWithItemsSelection;
          },
        },

        __name: "RTableWidget",

        /** @type {classes.ContextMenuWidget} */
        _contextMenu: null,

        /** @type {classes.RTableRowWidget} */
        _headerRowWidget: null,
        /** @type {classes.RTableRowWidget} */
        _footerAggregatesRowWidget: null,

        /** @type {boolean} */
        _multiRowSelectionEnabled: false,

        // Pagination nav WIP
        /** @type {classes.PaginationWidget} */
        //_paginationWidget: null,

        /** @type {classes.RTableColumnWidget[]} */
        _columns: null,
        /** @type {classes.RTableColumnWidget[]} */
        _orderedColumns: null,

        /** @type {boolean} */
        _hasFooter: false,

        /** @type {boolean} */
        _firstLayout: true,

        /** @type {number} */
        _currentColumn: 0,

        /** DOM Elements */
        _headerGroupElement: null,
        _footerGroupElement: null,
        /** @type {Element} */
        _scrollerXElement: null,
        /** @type {Element} */
        _scrollerYElement: null,
        _aggregateGlobalTextElement: null,

        /** Item client selection */
        _defaultItemSelection: false,
        _firstItemSelected: null,
        _itemSelectionInProgress: false,
        _itemSelectionHasChanged: false,
        _itemSelectionElement: null,

        /** @type {?number} */
        lastSentOffset: null,

        /** @type {number} */
        _previousScrollLeftValue: -1,
        /** @type {number} */
        _previousScrollTopValue: 0,
        /** @type {number|null} */
        _previousTouchYValue: null,
        /** @type {number} */
        _totalLeftFrozenColumnWidth: 0,
        /** @type {number} */
        _totalVisibleLeftFrozenColumns: 0,
        /** @type {boolean} */
        _frozenTable: false,
        /** @type {number} */
        _leftFrozenColumns: 0,
        /** @type {number} */
        _rightFrozenColumns: 0,

        /** @type {String} */
        _evenRowBackgroundColor: "",
        /** @type {String} */
        _oddRowBackgroundColor: "",

        /** @type {String} */
        _viewType: "", // Type of table view

        // All views: variables/settings
        /** @type {boolean|null} */
        _alternateRows: null,
        /** @type {boolean|null} */
        _rowHover: null,

        // 4st styles
        /** @type {boolean|null} */
        _showGridX: null,
        /** @type {boolean|null} */
        _showGridY: null,
        /** @type {boolean|null} */
        _headerHidden: null,
        /** @type {String} */
        _headerAlignment: null,

        /** Mouse down target html element */
        _mouseDownTarget: null,

        /** @type {classes.RTableItemWidget} */
        _currentItem: null,

        /** @type {Boolean} **/
        _hasUnhidableColumns: false,

        /** @type {Boolean} **/
        _isScrolling: false,

        /** @type {?number} **/
        _vmCurrentRow: null,

        // Store mouse move prev positions
        _itemSelectionMouseMovePrevX: 0,
        _itemSelectionMouseMovePrevY: 0,

        /** @type {boolean} */
        _cancelMenuButtonForThisTouchPhase: false,

        /**
         * @type {classes.TableMenuButtonWidgetComponent}
         */
        _menuButtonComponent: null,

        /**
         * @type {classes.ColumnManipulationWidgetComponent}
         */
        _columnContainerComponent: null,

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._headerRowWidget) {
            this._headerRowWidget.destroy();
            this._headerRowWidget = null;
          }

          if (this._footerAggregatesRowWidget) {
            this._footerAggregatesRowWidget.destroy();
            this._footerAggregatesRowWidget = null;
          }

          if (this._contextMenu) {
            this._contextMenu.destroyChildren();
            this._contextMenu.destroy();
            this._contextMenu = null;
          }

          if (this._cachedDataModel) {
            this._cachedDataModel.destroy();
            this._cachedDataModel = null;
          }

          if (this._menuButtonComponent) {
            this._menuButtonComponent.destroy();
            this._menuButtonComponent = null;
          }

          if (this._columnContainerComponent) {
            this._columnContainerComponent.destroy();
            this._columnContainerComponent = null;
          }

          // Pagination nav WIP
          //if (this._paginationWidget) {
          //  this._paginationWidget.destroy();
          //  this._paginationWidget = null;
          //}

          this.setDndItemEnabled(false);

          this.getScrollableArea().off('scroll.RTableWidget');

          // Mouse drag
          this.getHeaderGroupElement().off("dragstart.RTableWidget");
          this.getHeaderGroupElement().off("dragend.RTableWidget");
          this.getHeaderGroupElement().off("drag.RTableWidget");
          this.getHeaderGroupElement().off("dragover.RTableWidget");
          this.getHeaderGroupElement().off("drop.RTableWidget");
          this.getHeaderGroupElement().off("dragleave.RTableWidget");

          // Touch drag
          this.getHeaderGroupElement().off("touchstart.RTableWidget");
          this.getHeaderGroupElement().off("touchend.RTableWidget");
          this.getHeaderGroupElement().off("touchmove.RTableWidget");

          // client select items events
          this.getElement().off("mousemove.RTableWidget");
          this.getElement().off("mouseleave.RTableWidget");

          this.getElement().off("wheel.RTableWidget");
          this.getElement().off("touchstart.RTableWidget");
          this.getElement().off("touchmove.RTableWidget");

          this._headerGroupElement = null;
          this._footerGroupElement = null;
          this._aggregateGlobalTextElement = null;
          this._scrollerXElement = null;
          this._scrollerYElement = null;

          this._columns = [];
          this._orderedColumns = null;

          this.destroyChildren();
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          this._resetItemsSelection();

          // Pagination nav WIP
          //this._paginationWidget = cls.WidgetFactory.createWidget("Pagination", this.getBuildParameters());
          //this._paginationWidget.setParentWidget(this);
          //this._element.appendChild(this._paginationWidget.getElement());

          this._cachedDataModel = new cls.TableCachedDataModel(this);
          this._columns = [];
          this.setViewType("classic");
          this.setAlternateRows(true);
          this.setRowHover(!window.isMobile());

          if (this.isTreeView()) {
            this.getElement().addClass("gbc_TreeView");
          }

          // set scrollbar size for css rules
          this._element.style.setProperty('--scrollBarHorizontalHeight', window.scrollBarSize + "px");
          this._element.style.setProperty('--scrollBarVerticalWidth', window.scrollBarSize + "px");

          this.getElement().on("wheel.RTableWidget", this._onWheel.bind(this));
          this.getElement().on("touchstart.RTableWidget", this._onTouchStart.bind(this));
          this.getElement().on("touchmove.RTableWidget", this._onTouchMove.throttle(10).bind(this));
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);

          this._columnContainerComponent = new cls.ColumnManipulationWidgetComponent(this);
          this._menuButtonComponent = new cls.TableMenuButtonWidgetComponent(this, true);

          this.getScrollableArea().on('scroll.RTableWidget', this._onScroll.bind(this));

          this._headerRowWidget = cls.WidgetFactory.createWidget("RTableRow", this.getBuildParameters());
          this.getHeaderRowWidget().setHeader(true);
          this.getHeaderGroupElement().appendChild(this._headerRowWidget.getElement());
          this.getHeaderRowWidget().setParentWidget(this);
          this.getHeaderRowWidget().onAttachedToParentTable();

          this.getHeaderGroupElement()
            .on("dragstart.RTableWidget", this._onHeaderDragStart.bind(this))
            .on("dragend.RTableWidget", this._onHeaderDragEnd.bind(this))
            .on("drag.RTableWidget", this._onHeaderDrag.throttle(5).bind(this))
            .on("dragover.RTableWidget", this._onHeaderDragOver.bind(this))
            .on("drop.RTableWidget", this._onHeaderDrop.bind(this))
            .on("dragleave.RTableWidget", this._onHeaderDragLeave.bind(this))
            .on("touchstart.RTableWidget", this._onHeaderTouchStart.bind(this))
            .on("touchend.RTableWidget", this._onHeaderTouchEnd.bind(this))
            .on("touchmove.RTableWidget", this._onHeaderTouchMove.throttle(5).bind(this));

          // client select items events
          this.getElement()
            .on("mouseleave.RTableWidget", this._onItemMouseLeave.bind(this));

          this._footerAggregatesRowWidget = cls.WidgetFactory.createWidget("RTableRow", this.getBuildParameters());
          this._footerAggregatesRowWidget.setFooter(true);
          this.getFooterGroupElement().appendChild(this._footerAggregatesRowWidget.getElement());
          this._footerAggregatesRowWidget.setParentWidget(this);
        },

        /**
         * @inheritDoc
         */
        _whenParentActivated: function(opt) {
          $super._whenParentActivated.call(this, opt);

          let widgetActivated = opt.data.length > 0 && opt.data[0];
          if (this.isChildOf(widgetActivated)) {

            let contextScrollTop = this._previousScrollTopValue;
            let contextScrollLeft = this._previousScrollLeftValue;
            this.getScrollableArea().scrollTop = contextScrollTop;
            this.getScrollableArea().scrollLeft = contextScrollLeft;

            // synchronize header & data horizontal scroll
            this.getHeaderGroupElement().scrollLeft = contextScrollLeft;
            this.getFooterGroupElement().scrollLeft = contextScrollLeft;

            if (this.getLayoutEngine().isLayoutDone() === false) {
              this.getLayoutEngine().forceMeasurement();
              this.getLayoutEngine().invalidateMeasure();
            }
          }
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._layoutInformation) {
            this._layoutInformation = new cls.TableLayoutInformation(this);

            this._layoutInformation.getStretched().setDefaultX(true);
            this._layoutInformation.getStretched().setDefaultY(true);
          }
          this._layoutEngine = new cls.RTableLayoutEngine(this);
          this._layoutEngine.onLayoutApplied(this._layoutApplied.bind(this));

          let minPageSize = parseInt(context.ThemeService.getValue("gbc-TableWidget-min-page-size"), 10);
          this._layoutEngine.setMinPageSize(isNaN(minPageSize) ? 1 : minPageSize);
          let minWidth = parseInt(context.ThemeService.getValue("gbc-TableWidget-min-width"), 10);
          this._layoutEngine.setMinWidth(isNaN(minWidth) ? 60 : minWidth);

          this.setRowHeight(this.getRowHeight());
        },

        /**
         * @inheritDoc
         */
        resetLayout: function() {
          $super.resetLayout.call(this);
          this._firstLayout = true;
          //Refresh alternate rows color in case of theme change
          this.setAlternateRows(this._alternateRows, true, true);
          this._layoutEngine.resetLayout();
        },

        /**
         * Call when layout is finished
         */
        _layoutApplied: function() {
          if (this.isElementInDOM()) {
            const forceColsMeasure = this._firstLayout;
            if (this._firstLayout && this._layoutEngine.isLayoutDone()) {
              // first time layout is applied
              this._firstLayout = false;
              this.updateFrozenColumns();
              this.updateAllAggregate();
              this.updateVerticalScroll(true);
              // once measured (needed for columns layout), hide first row if size = 0
              const firstRow = this.getRows()[0];
              if (firstRow) {
                firstRow.setHidden(this.getVisibleRowCount() === 0);
              }
            }
            // add/remove non-visible columns from DOM
            // force columns grid css measure event if no columns are remove/add from DOM on first  layout
            this.updateVisibleColumnsInDom(this.getScrollableArea().scrollLeft, forceColsMeasure);
          }
        },

        /**
         * True if the element is visible
         * @param {DOMElement} element
         * @returns {boolean}
         */
        isElementVisible: function(element) {
          const rect = element.getBoundingClientRect(),
            vWidth = window.innerWidth || document.documentElement.clientWidth,
            vHeight = window.innerHeight || document.documentElement.clientHeight;

          // Return false if it's not in the viewport
          if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) {
            return false;
          }

          // true if any of its four corners are visible
          return element.contains(document.elementFromPoint(Math.ceil(rect.left), Math.ceil(rect.top))) ||
            element.contains(document.elementFromPoint(Math.floor(rect.right), Math.ceil(rect.top))) ||
            element.contains(document.elementFromPoint(Math.floor(rect.right), Math.floor(rect.bottom))) ||
            element.contains(document.elementFromPoint(Math.ceil(rect.left), Math.floor(rect.bottom)));
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {

          if (this.isElementInDOM()) {
            this.domFocus(fromMouse || this.isElementVisible(this.getElement()));
          } else {
            let uiWidget = this.getUserInterfaceWidget();
            if (uiWidget) {
              uiWidget.getElement().domFocus();
            }
          }

          $super.setFocus.call(this, fromMouse);

          // if focus comes from VM not mouse update the rowBound actions
          if (!fromMouse) {
            for (const row of this.getRows()) {
              row.updateRowBound();
            }
          }
        },

        /**
         * @inheritDoc
         */
        loseVMFocus: function(vmNewFocusedWidget = null) {
          $super.loseVMFocus.call(this, vmNewFocusedWidget);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this._contextMenu?.isVisible()) {
            return this._contextMenu.managePriorityKeyDown(keyString, domKeyEvent, repeat);
          }

          // manage CTRL+C case
          if (keyString === "ctrl+c" || keyString === "meta+c") {
            if (this.hasItemsSelected()) { // copy selection
              this._copySelectionInClipboard();
              keyProcessed = true;
            }
          }

          if (this.isMultiRowSelectionEnabled()) {
            let key = cls.KeyboardApplicationService.keymap[domKeyEvent.which];
            if (key === "space") {
              this.emit(context.constants.widgetEvents.keySpace, domKeyEvent);
              keyProcessed = true;
            } else if (keyString === "ctrl+a" || keyString === "meta+a") {
              this.emit(context.constants.widgetEvents.selectAll);
              keyProcessed = true;
            } else {
              keyProcessed = this._manageNavigationKeys(domKeyEvent);
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Manage navigation keys
         * @param {Object} domKeyEvent - key event from DOM
         * @returns {boolean} returns if the domKeyEvent has been processed by the widget
         * @private
         */
        _manageNavigationKeys: function(domKeyEvent) {
          const key = cls.KeyboardApplicationService.keymap[domKeyEvent.which];
          let keyProcessed = true;
          switch (key) {
            case "down":
              this.emit(context.constants.widgetEvents.keyArrowDown, domKeyEvent);
              break;
            case "up":
              this.emit(context.constants.widgetEvents.keyArrowUp, domKeyEvent);
              break;
            case "pagedown":
              this.emit(context.constants.widgetEvents.keyPageDown, domKeyEvent);
              break;
            case "pageup":
              this.emit(context.constants.widgetEvents.keyPageUp, domKeyEvent);
              break;
            case "home":
              this.emit(context.constants.widgetEvents.keyHome, domKeyEvent);
              break;
            case "end":
              this.emit(context.constants.widgetEvents.keyEnd, domKeyEvent);
              break;
            default:
              keyProcessed = false;
          }

          return keyProcessed;
        },

        /**
         * @inheritDoc
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          const key = cls.KeyboardApplicationService.keymap[domKeyEvent.which];

          if (!this.isMultiRowSelectionEnabled() && domKeyEvent) {
            keyProcessed = this._manageNavigationKeys(domKeyEvent);
          }

          // manage CTRL+C case
          // @note is this code really necessary ? there is a VM action "editcopy" which already do the job
          if (keyString === "ctrl+c" || keyString === "meta+c") {
            if (this.isDisplayMode() && !this.isMultiRowSelectionEnabled() && this.isCurrentRowVisible()) { // copy current row
              if (this.hasFocusOnField()) {
                this._copyCurrentCellInClipboard();
                keyProcessed = true;
              } else {
                this._copyCurrentRowInClipboard();
                keyProcessed = true;
              }
            }
          }

          if (!keyProcessed && this.isDisplayMode()) {
            if (key === "left") {
              this.emit(context.constants.widgetEvents.keyArrowLeft, domKeyEvent);
              keyProcessed = true;
            } else if (key === "right") {
              this.emit(context.constants.widgetEvents.keyArrowRight, domKeyEvent);
              keyProcessed = true;
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.manageKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * @inheritDoc
         */
        manageLocalAction: function(localActionName) {
          if (localActionName === "prevpage") {
            this.emit(context.constants.widgetEvents.keyPageUp);
          } else if (localActionName === "nextpage") {
            this.emit(context.constants.widgetEvents.keyPageDown);
          }
        },

        /**
         * @inheritDoc
         */
        manageMouseDown: function(domEvent) {

          // clear Table items selection, if not right click on items selection
          if (this !== cls.RTableWidget.getTableWithItemsSelection() || domEvent.button !== 2 || !domEvent.target.hasClass(
              "gbc_RTableItemSelectionArea")) {
            cls.RTableWidget.getTableWithItemsSelection()?._resetItemsSelection();
          }

          this._onItemMouseDown(domEvent);
          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseUp: function(domEvent) {
          this._onItemMouseUp(domEvent);
          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (domEvent.target === this.getContainerElement()) {
            if (domEvent.target === this._mouseDownTarget || !this.isEnabled()) {
              this.emit(context.constants.widgetEvents.requestFocus);
              // Add new row, done by emit(tableClickOnContainer)
              // when clicking the container element and not an item
              let clickedColumnIndex = 0;
              if (this._columns.length > 1) {
                // If there is multiple columns. Get the clicked column
                let orderedCols = this.getOrderedColumns();
                let xClick = domEvent.clientX || domEvent.screenX;
                let counter = 0;
                for (const col of orderedCols) {
                  let rect = col.getElement().getBoundingClientRect();
                  if (xClick > rect.left && xClick < rect.right) {
                    // If the click is done in a column
                    clickedColumnIndex = counter;
                    continue;
                  }
                  counter += 1;
                }
              }
              // if click is not after the last item use first column to add new row
              this.emit(context.constants.widgetEvents.tableClickOnContainer, clickedColumnIndex);
              return false;
            }
          } else if (domEvent.target.elementOrParent(cls.TableMenuButtonWidgetComponent._elementCssClass)) {
            this._buildContextMenu(domEvent);
            return false;
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          let target = domEvent.target;

          // click on data
          let isDataContainerClick = target.isElementOrChildOf(this.getContainerElement());

          if (isDataContainerClick) {
            if (this.isRowActionTriggerByDoubleClick()) {
              // emit row action for this table
              this.emit(context.constants.widgetEvents.rowAction);
            }
            return false;
          }

          return true;
        },

        /**
         * Fill a context menu with the usual table context meny elements
         * @param contextMenu - context menu to fill
         * @param opts - application build parameters
         */
        fillContextMenu: function(contextMenu, opts) {
          // Show those entries only if column is hideable
          if (!this._hasUnhidableColumns && !opts.unHidable) {
            // Be sure that the last checkbox is always check (cannot hide all columns)
            let checkLast = function() {
              const children = contextMenu.getChildren();
              let checkCount = children.filter(function(c) {
                const colWidget = c._colWidget;
                if (colWidget) {
                  // Re-enables in case it was previously last but no longer, if it is checkable
                  c.setEnabled(colWidget.isCheckable());
                  if (c.isInstanceOf(cls.CheckBoxWidget) && c.getValue()) {
                    return c;
                  }
                }
              });
              if (checkCount.length === 1) {
                checkCount[0].setEnabled(false);
              }
            };

            // Hide/show columns
            let hideShowFunc = function() {

              this.emit(gbc.constants.widgetEvents.tableShowHideCol, "toggle");

              // refocus UI widget to keep key processing & dropdown manage keys active
              // because dropdown element is outside UserInterface in the HTML Dom
              let tableWidget = this.getTableWidgetBase();
              if (tableWidget._contextMenu && tableWidget._contextMenu.isVisible()) {
                let uiWidget = tableWidget.getUserInterfaceWidget();
                if (uiWidget) {
                  uiWidget.getElement().domFocus();
                }
              }
            };

            let checkNextValue = function() {
              this.setValue(this.getNextValue());
            };

            // for each col add hide/show checkbox
            for (const col of this.getOrderedColumns()) {
              if (!col.isAlwaysHidden()) {
                let check = cls.WidgetFactory.createWidget("CheckBox", opts);
                check._colWidget = col;
                check.setEnabled(col.isCheckable());
                check.setText(col.getText());
                check.setValue(!col.isHidden());
                check.when(context.constants.widgetEvents.valueChanged, checkNextValue.bind(check));
                check.when(context.constants.widgetEvents.click, checkLast.bind(col));
                contextMenu.addChildWidget(check, {
                  clickCallback: hideShowFunc.bind(col, check)
                });
              }
            }
            checkLast();
            contextMenu.addSeparator();

            // Show all columns action
            let showAllColumnsLabel = cls.WidgetFactory.createWidget("Label", opts);
            showAllColumnsLabel.setValue(i18next.t("gwc.contextMenu.showAllColumns"));
            showAllColumnsLabel.addClass("gbc_showAllColumns_action");
            contextMenu.addChildWidget(showAllColumnsLabel, {
              clickCallback: function() {
                let columns = this.getColumns();
                for (const element of columns) {
                  let tc = element;
                  if (!tc.isAlwaysHidden() && !tc.isUnhidable()) {
                    tc.emit(gbc.constants.widgetEvents.tableShowHideCol, "show");
                  }
                }
              }.bind(this)
            });

            // Hide all columns action
            // Not available in inputmode to avoid cancelling modifications
            if (this.isDisplayMode()) {
              let hideAllColumnsLabel = cls.WidgetFactory.createWidget("Label", opts);
              hideAllColumnsLabel.setValue(i18next.t("gwc.contextMenu.hideAllColumns"));
              hideAllColumnsLabel.addClass("gbc_hideAllColumns_action");
              contextMenu.addChildWidget(hideAllColumnsLabel, {
                clickCallback: function() {
                  let columns = this.getOrderedColumns();
                  for (const col of columns) {
                    if (!col.isHidden()) {
                      col.hideOtherColumns();
                      return;
                    }
                  }
                }.bind(this)
              });
            }
          }

          // AutoFit column width based on values
          let autoFitAllColumnsLabel = cls.WidgetFactory.createWidget("Label", opts);
          autoFitAllColumnsLabel.setValue(i18next.t("gwc.contextMenu.autoFitAllColumns"));
          autoFitAllColumnsLabel.addClass("gbc_autoFitAllColumns_action");
          contextMenu.addChildWidget(autoFitAllColumnsLabel, {
            clickCallback: function() {
              this.autoFitAllColumns();
            }.bind(this)
          });

          // Fit column width so all columns visible
          // Example: if table width = 600px and there are two columns currently 100 and 200px
          // then this will set width of columns to 200 and 400 px respectively
          let fitToViewAllColumnsLabel = cls.WidgetFactory.createWidget("Label", opts);
          fitToViewAllColumnsLabel.setValue(i18next.t("gwc.contextMenu.fitToViewAllColumns"));
          fitToViewAllColumnsLabel.addClass("gbc_fitToViewAllColumns_action");
          contextMenu.addChildWidget(fitToViewAllColumnsLabel, {
            clickCallback: function() {
              this.fitToViewAllColumns();
            }.bind(this)
          });

          contextMenu.addSeparator();

          // Reset to default action
          let resetDefaultLabel = cls.WidgetFactory.createWidget("Label", opts);
          resetDefaultLabel.setValue(i18next.t("gwc.contextMenu.restoreDefaultSettings"));
          resetDefaultLabel.addClass("gbc_restoreColumnSort_action");
          contextMenu.addChildWidget(resetDefaultLabel, {
            clickCallback: function() {
              this.emit(context.constants.widgetEvents.tableResetToDefault);
            }.bind(this)
          });

          // Reset sort order action
          let resetLabel = cls.WidgetFactory.createWidget("Label", opts);
          resetLabel.setValue(i18next.t("gwc.contextMenu.restoreColumnSort"));
          resetLabel.addClass("gbc_restoreColumnSort_action");
          contextMenu.addChildWidget(resetLabel, {
            clickCallback: function() {
              this.emit(context.constants.widgetEvents.tableHeaderSort, -1);
            }.bind(this)
          });
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

          this._contextMenu = cls.WidgetFactory.createWidget("ContextMenu", opts);
          this._contextMenu.allowMultipleChoices(true);
          this._contextMenu.setParentWidget(this);
          this._contextMenu.setColor(this.getColor());
          this._contextMenu.setBackgroundColor(this.getBackgroundColor());
          this._contextMenu.onClose(function() {
            // Hide the menu button if it's visible

            this.afterDomMutator(function() {
              if (this._contextMenu) {
                this._contextMenu.destroyChildren();
                this._contextMenu.destroy();
                this._contextMenu = null;

                this._menuButtonComponent.unfreezeAndHide(cls.TableMenuButtonWidgetComponent._postHoverDelay);
              }
            }.bind(this));
          }.bind(this), true);

          this.fillContextMenu(this._contextMenu, opts);

          // beware setFocus should not raise a scroll event (it will immediately close contextmenu)
          this._element.domFocus(null, this.getElement());

          this._contextMenu.reverseX = true;
          this._contextMenu.parentElement = domEvent.target;
          this._menuButtonComponent.freeze();
          this._contextMenu.show();
        },

        /**
         * @inheritDoc
         */
        buildExtraContextMenuActions: function(contextMenu) {
          let copyFunction = null;

          if (this._selectionSquareIdx.left.x !== null) {
            copyFunction = function(contextMenu) {
              contextMenu.hide();
              this._copySelectionInClipboard();
            }.bind(this);

            contextMenu.addAction("copy", i18next.t("gwc.clipboard.copy"), null, "Control+C", {
              clickCallback: copyFunction.bind(this, contextMenu)
            }, true);
          }

          // A current line must be defined and all the selected items must be on the same row (if a selection is defined)
          if (this.canShowCopyCellAndRow()) {
            contextMenu.addAction("copyRow", i18next.t("gwc.contextMenu.copyRow"), null,
              null, {
                clickCallback: function() {
                  contextMenu.hide();
                  this._copyCurrentRowInClipboard();
                }.bind(this)
              }, true);
          }

          if (this.isMultiRowSelectionEnabled()) {
            contextMenu.addAction("selectAll", i18next.t("gwc.contextMenu.selectAll"), "font:FontAwesome.ttf:f0ea", "Ctrl+A", {
              clickCallback: function() {
                contextMenu.hide();
                this.emit(context.constants.widgetEvents.selectAll);
              }.bind(this)
            }, true);
          }
        },

        /**
         * Invalidate measure to force width & row height measure in next layout cycle
         */
        resetMeasure: function() {
          this.resetLayout();
          this.getLayoutEngine().forceMeasurement();
          this.getLayoutEngine().invalidateMeasure();
          if (this.getLayoutEngine().invalidatePreferredSize) {
            this.getLayoutEngine().invalidatePreferredSize();
          }
        },

        /**
         * Update table depending on parameters
         * @param {boolean} resetOrderedColumns - reset ordered columns
         * @param {boolean} layoutRow - update row height layout
         * @param {boolean} layoutCol - update col width layout
         */
        update: function(resetOrderedColumns, layoutRow, layoutCol) {

          if (resetOrderedColumns) {
            this.resetOrderedColumns();
          }
          if (this.getLayoutEngine().computeRowsColsCss(layoutRow, layoutCol)) {
            this.getLayoutEngine().measureDecoration();
            this.updateAllAggregate();
            this.updateFrozenColumns();
          }
        },

        /**
         * Change the type of view (classic, flipped, listview)
         * @param {String} viewType - type of view (classic, flipped, listview)
         * @param {boolean} [forceLayout] - if true, force layout of table
         */
        setViewType: function(viewType, forceLayout = false) {
          if (this.getViewType() === viewType) {
            return;
          }

          this._viewType = viewType;
          this.getElement().setAttribute("viewType", viewType);

          // Reset the layout engine
          if (this._layoutEngine && forceLayout) {
            this.resetMeasure();
            this._initLayout();
            this.update(false, true, true);
            this.getLayoutEngine().computeRowsColsCss(true, true, true);
            this.emit(context.constants.widgetEvents.layout);
            this.updateVerticalScroll(true);
          }
        },

        /**
         * Return type of view (classic, flipped, listview)
         * @return {String} (classic, flipped, listview)
         */
        getViewType: function() {
          return this._viewType;
        },

        /**
         * Is flipped view ?
         * @return {boolean} is flipped view ?
         */
        isFlipped: function() {
          return this.getViewType() === "flipped";
        },

        /**
         * Enable/disable alternate row color
         * @param {boolean} b - enable/disable alternate row color
         * @param {boolean} forceUpdate - force update of alternate row colors
         * @param {boolean} refresh - reload colors from theme service
         */
        setAlternateRows: function(b, forceUpdate = false, refresh = false) {
          let update = forceUpdate;
          if ((this._alternateRows !== b) || refresh) {
            this._alternateRows = b;
            let evenRowBackgroundColor = context.ThemeService.getValue("gbc-TableWidget-even-row-background-color");
            let oddRowBackgroundColor = context.ThemeService.getValue("gbc-TableWidget-odd-row-background-color");
            this._evenRowBackgroundColor = this._alternateRows ? evenRowBackgroundColor :
              context.ThemeService.getValue("theme-field-background-color");
            this._oddRowBackgroundColor = this._alternateRows ? oddRowBackgroundColor :
              context.ThemeService.getValue("theme-field-background-color");
            update = true;
          }
          if (update) {
            // update odd and even backcolor
            // if diff offset is odd, switch odd/even colors
            let switchOddEven = (this.getOffset() % 2 !== 0);
            this.getElement().style.setProperty('--evenRowBackgroundColor', switchOddEven ? this._oddRowBackgroundColor : this
              ._evenRowBackgroundColor);
            this.getElement().style.setProperty('--oddRowBackgroundColor', switchOddEven ? this._evenRowBackgroundColor : this
              ._oddRowBackgroundColor);
          }
        },

        /**
         * Called when a scroll is done
         * @param {Object} event - scroll event
         */
        _onScroll: function(event) {
          const scrollLeft = event.target.scrollLeft;
          const scrollTop = event.target.scrollTop;
          if (this._currentItem) {
            this._currentItem.removeClass("currentCell");
            this._currentItem = null;
          }

          const leftScrolled = this._previousScrollLeftValue !== scrollLeft;

          if (this._previousScrollTopValue !== scrollTop) {
            this._previousScrollTopValue = scrollTop;
            if (event.target) {
              // Emit scroll event for vertical scrolling
              this.emit(context.constants.widgetEvents.scroll, event, this.getRowHeight());
            }
          }

          if (leftScrolled) {
            this._previousScrollLeftValue = scrollLeft;
            // synchronize header & data horizontal scroll
            this.getHeaderGroupElement().scrollLeft = scrollLeft;
            this.getFooterGroupElement().scrollLeft = scrollLeft;

            // remove hidden columns from DOM during horizontal scroll
            this.updateVisibleColumnsInDom(scrollLeft);
          }

          // reset items selection after each scroll change
          this._resetItemsSelection();
        },

        /**
         * Update the list of columns which are in the DOM according to current viewport and horizontal scroll position (optimisation)
         * @param {number} scrollLeft
         * @param {boolean} forceColsMeasure
         * @private
         */
        updateVisibleColumnsInDom: function(scrollLeft, forceColsMeasure = false) {
          this._resetItemsSelection();
          if (!this._layoutInformation) {
            return;
          }
          const isVisible = this.isVisibleRecursively();
          if (!isVisible) {
            return;
          }

          // read scrollLeft if specified otherwise retrieve it
          scrollLeft = typeof scrollLeft !== 'undefined' ? scrollLeft : this.getScrollableArea().scrollLeft;

          const columns = this.getOrderedColumns();
          const tableWidth = this._layoutInformation.getAllocated().getWidth();
          let currentWidth = 0;
          const colsToRemove = [];
          const colsToAdd = [];

          for (const col of columns) {
            if (!this.isFlipped() && !col.isFrozen() && !col.isHidden()) { // scrollable columns
              const colLayoutInfo = col.getLayoutInformation();
              if (colLayoutInfo) {
                let colWidth = col.getWidth();

                // Use stretchmin width instead if it is greater than the measured width
                if (colLayoutInfo.isXStretched()) {
                  const rawStretchMin = colLayoutInfo.getRawInformation().getStretchMin();
                  if (rawStretchMin !== 0) {
                    const stretchMin = cls.CharSize.translate(rawStretchMin, colLayoutInfo.getCharSize().getWidthM(), colLayoutInfo
                      .getCharSize().getWidth0());
                    colWidth = stretchMin > colWidth ? stretchMin : colWidth;
                  }
                }

                // Detach columns which are not visible at left
                if ((currentWidth + colWidth) < (scrollLeft) || (currentWidth - scrollLeft) > (tableWidth - this
                    ._totalLeftFrozenColumnWidth)) {
                  colsToRemove.push(col);
                } else {
                  colsToAdd.push(col);
                }
                currentWidth += colWidth;
              }
            } else if (col.isHidden()) {
              colsToRemove.push(col);
            } else {
              colsToAdd.push(col);
            }
          }

          let measureCols = false;
          if (colsToRemove.length > 0 || colsToAdd.length > 0) {
            const prepend = scrollLeft < this._previousScrollLeftValue;
            /**
             * when prepending columns, reverse orders to prepend them from the last one to the first one
             * we try to conserve correct dom orders for columns and items even if its unnecessary 
             * because processed by their CSS order attribute, but it's nice to have
             */
            if (prepend) {
              colsToAdd.reverse();
            }
            colsToRemove.forEach(c => {
              c.detachItemsFromDom();
              c.reorderAggregateLabel();
            });
            colsToAdd.forEach(c => {
              c.attachItemsToDom(prepend);
              c.reorderAggregateLabel();
            });
            measureCols = true;
          }

          if (forceColsMeasure || measureCols) {
            // update CSS grid template
            this.getLayoutEngine().computeRowsColsCss(false, true, false);
          }

        },

        /**
         * @inheritDoc
         */
        setScrolling: function(up, down) {

          this._isScrolling = up || down;
          // unnecessary for now
          //this.getScrollerElement().toggleClass("scrollingUp", up);
          //this.getScrollerElement().toggleClass("scrollingDown", down);
        },

        /**
         * Returns item widget
         * @param {number} row - item row
         * @param {number} col - item col
         * @returns {classes.RTableItemWidget} item widget
         * @publicdoc
         */
        getItem: function(row, col) {
          return this.getRows()[row].getItems()[col];
        },

        /**
         * Returns row widgets
         * @returns {classes.RTableRowWidget[]} array of row widgets
         * @publicdoc
         */
        getRows: function() {
          return this.getChildren();
        },

        /**
         * Returns header row widget
         * @returns {classes.RTableRowWidget} header row widget
         * @publicdoc
         */
        getHeaderRowWidget: function() {
          return this._headerRowWidget;
        },

        /**
         * Returns footer row widget
         * @returns {classes.RTableRowWidget} footer row widget
         * @publicdoc
         */
        getFooterAggregatesRowWidget: function() {
          return this._footerAggregatesRowWidget;
        },

        /**
         * @inheritDoc
         */
        setPageSize: function(pageSize) {
          if (this._pageSize !== pageSize) {
            this.getElement().style.setProperty('--pageSize', `${pageSize}`);
            this._resetItemsSelection(); // reset items selection after pageSize change
          }
          $super.setPageSize.call(this, pageSize);
        },

        /**
         * @inheritDoc
         */
        setBufferSize: function(bufferSize) {
          if (this._bufferSize !== bufferSize) {
            this.getElement().style.setProperty('--bufferSize', `${bufferSize}`);
          }
          $super.setBufferSize.call(this, bufferSize);
        },

        /**
         * @inheritDoc
         */
        setSize: function(size) {
          if (this._size !== size) {
            // in input one extra line for user to click after last line
            size = (this.isInputMode() || this.isInputArrayMode()) ? size + 1 : size;
            this.getElement().style.setProperty('--size', `${size}`);

            // if size of table changed, update row number in cached data model
            this._cachedDataModel.updateNbRows(size);
          }
          $super.setSize.call(this, size);
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          options = options || {};

          if (options.isRowData) {
            let rowWidget = this.getRows()[options.rowIndex];

            // create row widget
            if (!rowWidget) {
              rowWidget = cls.WidgetFactory.createWidget("RTableRow", this.getBuildParameters());

              // don't hide first row it is used for layout computation
              let hideRow = options.rowIndex >= this.getVisibleRowCount() && options.rowIndex !== 0;
              rowWidget.setHidden(hideRow);

              $super.addChildWidget.call(this, rowWidget);

              rowWidget.onAttachedToParentTable();
            }
            // add item to row widget
            rowWidget.addChildWidget(widget, options);
          } else if (widget.isInstanceOf(cls.RTableColumnWidget)) {
            options.headerItem = true;
            options.colWidget = widget;
            widget.setOrder(this.getHeaderRowWidget().getChildren().length, true); // set order on header columns as well
            this.getHeaderRowWidget().addChildWidget(widget, options);
          } else {
            $super.addChildWidget.call(this, widget, options);
          }

          this.resetOrderedColumns();
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          $super.removeChildWidget.call(this, widget);
          this.resetOrderedColumns();
        },

        /**
         * @inheritDoc
         */
        setVisibleRowCount: function(visibleRowCount) {
          if (this.getVisibleRowCount() !== visibleRowCount) {
            $super.setVisibleRowCount.call(this, visibleRowCount);
            this.updateVisibleColumnsInDom();
            let rows = this.getRows();
            for (let i = 0; i < rows.length; ++i) {
              let row = rows[i];
              row.setHidden(i >= visibleRowCount);
            }
          }
        },

        /**
         * @inheritDoc
         */
        setVerticalScroll: function(offset, forceScroll = false) {
          // Pagination nav WIP
          //if (this._paginationWidget) {
          //  this._paginationWidget.update(size, pageSize, offset);
          //}

          if (!this.getLayoutEngine().isLayoutDone()) {
            return;
          }

          let top = 0;
          if (this.isEnabled()) {
            top = offset * this.getRowHeight();
          }
          this.getElement().style.setProperty('--scrollTop', `${top}px`);

          // if offset is different or if scrolltop value of current scrollarea is different too different from calculated value
          // need to rest scrolltop of scrollablearea
          if (!!forceScroll || (this.lastSentOffset === null || this.lastSentOffset === offset) && offset !== this.getOffset()) {
            this.setOffset(offset);
            this.doScroll(top, false);
          }
          this.lastSentOffset = null;
        },

        /**
         * Returns if vertical scroll bar is at end
         * @returns {boolean} true if vertical Scroll bar is at end
         */
        isVerticalScrollAtEnd: function() {
          let scrollArea = this.getScrollableArea();
          return (scrollArea.scrollTop + scrollArea.clientHeight) === scrollArea.scrollHeight;
        },

        /**
         * Do native vertical scroll
         * @param {number} value - new scroll value
         * @param {boolean} delta - if true, value is added to old scroll value
         */
        doScroll: function(value, delta) {
          if (delta) {
            value = (this.getScrollableArea().scrollTop + value);
          }
          // update this in case of element is not in DOM, event scroll will not be emitted
          this._previousScrollTopValue = value;

          this.getScrollableArea().scrollTo({
            top: value,
            behavior: "instant"
          });
        },

        /**
         * Do a horizontal scrolling (column by column)
         * @param {string} direction - "left" or "right"
         */
        doHorizontalScroll: function(direction) {
          let scrollArea = this.getScrollableArea();
          let scrollPos = scrollArea.scrollLeft;
          let columns = this.getOrderedColumns();
          let width = 0;
          for (const element of columns) {
            let col = element;
            if (col.isFrozen() === false && col.isHidden() === false) {
              let colWidth = col.getWidth();

              let isScrollAtStartColumn = (Math.abs(scrollPos - width) <= 2);
              let isScrollAtEndColumn = (Math.abs(scrollPos - (width + colWidth)) <= 2);
              if ((isScrollAtStartColumn || scrollPos > width) && (isScrollAtEndColumn || scrollPos < width + colWidth)) {
                if (isScrollAtStartColumn && direction === "right") {
                  scrollPos = width + colWidth;
                  direction = "left";
                } else if (isScrollAtEndColumn && direction === "right") {
                  scrollPos = width + colWidth;
                } else {
                  scrollArea.scrollLeft = direction === "right" ? width + colWidth : width;
                  break;
                }
              }
              width += colWidth;
            }
          }
        },

        /**
         * @inheritDoc
         */
        setCurrentRow: function(row, ensureRowVisible = false, vmCurrentRow = null) {

          if (vmCurrentRow !== null) {
            this._vmCurrentRow = vmCurrentRow;
          }
          this._currentRow = row;

          const children = this.getRows();
          const length = children.length;
          for (let i = 0; i < length; ++i) {
            let rowWidget = children[i];
            rowWidget.setCurrent(i === row);
          }

        },

        /**
         * @inheritDoc
         */
        setCurrentColumn: function(col) {
          this._currentColumn = col;
          let columns = this.getColumns();
          for (let i = 0; i < columns.length; i++) {
            if (columns[i].setCurrent) {
              columns[i].setCurrent(i === col);
            }
          }
        },

        /**
         * Update current item
         */
        updateCurrentItem: function() {
          const currentRow = this.getRows()[this._currentRow];
          const currentItem = currentRow && currentRow.getItems()[this._currentColumn];
          if (currentItem && currentItem !== this._currentItem) {
            if (this._currentItem) {
              this._currentItem.removeClass("currentCell");
            }
            this._currentItem = currentItem;
            this._currentItem.addClass("currentCell");
          }
        },

        /**
         * Generates a manual horizontal scroll (if needed) to make sure focused column item if visible and thus attached to DOM
         */
        scrollToCurrentColumn: function() {
          // need to scroll the table horizontally
          if (this.isFlipped()) {
            return;
          }
          const columns = this.getOrderedColumns();
          const currentCol = columns[this._currentColumn];
          if (currentCol && currentCol.isDetachedFromDom()) {

            let minScrollLeft = 0;
            // calculate required scrollLeft to make the focused column visible
            for (const col of columns) {
              if (col.isFrozen() === false && col.isHidden() === false) {
                if (col.isCurrent()) {
                  break;
                }
                minScrollLeft += col.getWidth();
              }
            }

            // substract table width (viewport width) from the calculated scrollLeft to horizontally center the focused column toward the visible viewport zone
            this.getScrollableArea().scrollLeft = Math.max((minScrollLeft - (this._layoutInformation.getAllocated().getWidth() / 2)), 0);
          }
        },

        /** Returns current column
         * @returns {number} current column
         * @public
         */
        getCurrentColumn: function() {
          return this._currentColumn;
        },

        /**
         * Add a table column (virtual)
         * @param {classes.RTableColumnWidget} col - table column
         */
        addColumn: function(col) {
          this._columns.push(col);
        },

        /**
         * Returns an array with all table columns
         * @return {classes.RTableColumnWidget[]} table columns array
         */
        getColumns: function() {
          return this._columns;
        },

        /**
         * Reset cache of ordered columns.
         */
        resetOrderedColumns: function() {
          this._orderedColumns = null;
        },

        /**
         * Returns column widgets (visual order)
         * @returns {classes.RTableColumnWidget[]} array of column widgets
         * @publicdoc
         */
        getOrderedColumns: function() {
          let columns = this.getColumns();
          if (this._orderedColumns === null || columns.length !== this._orderedColumns.length) {
            let children = columns.slice();
            children.sort(function(a, b) {
              return a.getOrder() - b.getOrder();
            });
            this._orderedColumns = children;
          }
          return this._orderedColumns;
        },

        /**
         * Set sorted column and type
         * @param sortType - sort type "asc" or "desc" (empty string for no sort)
         * @param sortColumn - column sorted (-1 for no sort)
         */
        setSort: function(sortType, sortColumn) {
          let columns = this.getColumns();

          for (let i = 0; i < columns.length; i++) {
            if (i === sortColumn) {
              columns[i].setSortDecorator(sortType);
            } else {
              columns[i].setSortDecorator("");
            }
          }
        },

        /**
         * Enable/disable row hover
         * @param {boolean} rowHover - if true enable row hover, else disable it
         */
        setRowHover: function(rowHover) {
          if (this._rowHover !== rowHover) {
            this._rowHover = rowHover;
            this._element.toggleClass("rowHover", Boolean(rowHover));
          }
        },

        /**
         * @param {boolean} enable - true if the table should allow multi-row selection, false otherwise
         */
        setMultiRowSelectionEnabled: function(enable) {
          if (this._multiRowSelectionEnabled !== enable) {
            this._multiRowSelectionEnabled = enable;
            this._element.toggleClass("multiRowSelection", enable);
          }
        },

        /**
         * Returns if multi-row selection is enabled
         * @returns {boolean} true if the table allow multi-row selection, false otherwise
         * @publicdoc
         */
        isMultiRowSelectionEnabled: function() {
          return this._multiRowSelectionEnabled;
        },

        /**
         * Sets the specified row is selected
         * @param {number} row - index of the row
         * @param {boolean} selected - true if the row should be selected, false otherwise
         */
        setRowSelected: function(row, selected) {
          if (row < this.getRows().length) {
            this.getRows()[row].setSelected(selected && !this.isInputMode()); // disable multi row selection in Input mode
          }
        },

        /**
         * Returns if the specified row is selected
         * @param {number} row - index of the row
         * @returns {boolean} true if the row is selected, false otherwise
         */
        isRowSelected: function(row) {
          return (row < this.getRows().length) && this.getRows()[row].isSelected();
        },

        /**
         * Auto-fit all column widths
         */
        autoFitAllColumns: function() {
          const app = context.SessionService.getCurrent().getCurrentApplication();
          app.scheduler.callbackCommand(function() {
            if (!this.isDestroyed()) {
              let columns = this.getColumns();
              for (const tc of columns) {
                tc.autoSetWidth(true);
              }

              // relayout & update css properties once all columns have been re-measured
              this.update(false, false, true);
              this.updateVisibleColumnsInDom();
            }
          }.bind(this));
        },

        /**
         * Auto fit column widths so all columns visible.
         */
        fitToViewAllColumns: function() {
          // phase 1 work out total
          let visibleColumns = this.getOrderedColumns().filter((column) => !column.isHidden());
          let availableSpace = this.getDataAreaWidth();
          let sizableColumnsTotalWidth = 0;
          for (const column of visibleColumns) {
            if (column.isSizable()) {
              sizableColumnsTotalWidth = sizableColumnsTotalWidth + column.getWidth();
            } else {
              availableSpace = availableSpace - column.getWidth();
            }
          }

          // Substract the rowbound width from the availableSpace
          if (this.getLayoutInformation().getRowBoundWidth) {
            availableSpace = availableSpace - this.getLayoutInformation().getRowBoundWidth();
          }

          // It means that there is no column to resize
          if (sizableColumnsTotalWidth <= 0) {
            return;
          }

          // phase 2 set column width in proportion to space available
          let sizableColumns = visibleColumns.filter((column) => column.isSizable());
          const transformationRatio = availableSpace / sizableColumnsTotalWidth;
          let availableSpaceLeft = availableSpace;
          let i = 0;
          let width = 0;
          for (const sizableColumn of sizableColumns) {
            // Give the remaining width to the last column
            if (i === sizableColumns.length - 1) {
              width = availableSpaceLeft;
            } else {
              // Round down to avoid getting out of space for the last column
              width = Math.floor(sizableColumn.getWidth() * transformationRatio);
            }
            sizableColumn.setUserWidthFromInteraction(width, true);
            availableSpaceLeft -= width;
            i += 1;
          }

          // relayout & update css properties once all columns have been re-measured
          this.update(false, false, true);
          this.updateVisibleColumnsInDom();
        },

        /**
         * Sets if the column can be hidden by the user
         * @param {boolean} b - is not hiddable ?
         */
        setUnhidable: function(b) {
          this._hasUnhidableColumns = b;
        },

        /**
         * @inheritDoc
         */
        setEnabled: function(enabled) {
          if (this._enabled !== enabled) {
            $super.setEnabled.call(this, enabled);

            this._resetItemsSelection();
            this.updateVerticalScroll(enabled);
          }
        },

        /**
         * @inheritDoc
         */
        setInTableWidgetColor: function(widget, color) {

          widget.setStyle({
            preSelector: ".gbc_RTableWidget:not(.gbc_highlightCurrentRow) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "color": color ? color + " !important" : null,
          });

          widget.setStyle({
            preSelector: ".gbc_highlightCurrentRow .gbc_RTableRowWidget:not(.currentRow) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "color": color ? color + " !important" : null,
          });
        },

        /**
         * @inheritDoc
         */
        setInTableWidgetBackgroundColor: function(widget, color) {

          widget.setStyle({
            preSelector: ".gbc_RTableWidget:not(.gbc_highlightCurrentRow.gbc_highlightCurrentCell) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "background-color": color && !widget._ignoreBackgroundColor ? color + " !important" : null,
          });

          widget.setStyle({
            preSelector: ".RTableWidget:not(.gbc_HighlightCurrentCell) .currentCell ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "background-color": color && !widget._ignoreBackgroundColor ? color + " !important" : null,
          });

          widget.setStyle({
            preSelector: ".gbc_highlightCurrentRow.noHighlightCurrentCell .gbc_RTableRowWidget:not(.currentRow) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "background-color": color && !widget._ignoreBackgroundColor ? color + " !important" : null,
          });

          widget.setStyle({
            preSelector: "gbc_RTableWidget.highlightCurrentCell:not(gbc_HighlightCurrentRow) .gbc_RTableItemWidget:not(.currentCell) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "background-color": color && !widget._ignoreBackgroundColor ? color + " !important" : null,
          });

          widget.setStyle({
            preSelector: ".highlightCurrentRow.highlightCurrentCell .gbc_RTableRowWidget:not(.currentRow) .gbc_RTableItemWidget:not(.currentCell) ",
            selector: ".gbc_WidgetBase_in_array",
            appliesOnRoot: true
          }, {
            "background-color": color && !widget._ignoreBackgroundColor ? color + " !important" : null,
          });

        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          $super.setBackgroundColor.call(this, color);
          this.setStyle('.gbc_TableHeaderGroup', {
            "background-color": color && !this._ignoreBackgroundColor ? color : null
          });
        },

        /**
         * @inheritDoc
         */
        setHaveRowBoundActions: function(haveActions) {
          $super.setHaveRowBoundActions.call(this, haveActions);

          if (haveActions) {
            this._headerRowWidget.updateRowBound();
            for (const row of this.getRows()) {
              row.updateRowBound();
            }
          }
        },

        /**
         * @inheritDoc
         */
        setDialogType: function(dialogType) {
          // Disable vertical scrollbar in INPUT mode
          $super.setDialogType.call(this, dialogType);
          // disable vertical scrolling in INPUT mode
          this.getContainerElement().toggleClass("overflow-y-hidden", this.isInputMode());
          /** @hack : As a table create labels instead of edits in display array, 
           * we need to recompute the layout when changing the dialog type for flipped table,
           * because a small change in pixel size, can mess up the whole row
           * */
          if (this.isFlipped()) {
            this.resetMeasure();
          }
        },

        // ============== START - ANTICIPATE SCROLLING FUNCTIONS ===================
        /**
         * @inheritDoc
         */
        anticipateScrolling: function() {

          // update table widgets from data model
          this.applyDataFromModel(true);

          // Update --scrollTop css variable to set table items at the right position
          const top = this.getOffset() * this.getRowHeight();
          this.getElement().style.setProperty('--scrollTop', `${top}px`);

          // update currentRow
          if (this._vmCurrentRow !== null) {
            this.setCurrentRow(this._vmCurrentRow - this.getOffset(), false);
          }

          // update alternate rows
          this.setAlternateRows(this._alternateRows, true);
        },

        /**
         * Apply data from model to widget
         * @param {boolean} blur - if true blur rows which have no data in the model
         */
        applyDataFromModel: function(blur) {

          if (!this.isEnabled()) {
            return;
          }
          context.styler.bufferize();
          const tableColumns = this.getColumns();

          let isFirstVisibleColumn = false;
          for (let columnIndex = 0; columnIndex < tableColumns.length; ++columnIndex) {
            const column = tableColumns[columnIndex];
            const columnItems = column.getItems();

            const maxLoop = Math.min(columnItems.length, this.getBufferSize());
            const isColumnVisible = (maxLoop > 0); // if there is now rows --> col is not visible
            isFirstVisibleColumn = (isColumnVisible && !isFirstVisibleColumn);

            for (let rowIndex = 0; rowIndex < maxLoop; rowIndex++) {
              const columnItem = columnItems[rowIndex];

              const rowModelIndex = this.getOffset() + rowIndex;
              if (rowModelIndex >= this._cachedDataModel.getData().length) {
                continue;
              }
              const rowModel = this._cachedDataModel.getData()[rowModelIndex];

              if (isFirstVisibleColumn && rowModel.selected !== null) {
                // do it for the first visible column only because it's about the entire row
                // update selected rows
                this.setRowSelected(rowIndex, rowModel.selected);
              }

              if (columnItem.isTreeItem() && rowModel.treeDepth !== null && rowModel.treeLeaf !== null && rowModel.treeExpanded !== null) {
                // apply tree item attributes
                columnItem.setDepth(rowModel.treeDepth);
                columnItem.setLeaf(rowModel.treeLeaf);
                columnItem.setExpanded(rowModel.treeExpanded);
              }

              const data = rowModel.items[columnIndex];
              if (data) {
                // if an item doesn't have data from model yet, then blur it
                columnItem.blur(blur && !rowModel.vm);

                if (columnIndex === 0) {
                  // if the first column is blured, blur the rowbound item
                  this.getRows()[rowIndex].getRowBoundDecorator()?.blur(blur && !rowModel.vm);
                }

                // update table items from data model when we are anticipating, otherwise let the behaviors do their job node by node
                for (const prop in data) {
                  this._updateItem(columnItem, prop, data[prop]);
                }
              }
            }
          }

          context.styler.flush();
        },

        /**
         * Update table item with datas
         * @param {classes.RTableItemWidget} tableItemWidget
         * @param {String} dataName - data name
         * @param {*} dataValue - data value
         */
        _updateItem: function(tableItemWidget, dataName, dataValue) {

          if (dataValue !== undefined) {
            const cellWidget = tableItemWidget.getWidget();

            switch (dataName) {
              case "value":
                if (cellWidget.setValue && (!cellWidget.isEditing || !cellWidget.isEditing())) {

                  if (cellWidget instanceof cls.ImageWidget) {
                    // for ImageWidget setSrc with directApply is faster than setValue
                    cellWidget.setSrc(dataValue, this._isScrolling);
                  } else {
                    cellWidget.setValue(dataValue, true);
                  }
                }
                break;
              case "image":
                tableItemWidget.setImage(dataValue);
                break;
              case "textColor":
                if (cellWidget.setColor) {
                  cellWidget.setColor(dataValue);
                }
                break;
              case "textDecoration":
                if (cellWidget.setTextDecoration) {
                  cellWidget.setTextDecoration(dataValue);
                }
                break;
              case "backgroundColor":
                tableItemWidget.setBackgroundColor(dataValue);
                break;
              case "fontWeight":
                if (cellWidget.setFontWeight) {
                  cellWidget.setFontWeight(dataValue);
                }
                break;
              default:
            }
          }
        },
        // ============== END - ANTICIPATE SCROLLING FUNCTIONS ===================

        // ============== START - HEADER Event/DnD FUNCTIONS ===================

        /**
         * Handle drag start on header
         * @param {DragEvent} evt - dragstart event
         * @private
         */
        _onHeaderDragStart: function(evt) {
          this._columnContainerComponent.onDragStart(evt);
        },

        /**
         * Handle drag end on header
         * @param {DragEvent} evt - dragend event
         * @private
         */
        _onHeaderDragEnd: function(evt) {
          this._columnContainerComponent.onDragEnd(evt);
        },

        /**
         * Handle drag start on header
         * @param {DragEvent} evt - drag event
         * @private
         */
        _onHeaderDrag: function(evt) {
          // Not handled, everything is handled into the _onHeaderDragOver() method
          return;
        },

        /**
         * Handle drag over on header
         * @param {DragEvent} evt - dragover event
         * @private
         */
        _onHeaderDragOver: function(evt) {
          this._columnContainerComponent.onDragOver(evt);
        },

        /**
         * Handle drag leave on header
         * @param {DragEvent} evt - dragleave event
         * @private
         */
        _onHeaderDragLeave: function(evt) {
          this._columnContainerComponent.onDragLeave(evt);
        },

        /**
         * Handle drop event on header
         * @param {DragEvent} evt - drop event
         * @private
         */
        _onHeaderDrop: function(evt) {
          this._columnContainerComponent.onDrop(evt);
        },

        // ====================================
        // TOUCH EVENTS
        // ====================================

        /**
         * Handle Touch Start event
         * @param {TouchEvent} evt
         */
        _onHeaderTouchStart: function(evt) {
          this._columnContainerComponent.onTouchStart(evt);
        },

        /**
         * Handle touch end event
         * @param {Object} evt 
         */
        _onHeaderTouchEnd: function(evt) {
          this._columnContainerComponent.onTouchEnd(evt);
        },

        /**
         * Handle Touch move event
         * @param {TouchEvent} evt - The touch event
         */
        _onHeaderTouchMove: function(evt) {
          this._columnContainerComponent.onTouchMove(evt);
        },

        // ============== END - HEADER Event/DnD FUNCTIONS ===================

        // ============== START - MENU BUTTON SHOW / HIDE EVENTS ===================
        /**
         * Handle wheel event
         * @param {WheelEvent} evt
         */
        _onWheel: function(evt) {
          if (evt.deltaY < 0) {
            this._menuButtonComponent.show(cls.TableMenuButtonWidgetComponent._defaultDelay);
          }
        },

        /**
         * Handle Touch Start event
         * @param {TouchEvent} evt
         */
        _onTouchStart: function(evt) {
          this._previousTouchYValue = evt.touches[0].clientY;
          this._cancelMenuButtonForThisTouchPhase = false;
        },

        /**
         * Handle Touch Move event
         * @param {TouchEvent} evt
         */
        _onTouchMove: function(evt) {
          if (evt.touches.length === 0 || this._cancelMenuButtonForThisTouchPhase) {
            return;
          }

          if (evt.touches[0].clientY > this._previousTouchYValue) {
            this._menuButtonComponent.show(cls.TableMenuButtonWidgetComponent._defaultDelay);
          } else {
            /*
             * For mobile, if the user do not scroll directly upward,
             * cancel the menu button show.
             */
            this._cancelMenuButtonForThisTouchPhase = true;
          }
        },

        // ============== END - MENU BUTTON SHOW / HIDE EVENTS ===================

        // ============== START - ITEMS CLIENT SELECTION FUNCTIONS ===================
        /**
         * Set if item selection is the default behavior (disable dnd in this case)
         * @param {boolean} b
         */
        setDefaultItemSelection: function(b) {
          this._defaultItemSelection = b;
          if (b === true) {
            this.setDndItemEnabled(false);
          }
        },

        /**
         * Check if this mouse event can allow item selection
         * @param {Object} evt - mouse event
         * @returns {boolean}
         */
        _isEventAllowItemSelection: function(evt) {
          return (this.isDisplayMode() && (evt.ctrlKey || evt.metaKey || this._defaultItemSelection)) || (this.isInputArrayMode() && (
            evt.ctrlKey ||
            evt.metaKey || (this._defaultItemSelection &&
              !this._enabled)));
        },

        /**
         * Returns true if there are some items selected
         * @returns {boolean} true if there are some items selected
         */
        hasItemsSelected: function() {
          if (this._itemSelectionElement === null) {
            return false;
          }
          return !(this._itemSelectionElement.hasClass("hidden"));
        },

        /**
         * Reset items selection
         */
        _resetItemsSelection: function() {
          this._selectionSquareIdx = {
            left: {
              x: null,
              y: null
            },
            right: {
              x: null,
              y: null
            }
          };

          if (this._firstItemSelected !== null) {
            this._itemSelectionInProgress = false;
            this._firstItemSelected = null;
            if (this._itemSelectionElement) {
              this._itemSelectionElement.addClass("hidden");
            }
            this._setItemSelection(false);
          }

          // Reset the static variable which contains the table with an items selection
          cls.RTableWidget.setTableWithItemsSelection(null);
        },

        /**
         * Handle mouseDown event for table items
         * @param {Object} evt - mousedown event
         */
        _onItemMouseDown: function(evt) {
          //if not left button
          if (evt.which !== 1) {
            return;
          }

          this._mouseDownTarget = evt.target;

          this._itemSelectionMouseMovePrevX = evt.screenX;
          this._itemSelectionMouseMovePrevY = evt.screenY;

          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");

          this._resetItemsSelection();

          // Start item selection
          if (itemWidget && this._isEventAllowItemSelection(evt)) {

            // To avoid text selection in input array
            evt.stopPropagation();
            evt.preventCancelableDefault();

            // Create selection rect element
            if (this._itemSelectionElement === null) {
              this._itemSelectionElement = document.createElement("span");
              this._itemSelectionElement.addClass("gbc_RTableItemSelectionArea");
              this._itemSelectionElement.addClass("hidden");
              this._element.appendChild(this._itemSelectionElement);
            }
            this._itemSelectionInProgress = true;
            this._firstItemSelected = itemWidget;

            // bind mousemove event
            this.getElement().on("mousemove.RTableWidget", this._onItemMouseMove.bind(this));

            this._itemSelectionElement.style.pointerEvents = "none";

            // disable dnd
            this._temporaryEnabledDndOnItem(false, this._firstItemSelected);

          }
        },

        /**
         * Stop item selection in progress
         * @param {Object} evt - mouse event
         */
        _stopInProgressItemSelection: function(evt) {
          this._itemSelectionInProgress = false;
          if (this._isEventAllowItemSelection(evt)) {
            // re-enable dnd
            this._temporaryEnabledDndOnItem(this._dndItemEnabled, this._firstItemSelected);
          }
        },

        /**
         * Handle mouseUp event for table items
         * @param {Object} evt - mouseup event
         */
        _onItemMouseUp: function(evt) {

          // unbind mousemove event
          this.getElement().off("mousemove.RTableWidget");

          if (this._itemSelectionElement) {
            this._itemSelectionElement.style.pointerEvents = "auto";
          }

          this._itemSelectionMouseMovePrevX = 0;
          this._itemSelectionMouseMovePrevY = 0;
          this._stopInProgressItemSelection(evt);
        },

        /**
         * Handle mouseLeave event for table items
         * @param {Object} evt - mouseleave event
         */
        _onItemMouseLeave: function(evt) {
          this._stopInProgressItemSelection(evt);
        },

        /**
         * Handle mouseMove event for table items
         * @param {Object} evt - mousemove event
         */
        _onItemMouseMove: function(evt) {
          let movementX = (this._itemSelectionMouseMovePrevX ? evt.screenX - this._itemSelectionMouseMovePrevX : 0);
          let movementY = (this._itemSelectionMouseMovePrevY ? evt.screenY - this._itemSelectionMouseMovePrevY : 0);

          if (Math.abs(movementX) > 1 || Math.abs(movementY) > 1) { // execute code only if movement > 1px
            if (this._itemSelectionInProgress && this._isEventAllowItemSelection(evt)) {
              let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
              if (itemWidget) {
                if (this._firstItemSelected !== null) {
                  this._setItemSelection(true, this._firstItemSelected, itemWidget);
                }
              }
            }
          }

          this._itemSelectionMouseMovePrevX = evt.screenX;
          this._itemSelectionMouseMovePrevY = evt.screenY;
        },

        /**
         * Copy current items selection in the clipboard
         */
        _copySelectionInClipboard: function() {
          let rows = [];
          let rowIndex;

          let orderedColumns = this.getOrderedColumns();
          for (const col of orderedColumns) {
            rowIndex = 0;
            for (const item of col.getChildren()) {
              if (item.isClientSelected()) {

                let text = item.getChildren()[0].getValueForClipboard(true) + "\t";
                if (rows.length <= rowIndex) {
                  rows.push(text);
                } else {
                  rows[rowIndex] += text;
                }
                rowIndex++;
              }
            }
          }
          for (let i = 0; i < rows.length; ++i) {
            rows[i] = rows[i].substring(0, rows[i].length - 1);
          }
          gbc.ClipboardService.copyFromWidget(this, rows.join("\r\n"));

          this._itemSelectionElement?.addClass("inClipboard");
        },

        /**
         * Copy current row items in the clipboard
         */
        _copyCurrentRowInClipboard: function() {
          let row = "";

          let orderedColumns = this.getOrderedColumns();
          for (let i = 0; i < orderedColumns.length; i++) {
            let col = orderedColumns[i];
            if (!col.isHidden()) {
              if (this._currentRow >= 0 && this._currentRow < col.getChildren().length) {
                let item = col.getChildren()[this._currentRow];
                row += item.getChildren()[0].getValueForClipboard(true);
                if (i < orderedColumns.length - 1) {
                  row += '\t';
                }
              }
            }
          }

          gbc.ClipboardService.copyFromWidget(this, row).then(null);
        },

        /**
         * Copy current cell item in the clipboard
         */
        _copyCurrentCellInClipboard: function() {
          let cell = "";
          let col = this.getColumns()[this._currentColumn];

          if (this._currentRow >= 0 && this._currentRow < col.getChildren().length) {
            let item = col.getChildren()[this._currentRow];
            cell = item.getChildren()[0].getValueForClipboard(true);
          }

          gbc.ClipboardService.copyFromWidget(this, cell).then(null);
        },

        /**
         * Select items
         * @param {boolean} doSelect - true/false select or unselect items
         * @param {classes.RTableItemWidget} [startSelectedItem]
         * @param {classes.RTableItemWidget} [endSelectedItem]
         */
        _setItemSelection: function(doSelect, startSelectedItem, endSelectedItem) {

          let realStartRow = -1;
          let realEndRow = -1;
          let realStartCol = -1;
          let realEndCol = -1;

          this._itemSelectionHasChanged = false;

          if (doSelect && startSelectedItem && endSelectedItem) {

            let startCol = startSelectedItem.getColumnWidget().getOrderedColumnIndex();
            let startRow = startSelectedItem.getRowIndex();
            let endCol = !endSelectedItem ? startCol : endSelectedItem.getColumnWidget().getOrderedColumnIndex();
            let endRow = !endSelectedItem ? startRow : endSelectedItem.getRowIndex();

            this._selectionSquareIdx.left.x = realStartRow = (startRow < endRow) ? startRow : endRow;
            this._selectionSquareIdx.right.x = realEndRow = (startRow < endRow) ? endRow : startRow;
            this._selectionSquareIdx.left.y = realStartCol = (startCol < endCol) ? startCol : endCol;
            this._selectionSquareIdx.right.y = realEndCol = (startCol < endCol) ? endCol : startCol;

            let mostLeftItem = (realStartCol === startCol) ? startSelectedItem : endSelectedItem;
            let mostRightItem = (realStartCol === startCol) ? endSelectedItem : startSelectedItem;
            let left = mostLeftItem.getElement().getBoundingClientRect().left;
            let right = mostRightItem.getElement().getBoundingClientRect().right;

            let mostTopItem = (realStartRow === startRow) ? startSelectedItem : endSelectedItem;
            let mostBottomItem = (realStartRow === startRow) ? endSelectedItem : startSelectedItem;
            let top = mostTopItem.getElement().getBoundingClientRect().top;
            let bottom = mostBottomItem.getElement().getBoundingClientRect().bottom;
            let tableTop = this.getElement().getBoundingClientRect().top;
            let tableLeft = this.getElement().getBoundingClientRect().left;

            this.setStyle(".gbc_RTableItemSelectionArea", {
              "left": (left - tableLeft) + "px",
              "top": (top - tableTop) + "px",
              "width": (right - left) + "px",
              "height": (bottom - top) + "px"
            });

            this._itemSelectionElement.removeClass("hidden");
            this._itemSelectionHasChanged = true;

            this._itemSelectionElement.removeClass("inClipboard");
          }

          for (let i = 0; i < this.getOrderedColumns().length; i++) {
            let col = this.getOrderedColumns()[i];
            for (let j = 0; j < col.getChildren().length; j++) {
              let item = col.getChildren()[j];

              let select = (doSelect && i >= realStartCol && i <= realEndCol && j >= realStartRow && j <= realEndRow);
              item.setClientSelected(select);
            }
          }

          cls.RTableWidget.setTableWithItemsSelection(this);
        },

        /**
         * Enable or disable Dnd on a item
         * @param {boolean} b - true/false enable/disable Dnd on item
         * @param {classes.RTableItemWidget} item
         */
        _temporaryEnabledDndOnItem: function(b, item) {
          if (item) {
            item.setDndEnabled(b);

            if (b) {
              this.getContainerElement().setAttribute("draggable", "true");
            } else {
              this.getContainerElement().removeAttribute("draggable");
            }
          }
        },
        // ============== END - ITEMS CLIENT SELECTION FUNCTIONS ===================

        // ============== START - ITEMS DnD FUNCTIONS ===================

        /**
         * Is Dnd of items enabled ?
         * @returns {boolean} is item dnd enabled ?
         */
        isDndItemEnabled: function() {
          return this._dndItemEnabled;
        },

        /**
         * Enable Dnd of items
         * @param {boolean} enableDnd
         */
        setDndItemEnabled: function(enableDnd) {
          if (this._dndItemEnabled === enableDnd) {
            return;
          }
          if (enableDnd && this._defaultItemSelection) {
            return; // no dnd if default is item selection
          }

          this._dndItemEnabled = enableDnd;

          let columns = this.getColumns();
          for (const column of columns) {
            column.setDndItemEnabled(enableDnd);
          }

          let containerElement = this.getContainerElement();
          if (enableDnd) {
            containerElement.on("dragstart.TableWidget", this._onItemDragStart.bind(this));
            containerElement.on("dragend.TableWidget", this._onItemDragEnd.bind(this));
            containerElement.on("dragover.TableWidget", this._onItemDragOver.bind(this));
            containerElement.on("drop.TableWidget", this._onItemDrop.bind(this));
            containerElement.on("dragleave.TableWidget", this._onItemDragLeave.bind(this));
            containerElement.on("dragenter.TableWidget", this._onItemDragEnter.bind(this));
          } else {
            containerElement.off("dragstart.TableWidget");
            containerElement.off("dragend.TableWidget");
            containerElement.off("dragover.TableWidget");
            containerElement.off("drop.TableWidget");
            containerElement.off("dragleave.TableWidget");
            containerElement.off("dragenter.TableWidget");
          }
        },

        /**
         * Trigger onDragStart on the RTableItemWidget that was dragged
         * @param {MouseEvent} evt - dragstart event
         */
        _onItemDragStart: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDragStart) {
            itemWidget.onDragStart(evt);
          }
        },
        /**
         * Trigger onDragEnd on the RTableItemWidget that was dragged
         * @param {MouseEvent} evt - dragend event
         */
        _onItemDragEnd: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDragEnd) {
            itemWidget.onDragEnd(evt);
          }
        },
        /**
         * Handle dragEnter event for table items
         * @param {Object} evt - dragenter event
         */
        _onItemDragEnter: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDragEnter) {
            itemWidget.onDragEnter(evt);
          } else if (evt.target.hasClass("gbc_TableDataGroup") && !evt.target.contains(evt.relatedTarget)) {
            /* CAUTION : With Webkit browsers this event will be triggered
             * even when we "enter" the container from a child of it.
             * Webkit do not manage dragEnter.relatedTarget
             * But, the DndService should filter the event sent to the VM
             */
            this.emit(gbc.constants.widgetEvents.tableDragEnter, evt);
          }
        },
        /**
         * Handle dragOver event for table items
         * @param {Object} evt - dragover event
         */
        _onItemDragOver: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDragOver) {
            itemWidget.onDragOver(evt);
          } else if (evt.target.hasClass("gbc_TableDataGroup")) {
            // Find the row equivalent to where the evt.offsetX is
            const dragOverRowIndex = Math.clamp(
              Math.floor(evt.offsetY / this.getLayoutInformation().getRowHeight()),
              0,
              this.getBufferSize()
            );
            this.getColumns()[0]?.emit(gbc.constants.widgetEvents.tableDragOver, dragOverRowIndex, evt);
          }
        },
        /**
         * Handle dragLeave event for table items
         * @param {Object} evt - dragleave event
         */
        _onItemDragLeave: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDragLeave) {
            itemWidget.onDragLeave(evt);
          }
          if (!Math.isInBound(this.getContainerElement().getBoundingClientRect(), evt.clientX, evt.clientY)) {
            /** 
             * Trigger this event only if we leave the container 
             * for another widget than a child or itself.
             */
            this.emit(gbc.constants.widgetEvents.tableDragLeave, evt);
          }
        },
        /**
         * Handle drop event for table items
         * @param {Object} evt - drop event
         */
        _onItemDrop: function(evt) {
          let itemWidget = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_RTableItemWidget");
          if (itemWidget && itemWidget.onDrop) {
            itemWidget.onDrop(evt);
          } else if (evt.target.hasClass("gbc_TableDataGroup")) {
            // Find the row equivalent to where the evt.offsetX is
            const dropRowIndex = Math.clamp(
              Math.floor(evt.offsetY / this.getLayoutInformation().getRowHeight()),
              0,
              this.getBufferSize()
            );
            this.getColumns()[0].emit(gbc.constants.widgetEvents.tableDrop, dropRowIndex, evt);
          }
        },

        // ============== END - ITEMS DnD FUNCTIONS =====================

        // ============== START - FROZEN COLUMNS FUNCTIONS ===================
        /**
         * Update frozen columns.
         */
        updateFrozenColumns: function() {
          let columns = this.getOrderedColumns();
          this._totalLeftFrozenColumnWidth = 0;
          this._totalVisibleLeftFrozenColumns = 0;
          let totalLeftFrozenColumns = parseInt(this._leftFrozenColumns);

          context.styler.bufferize();
          for (let i = 0; i < columns.length; i++) {
            let currentColumn = columns[i];

            if (i < this._leftFrozenColumns) {
              // left frozen column
              currentColumn.setLastLeftFrozen((i + 1) === this._leftFrozenColumns);
              currentColumn.setLeftFrozen(true);
              currentColumn.setFirstRightFrozen(false);
              currentColumn.setRightFrozen(false);
              // left frozen columns get a negative order to force them to be located even before the grid spacer
              currentColumn.setOrder(-(totalLeftFrozenColumns + 1), true);
              totalLeftFrozenColumns--;
              if (!currentColumn.isHidden()) {
                this._totalLeftFrozenColumnWidth += currentColumn.getWidth();
                this._totalVisibleLeftFrozenColumns++;
              }
            } else if (columns.length - i <= this._rightFrozenColumns) {
              // right frozen column
              currentColumn.setLastLeftFrozen(false);
              currentColumn.setLeftFrozen(false);
              currentColumn.setFirstRightFrozen((columns.length - i) === this._rightFrozenColumns);
              currentColumn.setRightFrozen(true);
            } else {
              // regular column
              currentColumn.setLastLeftFrozen(false);
              currentColumn.setLeftFrozen(false);
              currentColumn.setFirstRightFrozen(false);
              currentColumn.setRightFrozen(false);
              if (currentColumn.getOrder() < 0) { // previously left frozen : replace negative order to normal order
                currentColumn.setOrder(currentColumn.getOrderedColumnIndex(), true);
              }
            }
          }

          context.styler.flush();
        },

        /**
         * Sets the number of left frozen columns.
         * @param {number} n - number of left frozen columns
         * @publicdoc
         */
        setLeftFrozenColumns: function(n) {
          if (this._leftFrozenColumns !== n) {
            this._leftFrozenColumns = n;
          }
        },

        /**
         * Sets the number of right frozen columns.
         * @param {number} n - number of right frozen columns
         * @publicdoc
         */
        setRightFrozenColumns: function(n) {
          if (this._rightFrozenColumns !== n) {
            this._rightFrozenColumns = n;
          }
        },

        /**
         * Returns number of left frozen columns
         * @returns {number} number of left frozen columns
         * @publicdoc
         */
        getLeftFrozenColumns: function() {
          return this._leftFrozenColumns;
        },

        /**
         * Returns number of right frozen columns
         * @returns {number} number of right frozen columns
         * @publicdoc
         */
        getRightFrozenColumns: function() {
          return this._rightFrozenColumns;
        },

        /**
         * Returns number of left frozen columns currently visible
         * @returns {number|*}
         */
        getTotalVisibleLeftFrozenColumns: function() {
          return this._totalVisibleLeftFrozenColumns;
        },

        /**
         * Returns true if table can have frozen columns
         * @returns {boolean} true if table can have frozen columns
         * @publicdoc
         */
        isFrozenTable: function() {
          return this._frozenTable;
        },

        /**
         * Sets if table can contain frozen cols.
         * @param {boolean} frozen - true if table can have frozen columns
         */
        setFrozenTable: function(frozen) {
          if (frozen === this._frozenTable) {
            return;
          }
          this._frozenTable = frozen;
          // If the table should not be frozen, unfreeze all the columns
          if (!this._frozenTable) {
            this.setLeftFrozenColumns(0);
            this.setRightFrozenColumns(0);
            this.updateFrozenColumns();
            this.updateVisibleColumnsInDom();
          }
        },
        // ============== END - FROZEN COLUMNS FUNCTIONS =====================

        // ============== START - FOOTER/AGGREGATE FUNCTIONS ===================
        /**
         * Defines if the footer element is needed (used to display aggregate)
         * @param {boolean} b - true to display footer, false to hide it
         */
        setHasFooter: function(b) {
          if (this._hasFooter !== b) {
            this._hasFooter = b;
            this.getFooterGroupElement().toggleClass("hidden", !b);
          }
        },

        /**
         * Returns if table has a footer (used for aggregate)
         * @returns {boolean} true if footer is visible
         */
        hasFooter: function() {
          return this._hasFooter;
        },

        /**
         * Global text for aggregates
         * @param {string} text - global aggregate text
         */
        setAggregateGlobalText: function(text) {
          if (text !== "") {
            if (!this._aggregateGlobalTextElement) {
              this._aggregateGlobalTextElement = document.createElement("div");
              this._aggregateGlobalTextElement.addClass("gbc_TableAggregateGlobalText");
            }
            this._aggregateGlobalTextElement.textContent = text;

            this._footerAggregatesRowWidget.getElement().prependChild(this.getAggregateGlobalTextElement());
          }
        },

        /**
         * Update all aggregates
         */
        updateAllAggregate: function() {
          if (this.hasFooter()) {
            for (const columnWidget of this.getColumns()) {
              columnWidget.setAggregate(null);
            }
          }
        },

        // ============== END - FOOTER/AGGREGATE FUNCTIONS ===================

        // ============== START - STYLE FUNCTIONS ===================
        /**
         * Show/hide table X grid
         * @param {boolean} showGridX - if true always show grid
         */
        setShowGridX: function(showGridX) {
          if (this._showGridX !== showGridX) {
            this._showGridX = showGridX;
            this._element.toggleClass("showGridX", Boolean(showGridX));
          }
        },

        /**
         * Show/hide table Y grid
         * @param {boolean} showGridY - if true always show grid
         */
        setShowGridY: function(showGridY) {
          if (this._showGridY !== showGridY) {
            this._showGridY = showGridY;
            this._element.toggleClass("showGridY", Boolean(showGridY));
          }
        },

        /**
         * Hide/Show column headers
         * @param {boolean} hidden - true if header must be hidden
         */
        setHeaderHidden: function(hidden) {
          if (this._headerHidden === hidden) {
            return;
          }
          this._headerHidden = hidden;
          this._element.toggleClass("headerHidden", Boolean(hidden));
        },

        /**
         * Set header columns alignment
         * @param {string} alignment - (left, center, right, auto)
         */
        setHeaderAlignment: function(alignment) {
          if (this._headerAlignment !== alignment) {
            this._headerAlignment = alignment;

            if (alignment === "auto") {
              // if alignment is auto don't force specific alignement
              return;
            }

            let columns = this.getColumns();
            for (const columnElement of columns) {
              columnElement.setTextAlign(alignment, true);
            }
          }
        },

        /**
         * Get header columns alignment
         * @return {string} alignment - (left, center, right, auto)
         */
        getHeaderAlignment: function() {
          return this._headerAlignment;
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          if (color === this._defaultTTFColor) {
            return;
          }
          this.setStyle(".gbc_RTableItemImage svg", {
            'fill': color
          });
        },

        /**
         * Indicates if the last visible column should fill the empty space.
         * @param {boolean} fillEmptySpace - true if last column fills empty space
         */
        setResizeFillsEmptySpace: function(fillEmptySpace) {
          this._resizeFillsEmptySpace = fillEmptySpace;
        },

        /**
         * Indicates if the last visible column should fill the empty space.
         * @return {boolean} true if last column fills empty space
         * @publicdoc
         */
        isResizeFillsEmptySpace: function() {
          return this._resizeFillsEmptySpace;
        },

        /**
         * Update highlight row and cell
         */
        updateHighlight: function() {},

        // ============== END - STYLE FUNCTIONS ===================

        // ============== START - DOM ELEMENT GETTERS ===================
        /**
         * @inheritDoc
         */
        getScrollableArea: function() {
          return this.getContainerElement();
        },

        /**
         * Returns header group DOM Element
         * @returns {HTMLElement} header group DOM Element
         * @publicdoc
         */
        getHeaderGroupElement: function() {
          if (!this._headerGroupElement) {
            this._headerGroupElement = this.getElement().getElementsByClassName("gbc_TableHeaderGroup")[0];
          }
          return this._headerGroupElement;
        },

        /**
         * Returns footer group DOM Element
         * @returns {HTMLElement} footer group DOM Element
         * @publicdoc
         */
        getFooterGroupElement: function() {
          if (!this._footerGroupElement) {
            this._footerGroupElement = this.getElement().getElementsByClassName("gbc_TableFooterGroup")[0];
          }
          return this._footerGroupElement;
        },

        /**
         * Returns vertical scroller DOM Element
         * @returns {HTMLElement} scroller DOM Element
         * @publicdoc
         */
        getScrollerYElement: function() {
          if (!this._scrollerYElement) {
            this._scrollerYElement = this.getScrollableArea().getElementsByClassName("scroller_y")[0];
          }
          return this._scrollerYElement;
        },

        /**
         * Returns horizontal scroller DOM Element
         * @returns {HTMLElement} scroller DOM Element
         * @publicdoc
         */
        getScrollerXElement: function() {
          if (!this._scrollerXElement) {
            this._scrollerXElement = this.getScrollableArea().getElementsByClassName("scroller_x")[0];
          }
          return this._scrollerXElement;
        },

        /**
         * Returns aggregate global text DOM Element
         * @returns {HTMLElement} aggregate global text DOM Element
         */
        getAggregateGlobalTextElement: function() {
          return this._aggregateGlobalTextElement;
        },

        // ============== END - DOM ELEMENT GETTERS =====================
      };
    });
    cls.WidgetFactory.registerBuilder("RTable", cls.RTableWidget);
  });
