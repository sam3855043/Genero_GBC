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

modulum('HighlightWidgetComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * Highlight Widget Component.
     * Manage the highlight css classes and variables
     * @class HighlightWidgetComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.HighlightWidgetComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {

      return /** @lends classes.HighlightWidgetComponent.prototype */ {
        __name: "HighlightWidgetComponent",

        $static: /** @lends classes.HighlightWidgetComponent */ {

          /**
           * @static
           */
          _highlightCurrentRowCssClass: 'gbc_highlightCurrentRow',

          /**
           * @static
           */
          _highlightCurrentCellCssClass: 'gbc_highlightCurrentCell',

          /**
           * @static
           */
          _defaultHighlightBackgroundColorCssVar: '--default-highlightBackgroundColor',
          /**
           * @static
           */
          _highlightBackgroundColorCssVar: '--highlightBackgroundColor',

          /**
           * @static
           */
          _defaultHighlightTextColorCssVar: '--default-highlightColor',
          /**
           * @static
           */
          _highlightTextColorCssVar: '--highlightColor',
        },

        /**
         * Controls current row highlighting
         * @private
         * @type {boolean}
         */
        _shouldHighlightCurrentRow: null,

        /**
         * Controls current cell highlighting
         * @private
         * @type {boolean} 
         */
        _shouldHighlightCurrentCell: null,

        /**
         * Defines the background color.
         * *Genero equivalent : highlightColor*
         * @private
         * @type {string} 
         */
        _highlightBackgroundColor: null,

        /**
         * Defines the text/foreground color.
         * *Genero equivalent : highlightTextColor*
         * @private
         * @type {string} 
         */
        _highlightTextColor: null,

        /**
         * @constructs
         * @inheritDoc
         */
        constructor: function(widget, shouldHighlightCurrentRow, shouldHighlightCurrentCell) {
          $super.constructor.call(this, widget);
        },

        /**
         * @returns The highlightCurrentRow value
         */
        getShouldHighlightCurrentRow: function() {
          return this._shouldHighlightCurrentRow;
        },

        /**
         * Apply the `highlightCurrentRow` css class to the HTML Element
         * Remove the `highlightCurrentCell` css class if the value is true, as `highlightCurrentRow` prevail on it.
         * But keep in memory `highlightCurrentCell` value 
         * @param {boolean} doHighlight True to highlight the current row. False otherwise
         */
        setShouldHighlightCurrentRow: function(doHighlight) {
          if (this.shouldHighlightCurrentRow === doHighlight) {
            return;
          }
          this._shouldHighlightCurrentRow = doHighlight;
          this.getWidget().toggleClass(cls.HighlightWidgetComponent._highlightCurrentRowCssClass, doHighlight);
        },

        /**
         * @returns Returns the highlightCurrentCell value
         */
        getShouldHighlightCurrentCell: function() {
          return this._shouldHighlightCurrentCell;
        },

        /**
         * Apply the `highlightCurrentCell` css class to the HTML Element
         * **IF** the `highlightCurrentRow` is false and the value is true.
         * Else, it remove the `highlightCurrentCell` class
         * @param {boolean} doHighlight True to highlight the current cell. False otherwise
         */
        setShouldHighlightCurrentCell: function(doHighlight) {
          if (this._shouldHighlightCurrentCell === doHighlight) {
            return;
          }
          this._shouldHighlightCurrentCell = doHighlight;
          this.getWidget().toggleClass(cls.HighlightWidgetComponent._highlightCurrentCellCssClass, doHighlight);
        },

        /**
         * @returns {string} Defines the highlight background color.
         * *Genero equivalent : highlightColor*
         */
        getHighlightBackgroundColor: function() {
          return this._highlightBackgroundColor;
        },

        /**
         * @param {string} color Store the highlight background color.
         * *Genero equivalent : highlightColor*
         */
        setHighlightBackgroundColor: function(color) {
          if (this._highlightBackgroundColor === color ||
            (this._highlightBackgroundColor === null && color === undefined)) {
            return;
          }

          this._highlightBackgroundColor = color;

          this.getWidget().setStyle({
            [cls.HighlightWidgetComponent._highlightBackgroundColorCssVar]: color
          });
        },

        /**
         * @returns {string} Defines the highlight foreground color.
         * *Genero equivalent : highlightTextColor*
         */
        getHighlightTextColor: function() {
          return this._highlightTextColor;
        },

        /**
         * @param {string} color Store the highlight foreground color.
         * *Genero equivalent : highlightTextColor*
         */
        setHighlightTextColor: function(color) {
          if (this._highlightTextColor === color ||
            (this._highlightTextColor === null && color === undefined)) {
            return;
          }

          this._highlightTextColor = color;

          this.getWidget().setStyle({
            [cls.HighlightWidgetComponent._highlightTextColorCssVar]: color
          });
        },
      };
    });
  }
);
