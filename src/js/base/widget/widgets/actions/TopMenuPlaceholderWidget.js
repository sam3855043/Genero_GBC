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

modulum('TopMenuPlaceholderWidget', ['WidgetPlaceholderBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TopMenuPlaceholderWidget widget.
     * @class TopMenuPlaceholderWidget
     * @memberOf classes
     * @extends classes.WidgetPlaceholderBase
     * @publicdoc Widgets
     */
    cls.TopMenuPlaceholderWidget = context.oo.Class(cls.WidgetPlaceholderBase, function($super) {
      return /** @lends classes.TopMenuPlaceholderWidget.prototype */ {
        __name: 'TopMenuPlaceholderWidget',

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
      };
    });
    cls.WidgetFactory.registerBuilder('TopMenuPlaceholder', cls.TopMenuPlaceholderWidget);
  });
