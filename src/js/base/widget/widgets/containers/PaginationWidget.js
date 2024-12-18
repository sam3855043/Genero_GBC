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

modulum('PaginationWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Pagination buttons for a specified range
     * @class PaginationWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     * @publicdoc
     */
    cls.PaginationWidget = context.oo.Class(cls.WidgetBase, function($super) {

      return /** @lends classes.PaginationWidget.prototype */ {
        __name: "PaginationWidget",

        /** @type {number} */
        _pageSize: 0,
        /** @type {number} */
        _size: 0,
        /** @type {number} */
        _offset: 0,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._navigationPrevPage = this._element.children[0];
          this._navigationNextPage = this._element.children[1];
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (domEvent.target === this._navigationPrevPage) {
            this._navigatePrevPage();
            return false;
          } else if (domEvent.target === this._navigationNextPage) {
            this._navigateNextPage();
            return false;
          } else if (domEvent.target.hasClass("navbutton")) {
            this._navigatePage(parseInt(domEvent.target.getAttribute("index")), domEvent);
            return false;
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._clearNavigationButtons();
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          // No layout used
        },

        /**
         * Updates the pagination content
         */
        _update: function() {
          let i;
          if (this._pageSize === 0) {
            // not initialized yet
            this._navigationPrevPage.toggleClass('disabled', false);
            this._navigationNextPage.toggleClass('disabled', false);
            return;
          }
          this._clearNavigationButtons();
          const pageCount = Math.ceil(this._size / this._pageSize);
          const current = Math.floor(this._offset / this._pageSize);
          if (pageCount <= 10) {
            for (i = 0; i < pageCount; ++i) {
              this._createNavigationButton(i, current);
            }
          } else {
            const maxButtons = 3;
            this._createNavigationButton(0, current);
            if (current < maxButtons - 1) {
              for (i = 1; i < maxButtons; ++i) {
                this._createNavigationButton(i, current);
              }
              this._createNavigationEllipsis();
            } else if (current > pageCount - maxButtons) {
              this._createNavigationEllipsis();
              for (i = pageCount - maxButtons - 1; i < pageCount - 1; ++i) {
                this._createNavigationButton(i, current);
              }
            } else {
              this._createNavigationEllipsis();
              const n = Math.floor(maxButtons / 2);
              for (i = current - n; i <= current + n; ++i) {
                this._createNavigationButton(i, current);
              }
              this._createNavigationEllipsis();
            }
            this._createNavigationButton(pageCount - 1, current);
          }
          this._navigationPrevPage.toggleClass('disabled', current === 0);
          this._navigationNextPage.toggleClass('disabled', current === pageCount - 1);
        },

        /**
         * Add a navigation button with index inside
         * @param {number} index - page linked to this button
         * @param {number} current - current page
         * @private
         */
        _createNavigationButton: function(index, current) {
          const span = document.createElement('span');
          span.addClass("navbutton");
          span.setAttribute("index", index);
          span.textContent = "" + (index + 1);
          if (index === current) {
            span.addClass('current');
          }
          this._element.insertBefore(span, this._navigationNextPage);
        },

        /**
         * Add ellipsis (...) to the navigation bar
         * @private
         */
        _createNavigationEllipsis: function() {
          const span = document.createElement('span');
          span.textContent = '\u2026';
          this._element.insertBefore(span, this._navigationNextPage);
        },

        /**
         * Handler to switch to previous page
         * @param {Object} event - DOM event
         */
        _navigatePrevPage: function(event) {
          if (!this._navigationPrevPage.hasClass('disabled')) {
            const offset = Math.max(0, this._offset - this._pageSize);
            this.getParentWidget().emit(context.constants.widgetEvents.offset, offset);
          }
        },

        /**
         * Handler to switch to next page
         * @param {Object} event - DOM event
         */
        _navigateNextPage: function(event) {
          if (!this._navigationNextPage.hasClass('disabled')) {
            const maxOffset = Math.floor(this._size / this._pageSize) * this._pageSize;
            const offset = Math.min(maxOffset, this._offset + this._pageSize);
            this.getParentWidget().emit(context.constants.widgetEvents.offset, offset);
          }
        },

        /**
         * Handler to switch to a given page
         * @param {number} index - page number to switch to
         * @param {Object} event - DOM event
         */
        _navigatePage: function(index, event) {
          const offset = index * this._pageSize;
          this.getParentWidget().emit(context.constants.widgetEvents.offset, offset);
        },

        /**
         * Unregister all navigation callbacks
         * @private
         */
        _clearNavigationButtons: function() {
          const children = this._element.children;
          while (children.length > 2) {
            // Remove ellipsis
            this._element.removeChild(children[1]);
          }
        },

        /**
         * @param {number} size - size of the dataset
         * @param {number} pageSize - viewport size
         * @param {number} offset - viewport offset
         */
        update: function(size, pageSize, offset) {
          this._size = size;
          this._pageSize = pageSize;
          this._offset = offset;
          this._update();
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Pagination', cls.PaginationWidget);
  });
