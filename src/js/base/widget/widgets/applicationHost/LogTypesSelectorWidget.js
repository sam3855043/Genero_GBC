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

modulum('LogTypesSelectorWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class LogTypesSelectorWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.LogTypesSelectorWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.LogTypesSelectorWidget.prototype */ {
        __name: "LogTypesSelectorWidget",

        /**
         * @type {Array<{name:string, label:string}>}
         */
        _types: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this.setTypes(context.LogService.getTypes());
          this.setCurrentTypes(context.LogService.getActiveLogTypes());
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (domEvent.target.dataset.logtype) {
            this.emit("logtype", domEvent.target.dataset.logtype);
          }
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         *
         * @param {Array<{name:string, label:string}>} types
         */
        setTypes: function(types) {
          this._types = types;
          this._element.empty();
          for (const element of types) {
            this._element.innerHTML += '<div data-logtype="' + element.name + '" class="active">' + element.label + '</div>';
          }
        },
        /**
         *
         * @param {Array<string>} types name of activated loggers
         */
        setCurrentTypes: function(types) {
          const matcher = function(val) {
            return function(i) {
              return i === val;
            };
          };
          for (const element of this._types) {
            const val = element.name,
              item = this._element.querySelector('[data-logtype="' + val + '"]');
            if (item) {
              item.toggleClass("active", !types || Boolean(types.find(matcher(val))));
            }
          }
        }
      };
    });
    cls.WidgetFactory.registerBuilder('LogTypesSelector', cls.LogTypesSelectorWidget);
  });
