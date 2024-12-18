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

modulum('ApplicationInformationWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class ApplicationInformationWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.ApplicationInformationWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.ApplicationInformationWidget.prototype */ {
        __name: "ApplicationInformationWidget",
        /**
         * @type Element
         */
        _currentUARElement: null,
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._currentUARElement = this._element.getElementsByClassName("applicationUAR")[0];
        },
        _initLayout: function() {
          // no layout
        },
        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (domEvent.target === this._currentUARElement) {
            this._currentUARElement.selectText();
            return false;
          }
          return $super.manageMouseClick.call(this, domEvent);
        },
        getCurrentUAR: function() {
          return this._currentUARElement.value;
        },
        setCurrentUAR: function(uar) {
          this._currentUARElement.value = uar;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ApplicationInformation', cls.ApplicationInformationWidget);
  });
