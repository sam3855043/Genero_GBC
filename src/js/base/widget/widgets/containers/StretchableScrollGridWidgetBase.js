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

modulum('StretchableScrollGridWidgetBase', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {
    /**
     * Strechable Scroll Grid base widget
     * @class StretchableScrollGridWidgetBase
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc
     */
    cls.StretchableScrollGridWidgetBase = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.StretchableScrollGridWidgetBase.prototype */ {
        __name: "StretchableScrollGridWidgetBase",

        /** @type {boolean} */
        _rowActionTriggerByDoubleClick: true,
        /** @type {boolean} */
        _focusOnField: false,

        /** @type {classes.HighlightWidgetComponent} */
        _highlightComponent: null,

        /** @type {classes.RowAspectWidgetComponent} */
        _rowAspectComponent: null,

        constructor: function(opts) {
          this._highlightComponent = new cls.HighlightWidgetComponent(this, true, false);
          this._rowAspectComponent = new cls.RowAspectWidgetComponent(this);
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._rowAspectComponent.destroy();
          this._rowAspectComponent = null;
          this._highlightComponent.destroy();
          this._highlightComponent = null;

          $super.destroy.call(this);
        },

        _initElement: function() {
          $super._initElement.call(this);
          this._rowAspectComponent.setRowAspect("default");
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          $super._initLayout.call(this);

          this._layoutEngine = new cls.StretchableScrollLayoutEngine(this);
          this._layoutInformation.getStretched().setDefaultX(true);
          this._layoutInformation.getStretched().setDefaultY(true);
        },

        /**
         * @inheritdoc
         */
        addChildWidget: function(childWidget, options) {
          if (childWidget.isInstanceOf(cls.StretchableScrollGridLineWidget)) {
            $super.addChildWidget.call(this, childWidget, options);
          }
        },

        /**
         * Launch a FocusCommand on the scheduler
         * @param {*} event 
         */
        requestFocus: function(event) {
          this.emit(context.constants.widgetEvents.requestFocus, event);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (domKeyEvent) {
            let key = cls.KeyboardApplicationService.keymap[domKeyEvent.which];
            keyProcessed = true;
            switch (key) {
              case "down":
                this.emit(context.constants.widgetEvents.keyArrowDown, domKeyEvent);
                break;
              case "up":
                this.emit(context.constants.widgetEvents.keyArrowUp, domKeyEvent);
                break;
              case "pageup":
                this.emit(context.constants.widgetEvents.keyPageUp, domKeyEvent);
                break;
              case "pagedown":
                this.emit(context.constants.widgetEvents.keyPageDown, domKeyEvent);
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
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Indicates how the row action must be triggered.
         * @param {boolean} b - true if action is triggered by double click (else it is single click)
         */
        setRowActionTriggerByDoubleClick: function(b) {
          this._rowActionTriggerByDoubleClick = b;
        },

        /**
         * Defines if focus in on a field or (default) on a row
         * @param {boolean} focusOnField - true if focus on field activated
         */
        setFocusOnField: function(focusOnField) {
          if (this._focusOnField !== focusOnField) {
            this._focusOnField = focusOnField;
            this.toggleClass("gbc_focusOnField", focusOnField);
            this.updateHighlight();
          }
        },

        /**
         * Defines the scroll grid bufferSize
         * @param {number} bufferSize - buffer size
         */
        setBufferSize: function(bufferSize) {
          this._bufferSize = bufferSize;
        },

        /**
         * Returns scroll grid bufferSize
         * @returns {number}
         */
        getBufferSize: function() {
          return this._bufferSize;
        },

        /**
         * Returns if focus is on a field (by default focus is on a row)
         * @returns {boolean} true if focus on field activated
         */
        hasFocusOnField: function() {
          return this._focusOnField;
        },

        /**
         * Change current row
         * @param {number} row - new current row
         */
        setCurrentRow: function(row) {
          this._currentRow = row;
          const children = this.getChildren();
          const length = children.length;
          for (let i = 0; i < length; ++i) {
            const rowWidget = children[i];
            rowWidget.setCurrent(i === row);
          }
        },

        /**
         * @returns {number} the current row
         */
        getCurrentRow: function() {
          return this._currentRow;
        },

        /**
         * Defines the highlight color of rows, used for selected rows
         * @param {string} color - CSS color
         */
        setHighlightColor: function(color) {
          this._highlightComponent.setHighlightBackgroundColor(color);
        },

        /**
         * Defines the highlighted text color of rows, used for selected rows
         * @param {string} color - CSS color
         */
        setHighlightTextColor: function(color) {
          this._highlightComponent.setHighlightTextColor(color);
        },

        /**
         * Indicates if the current row must be highlighted
         * @param {boolean} doHighlight - true if current row must be highlighted
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
         * Indicates if the current cell must be highlighted
         * @param {boolean} doHighlight - true if current cell must be highlighted
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
         * Update highlight row and cell
         */
        updateHighlight: function() {},

        // Reset row height
        resetRowHeight: function() {
          this._rowHeight = 0;
        },

        // ============== START - COMPONENTS GETTERS =====================

        /**
         * @returns {classes.HighlightWidgetComponent} The highlight component of the widget
         */
        getHighlightComponent: function() {
          return this._highlightComponent;
        },

        /**
         * @returns {classes.RowAspectWidgetComponent} The row aspect component of the widget
         */
        getRowAspectComponent: function() {
          return this._rowAspectComponent;
        }

        // ============== START - COMPONENTS GETTERS =====================
      };
    });
  });
