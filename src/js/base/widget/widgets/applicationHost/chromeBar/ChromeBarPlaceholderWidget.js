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

modulum('ChromeBarPlaceholderWidget', ['WidgetPlaceholderBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * ChromeBarPlaceholderWidget widget.
     * @class TopMenuPlaceholderWidget
     * @memberOf classes
     * @extends classes.WidgetPlaceholderBase
     * @publicdoc Widgets
     */
    cls.ChromeBarPlaceholderWidget = context.oo.Class(cls.WidgetPlaceholderBase, function($super) {
      return /** @lends classes.ChromeBarPlaceholderWidget.prototype */ {
        __name: 'ChromeBarPlaceholderWidget',

        /** @type {string} */
        _itemType: "",

        /** @type {boolean} */
        _forceOverflow: false,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setItemType("item"); // item type by default (could be item or gbcItem)
        },

        /**
         * @inheritDoc
         */
        _initElement: function(initialInformation) {
          $super._initElement.call(this, initialInformation);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
        },

        /**
         * Get the item type
         * @return {string} the item type could be item (default) or gbcItem (for gbc Actions) or overflowItem (for item you want to be in overflow panel)
         */
        getItemType: function() {
          return this._itemType;
        },

        /**
         * Set the item type
         * @param {string} type - the item type could be item (default) or gbcItem (for gbc Actions)
         */
        setItemType: function(type) {
          // GBC items are forced to flow if the theme says so
          if (type === "gbcItem" && context.ThemeService.getValue('gbc-ChromeBarWidget-flow-gbc-items')) {
            this.forceOverflow(true);
          }
          this._itemType = type;
          this.getElement().setAttribute("chromebar-itemtype", type);
        },

        /**
         * Force item to be in right sidebar
         * @param {Boolean} overflow - true to put it in right sidebar, false otherwise
         */
        forceOverflow: function(overflow) {
          this._forceOverflow = overflow;
        },

        /**
         * Get the forceOverflow status
         * @return {boolean} - true if forced to overflow, false otherwise
         */
        getForceOverflowStatus: function() {
          return this._forceOverflow;
        },

        /**
         * True if the item can be an element of the right menu
         * @return {boolean}
         */
        canBeInTheOverFlowMenu: function() {
          return true;
        },

        /**
         * @inheritDoc
         */
        applyCommonStyleToWidget: function(widget) {}
      };
    });
    cls.WidgetFactory.registerBuilder('ChromeBarPlaceholder', cls.ChromeBarPlaceholderWidget);
  });
