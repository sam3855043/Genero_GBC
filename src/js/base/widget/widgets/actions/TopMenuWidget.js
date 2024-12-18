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

modulum('TopMenuWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TopMenu widget.
     * @class TopMenuWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc Widgets
     */
    cls.TopMenuWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.TopMenuWidget.prototype */ {
        __name: 'TopMenuWidget',

        /** @type {Boolean} */
        _allowInSidebar: true,
        _renderedInSidebar: false,
        _responsiveMenuWidget: false,
        /** @type {Boolean} */
        _globalTopmenu: false,

        _renderInSidebar: false,

        /** @type {Boolean} */
        _isStartMenu: false,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          context.TopmenuService.addTopMenu(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._responsiveMenuWidget = context.HostLeftSidebarService.getResponsiveMenu();
          this._responsiveMenuWidget.bindTopmenuWidget(this); //attach to responsive one
          this.render(this._renderedInSidebar);
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          $super.addChildWidget.call(this, widget, options);
          if (this._renderedInSidebar) {
            this._responsiveMenuWidget.adoptChildWidget(widget);
          }
        },

        /**
         * Define this topMenu as global one
         * @param {Boolean} isGlobal - true to set as global TM
         */
        setGlobal: function(isGlobal) {
          this._globalTopmenu = isGlobal;
        },

        /**
         * Check if TM is set as Global
         * @return {Boolean} true if global, false otherwise
         */
        isGlobal: function() {
          return this._globalTopmenu;
        },

        /**
         * Define the topmenu to be rendered in sidebar or not
         */
        setRenderInSideBar: function() {
          if (this.isStartMenu()) {
            return;
          }
          this._renderInSidebar = true;
          this.render({
            hidden: this.isHidden()
          });
        },

        /**
         * Set Topmenu as startMenu
         * @param {Boolean} isStartMenu - true to set it as startmenu
         */
        setIsStartMenu: function(isStartMenu) {
          this._isStartMenu = isStartMenu;
        },

        /**
         * Check if Topmenu is a StartMenu
         * @return {boolean} - true if is a StartMenu
         */
        isStartMenu: function() {
          return this._isStartMenu;
        },

        /**
         * Set the rendering of this topmenu
         */
        render: function(options = {}) {
          if (!this._renderInSidebar) {
            // not in sidebar:move or keep children in normal topmenu and close the sidebar
            gbc.HostLeftSidebarService.hideSidebar();
          } else {
            if ("hidden" in options) {
              this.setHidden(options.hidden);
            }
          }

          this._renderedInSidebar = this._responsiveMenuWidget.renderTopmenu(this, this._renderInSidebar);
          gbc.HostLeftSidebarService.setHasTopMenu(true, this._renderedInSidebar);
        },

        /**
         * Check if rendered in sidebar
         * @return {Boolean} - true if is in sidebar
         */
        isRenderedInSidebar: function() {
          return this._renderedInSidebar;
        },

        /**
         * Priority of this menu
         * @param {number} order the priority of this menu
         * @publicdoc
         */
        setOrder: function(order) {
          this.setStyle({
            order: order
          });
        },

        /**
         * Get priority of this menu
         * @returns {number} priority of this menu
         * @publicdoc
         */
        getOrder: function() {
          return this.getStyle('order');
        },

        /**
         * Get previous topmenugroup located at same level that refMenu
         * @param {classes.TopMenuGroupWidget} refMenu - topmenugroup used as search criteria
         * @returns {classes.TopMenuGroupWidget} returns previous topmenugroup
         * @publicdoc
         */
        getPreviousMenu: function(refMenu) {
          return this.getChildren()[this.getIndexOfChild(refMenu) - 1];
        },

        /**
         * Get next topmenugroup located at same level that refMenu
         * @param {classes.TopMenuGroupWidget} refMenu - topmenugroup used as search criteria
         * @returns {classes.TopMenuGroupWidget} returns next topmenugroup
         * @publicdoc
         */
        getNextMenu: function(refMenu) {
          return this.getChildren()[this.getIndexOfChild(refMenu) + 1];
        },

        destroy: function() {
          context.TopmenuService.removeTopmenu(this);
          this._responsiveMenuWidget.empty();
          $super.destroy.call(this);
        },
      };
    });
    cls.WidgetFactory.registerBuilder('TopMenu', cls.TopMenuWidget);
  });
