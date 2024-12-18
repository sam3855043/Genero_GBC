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

modulum('RowBoundDecoratorWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * RowBound decorator.
     * @class RowBoundDecoratorWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     * @publicdoc
     */
    cls.RowBoundDecoratorWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.RowBoundDecoratorWidget.prototype */ {
        __name: "RowBoundDecoratorWidget",

        /** @type {classes.ContextMenuWidget} */
        _contextMenuWidget: null,

        /** @type {Element} */
        _contextMenuIconElement: null,
        /** @type {number|null} */
        _order: null,
        /** @type {HandleRegistration|null} */
        _onMenuOpenHandler: null,
        /** @type {HandleRegistration|null} */
        _onMenuCloseHandler: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);

          this._contextMenuIconElement = this._element.getElementsByTagName('span')[0];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._contextMenuIconElement = null;
          this._contextMenuWidget = null;
          if (this._onMenuOpenHandler) {
            this._onMenuOpenHandler();
            this._onMenuOpenHandler = null;
          }
          if (this._onMenuCloseHandler) {
            this._onMenuCloseHandler();
            this._onMenuCloseHandler = null;
          }
          $super.destroy.call(this);
        },

        /**
         * Returns rowbound container widget
         * @returns {classes.TableWidgetBase|classes.StretchableScrollGridWidget} rowBound container widget
         */
        getRowBoundContainerWidget: function() {
          let rowBoundContainerWidget = this.getTableWidgetBase();
          if (!rowBoundContainerWidget && this.getParentWidget().isInstanceOf(cls.StretchableScrollGridLineWidget)) {
            rowBoundContainerWidget = this.getParentWidget().getParentWidget();
          }
          return rowBoundContainerWidget;
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {

          if (!this.isEnabled()) {
            return $super.manageMouseClick.call(this, domEvent);
          }

          let rowBoundContainerWidget = this.getRowBoundContainerWidget();
          if (!rowBoundContainerWidget) {
            return true;
          }

          // request focus
          if (this.getParentWidget().requestFocus) {
            this.getParentWidget().requestFocus(domEvent);
          }

          if (domEvent.target.isElementOrChildOf(this._contextMenuIconElement)) {
            // request open context  menu
            let rowBoundWidget = rowBoundContainerWidget.getRowBoundMenu();
            if (rowBoundWidget) {
              rowBoundWidget.parentElement = this._contextMenuIconElement;
              rowBoundWidget.reverseX = true;
              rowBoundContainerWidget.getRowBoundMenu().onClose(this.hide);
              this._onMenuOpenHandler = rowBoundContainerWidget.getRowBoundMenu().when(cls.DropDownWidget.widgetEvents.dropDownOpen, this
                ._showOnMenuOpen.bind(this));
              this._onMenuCloseHandler = rowBoundContainerWidget.getRowBoundMenu().when(cls.DropDownWidget.widgetEvents.dropDownClose, this
                ._hideOnMenuClose.bind(this));
              rowBoundContainerWidget.emit(context.constants.widgetEvents.rowBoundMenu);
              return false;
            }
          }
          return true;
        },

        /**
         * Set the reference to rowBound context menu
         * @param {classes.ContextMenuWidget} contextMenu
         */
        setContextMenuWidget: function(contextMenu) {
          this._contextMenuWidget = contextMenu;
          if (this._contextMenuWidget) {
            this._contextMenuWidget.when("onActionChange", this.update.bind(this));
          }
        },

        /**
         * Sets index order of row bound cell
         * @param {number} colIndex - order index
         */
        setOrder: function(colIndex) {
          const rowWidget = this.getParentWidget();
          // take row index, start index with 1 (instead of 0) and generate a 4 digits number
          const rowIndex = (rowWidget.getRowIndex() + 1) * rowWidget.getOrderMultiplier();
          // add column index to row index
          let order = rowIndex + colIndex;
          order = order * 10;
          this._order = order;
          this.getElement().style.order = order.toString();
        },

        /**
         * Update (visibility & quick actions)
         */
        update: function() {
          const actions = this._contextMenuWidget?.getActionWidgets();

          this._contextMenuIconElement?.toggleClass("hidden", actions.size === 0);
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
         * This method is meant to be called by the rowbound menu dropdown events
         * It unbind the show handler to avoid showing the rowbound everytime the dropdown open
         * then show the rowBound via CSS variable attribution
         * @private
         */
        _showOnMenuOpen: function() {
          if (this._onMenuOpenHandler) {
            this._onMenuOpenHandler();
            this._onMenuOpenHandler = null;
          }
          this.setStyle({
            "--rowBoundVisibility": "visible"
          });
        },

        /**
         * This method is meant to be called by the rowbound menu dropdown events
         * It unbind the hide handler to avoid being called everytime the dropdown close
         * then hide the rowBound by unsetting the CSS variable responsible of rowbound visibility
         * @private
         */
        _hideOnMenuClose: function() {
          if (this._onMenuCloseHandler) {
            this._onMenuCloseHandler();
            this._onMenuCloseHandler = null;
          }
          this.setStyle({
            "--rowBoundVisibility": null
          });
        }
      };
    });
    cls.WidgetFactory.registerBuilder('RowBoundDecorator', cls.RowBoundDecoratorWidget);
  });
