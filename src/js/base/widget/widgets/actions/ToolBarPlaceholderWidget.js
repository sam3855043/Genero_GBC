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

modulum('ToolBarPlaceholderWidget', ['WidgetPlaceholderBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * ToolBarPlaceholderWidget widget.
     * @class ToolBarPlaceholderWidget
     * @memberOf classes
     * @extends classes.WidgetPlaceholderBase
     * @publicdoc Widgets
     */
    cls.ToolBarPlaceholderWidget = context.oo.Class(cls.WidgetPlaceholderBase, function($super) {
      return /** @lends classes.ToolBarPlaceholderWidget.prototype */ {
        __name: 'ToolBarPlaceholderWidget',

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        _initElement: function(initialInformation) {
          this._ignoreLayout = true;
          $super._initElement.call(this, initialInformation);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
        },

        /**
         * Define autoScale or not for this item
         * @param {boolean} enabled autoscale state
         * @publicdoc
         */
        setAutoScale: function(enabled) {
          this._appliedStyle.set('setAutoScale', enabled);
          this._children.forEach((info) => {
            if (info.widget.setAutoScale) {
              info.widget.setAutoScale(enabled);
            }
          });
        },

        /**
         * Set autoscale value as nnnpx
         * @param {string} value - css string value with valid units
         * @publicdoc
         */
        setScaleIconValue: function(value) {
          this._appliedStyle.set('setScaleIconValue', value);
          this._children.forEach((info) => {
            if (info.widget.setScaleIconValue) {
              info.widget.setScaleIconValue(value);
            }
          });
        },
      };
    });
    cls.WidgetFactory.registerBuilder('ToolBarPlaceholder', cls.ToolBarPlaceholderWidget);
  });
