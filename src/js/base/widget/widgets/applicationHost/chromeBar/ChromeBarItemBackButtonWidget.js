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

modulum('ChromeBarItemBackButtonWidget', ['ButtonWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * About button in ChromeBar
     * @class ChromeBarItemBackButtonWidget
     * @memberOf classes
     * @extends classes.ButtonWidget
     */
    cls.ChromeBarItemBackButtonWidget = context.oo.Class(cls.ButtonWidget, function($super) {
      return /** @lends classes.ChromeBarItemAboutWidget.prototype */ {
        __name: "ChromeBarItemBackButtonWidget",

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setTitle(i18next.t('gwc.main.chromebar.backButton'));
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this.setAcceptEventWhenWindowInactive(true);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          context.SessionService.getCurrent().getNavigationManager().goBackToLastActiveWindow();
          return false;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ChromeBarItemBackButton', cls.ChromeBarItemBackButtonWidget);
  });
