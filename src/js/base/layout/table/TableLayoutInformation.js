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

modulum('TableLayoutInformation', ['LayoutInformation'],
  function(context, cls) {
    /**
     * @class TableLayoutInformation
     * @memberOf classes
     * @extends classes.LayoutInformation
     */
    cls.TableLayoutInformation = context.oo.Class(cls.LayoutInformation, function($super) {
      return /** @lends classes.TableLayoutInformation.prototype */ {
        __name: "TableLayoutInformation",

        /**
         * @type {number}
         */
        _rowHeight: 0,
        /**
         * @type {number}
         */
        _rowDecorationHeight: 0,

        /**
         * @type {number}
         */
        _rowBoundWidth: 0,

        /**
         *
         * @param {classes.WidgetBase} widget
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
        },

        /**
         * @inheritDoc
         */
        reset: function(soft) {
          $super.reset.call(this, soft);
        },

        // #region getter/setter

        /**
         * The row height computed from the row children height values
         * @returns {number}
         */
        getRowHeight: function() {
          return this._rowHeight;
        },
        /**
         * The row height computed from the row children height values
         * @param {number} height The computed height of the children
         */
        setRowHeight: function(height) {
          this._rowHeight = height;
        },

        /**
         * The row height + the decoration
         * @returns {number}
         */
        getDecoratedRowHeight: function() {
          return this._rowHeight + this._rowDecorationHeight;
        },

        /**
         * The decoration height of the row
         * computed from an empty row
         * @returns {number}
         */
        getRowDecorationHeight: function() {
          return this._rowDecorationHeight;
        },
        /**
         * Set the decoration Height of the row, without margin (padding + border)
         * @param {number} height The decoration height of the row
         */
        setRowDecorationHeight: function(height) {
          this._rowDecorationHeight = height;
        },
        // #endregion

        setRowBoundWidth: function(width) {
          this._rowBoundWidth = width;
        },

        getRowBoundWidth: function() {
          return this._rowBoundWidth;
        }
      };
    });
  });
