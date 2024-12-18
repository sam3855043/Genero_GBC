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

modulum('RowAspectWidgetComponent', ['WidgetComponentBase'],
  function(context, cls) {

    /**
     * Row Aspect Widget Component
     * Manage the CSS variables and classes
     * @class RowAspectWidgetComponent
     * @memberOf classes
     * @extends classes.WidgetComponentBase
     * @publicdoc
     */
    cls.RowAspectWidgetComponent = context.oo.Class(cls.WidgetComponentBase, function($super) {

      return /** @lends classes.RowAspectWidgetComponent.prototype */ {
        __name: "RowAspectWidgetComponent",

        $static: /** @lends classes.RowAspectWidgetComponent */ {

          /**
           * @static
           * @param {string} value the rowAspect value
           * @returns The Css Class name
           */
          _getRowAspectClass: function(value) {
            return `gbc_rowAspect_${value.toLowerCase()}`;
          },

          /**
           * @static
           */
          rowAspectWasSetEventType: "rowAspectWasSet"
        },

        /** @type {?string} */
        _rowAspect: null,

        /**
         * @returns {string} The row aspec of the scroll grid
         */
        getRowAspect: function() {
          return this._rowAspect;
        },

        /**
         * @param {string} rowAspect Set the row aspect of the widget
         */
        setRowAspect: function(rowAspect) {
          if (rowAspect === null) {
            rowAspect = "default";
          }
          if (this._rowAspect !== rowAspect) {
            if (this.getRowAspect() !== null) {
              this.getWidget().removeClass(cls.RowAspectWidgetComponent._getRowAspectClass(this.getRowAspect()));
            }
            this._rowAspect = rowAspect;
            this.getWidget().addClass(cls.RowAspectWidgetComponent._getRowAspectClass(this.getRowAspect()));
          }
        },
      }; // End return
    }); // End Class
  } // JS Face Function
); // End Modulum
