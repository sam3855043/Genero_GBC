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

modulum('StretchableScrollGridLineWidget', ['GridWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Stretchable scroll grid line widget.
     * @class StretchableScrollGridLineWidget
     * @memberOf classes
     * @extends classes.GridWidget
     * @publicdoc
     */
    cls.StretchableScrollGridLineWidget = context.oo.Class(cls.GridWidget, function($super) {

      return /** @lends classes.StretchableScrollGridLineWidget.prototype */ {
        __name: "StretchableScrollGridLineWidget",

        /** @type boolean */
        _current: false,

        /** @type classes.RowBoundDecoratorWidget */
        _rowBoundDecoratorWidget: null,

        /**
         * @constructs
         * @param {*} opts - Options passed to the constructor
         */
        constructor: function(opts) {
          opts = (opts || {});
          opts.inScrollGrid = true;
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._rowBoundDecoratorWidget) {
            this._rowBoundDecoratorWidget.destroy();
            this._rowBoundDecoratorWidget = null;
          }
          for (let child of this._children) {
            child.destroy();
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (!domEvent?.gbcFocusRequested) {
            this.requestFocus(domEvent);
          }
          return true;
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          this.emit(context.constants.widgetEvents.doubleClick, domEvent);
          return true;
        },

        /**
         * Request focus for this row
         * @param {*} domEvent - dom event object
         */
        requestFocus: function(domEvent) {
          if (domEvent) {
            domEvent.currentRow = this._rowIndex;
          }
          if (this.getParentWidget()?.requestFocus) {
            this.getParentWidget().requestFocus(domEvent);
          }
        },

        /**
         * Sets if the row is the current one
         * @param {boolean} current - true if row is the current one, false otherwise
         * @publicdoc
         */
        setCurrent: function(current) {
          if (this._current !== current) {
            this._current = current;
            if (current) {
              this._element.addClass("currentRow");
              this._children.forEach(function(w) {
                w.addClass("currentRow");
              });
            } else {
              this._element.removeClass("currentRow");
              this._children.forEach(function(w) {
                w.removeClass("currentRow");
              });
            }
          }

          const parent = this.getParentWidget();
          if (parent) {
            this._element.toggleClass("highlight", parent.isHighlightCurrentRow());
            this._element.toggleClass("nohighlight", !parent.isHighlightCurrentRow());
          }
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          $super.addChildWidget.call(this, widget, options);
          widget.removeClass("gbc_WidgetBase_standalone");
          widget.addClass("gbc_WidgetBase_in_array");
        },

        /**
         * Creates and adds rowBound decorator element to DOM
         */
        addRowBoundDecorator: function() {
          this._rowBoundDecoratorWidget = cls.WidgetFactory.createWidget("RowBoundDecorator", this.getBuildParameters());
          this._rowBoundDecoratorWidget.setParentWidget(this);

          this._rowBoundDecoratorWidget.setContextMenuWidget(this.getParentWidget().getRowBoundMenu());
          this._rowBoundDecoratorWidget.update();

          this._element.appendChild(this._rowBoundDecoratorWidget.getElement());
        },

        /**
         * Return rowBound decorator widget
         * @return {classes.RowBoundDecoratorWidget} - rowBound decorator widget
         */
        getRowBoundDecoratorWidget: function() {
          return this._rowBoundDecoratorWidget;
        },

        /**
         * Return current row index of widget inside scrollgrid
         * @returns {?number|number|*}
         */
        getRowIndex: function() {
          return this._rowIndex;
        },

        /**
         * Set current row index of widget within scrollgrid
         * @param index
         */
        setRowIndex: function(index) {
          this._rowIndex = index;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('StretchableScrollGridLine', cls.StretchableScrollGridLineWidget);
  });
