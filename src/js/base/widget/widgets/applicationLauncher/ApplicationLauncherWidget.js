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

modulum('ApplicationLauncherWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class ApplicationLauncherWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.ApplicationLauncherWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.ApplicationLauncherWidget.prototype */ {
        __name: "ApplicationLauncherWidget",

        /** @type {classes.ChromeBarWidget} **/
        _chromeBar: null,

        /**
         * @inheritDoc
         * @param opts
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);

          const chromeBarOpt = this.getBuildParameters();
          chromeBarOpt.lightmode = true;
          this._chromeBar = cls.WidgetFactory.createWidget("ChromeBar", chromeBarOpt);
          this._element.prependChild(this._chromeBar.getElement());
          this._chromeBar.setLightMode(true);

          const logoElement = this._element.getElementsByClassName("logo")[0];
          logoElement.setAttribute("src", context.ThemeService.getResource("img/logo.png"));
          logoElement.setAttribute("alt", "Genero Browser Client");

          // Display GBC version and build number
          const versionElement = this._element.getElementsByClassName("field_version")[0];
          versionElement.textContent = context.version;

          const buildElement = this._element.getElementsByClassName("field_build")[0];
          buildElement.textContent = context.build + (context.dirtyFlag || "");
        },

        /**
         * @inheritDoc
         * @param hidden
         */
        setHidden: function(hidden) {
          $super.setHidden.call(this, hidden);
          gbc.HostLeftSidebarService.enableSidebar(hidden);
        },

        /**
         * @inheritDoc
         * @param {classes.ApplicationHostWidget} widget
         * @param {Object=} options - possible options
         * @param {boolean=} options.noLayoutInvalidation - won't affect parent layout
         */
        setParentWidget: function(widget, options) {
          $super.setParentWidget.call(this, widget, options);
          gbc.HostLeftSidebarService.enableSidebar(!this.isVisible());
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ApplicationLauncher', cls.ApplicationLauncherWidget);
  });
