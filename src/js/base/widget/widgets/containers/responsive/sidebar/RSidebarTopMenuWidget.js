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

modulum('RSidebarTopMenuWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * TopMenu widget.
     * @class RSidebarTopMenuWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc Widgets
     */
    cls.RSidebarTopMenuWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.RSidebarTopMenuWidget.prototype */ {
        __name: 'RSidebarTopMenuWidget',

        _topMenuList: null,

        _levelList: null,
        _removedList: null,

        _backButton: null,
        _closeButton: null,
        _panelsElem: null,
        _titleElem: null,

        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._topMenuList = {};
        },

        _initElement: function() {
          $super._initElement.call(this);
          this._backButton = this._element.querySelector(".back-button");
          this._closeButton = this._element.querySelector(".close-button");
          this._panelsElem = this._element.querySelector(".panels");
          this._titleElem = this._element.querySelector(".title");
        },
        _initContainerElement: function() {
          $super._initContainerElement.call(this);
          this._levelList = [this.getContainerElement()];
          this._removedList = [];
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          // Click on back button
          if (domEvent.target === this._backButton || domEvent.target === this._backButton.querySelector("i")) {
            this.displayPrev();
          }
          // Click on close button
          if (domEvent.target === this._closeButton) {
            this.displayFirst();

            context.HostLeftSidebarService.showTopMenu(false);
          }

          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * Display previous item
         */
        displayPrev: function() {
          const removedElem = this._levelList.pop();
          this._panelsElem.removeChild(removedElem);

          if (removedElem && this._levelList.length > 0) {
            this._levelList.last().scrollIntoView();
            this.setTitle(this._levelList.last().getAttribute("data-title"));
            // hide/show backbutton
            this._backButton.toggleClass("unavailable", this._levelList.length <= 1);
          }
        },

        /**
         * Display next given item
         * @param {cls.WidgetBase} widget
         */
        displayNext: function(widget) {
          const nextElement = document.createElement("div");
          nextElement.setAttribute("data-parent", widget._auiTag);
          nextElement.setAttribute("data-title", widget.getText());
          nextElement.classList.add("slide");

          widget.getChildren().forEach(child => {
            nextElement.appendChild(child.getElement());
          });

          this.setTitle(widget.getText());
          this._panelsElem.appendChild(nextElement);
          this._levelList.push(nextElement);
          // show back button
          this._backButton.removeClass("unavailable");
          nextElement.scrollIntoView();
        },

        /**
         * Go to first level of menu
         */
        displayFirst: function() {
          if (this._levelList.length > 1) {
            this.displayPrev();
            this.displayFirst();
          }
        },

        /**
         * Check if first menu is displayed
         * @return {boolean} - true if first level is displayed
         */
        isFirstDisplayed: function() {
          return this._levelList.length === 1;
        },

        bindTopmenuWidget: function(topmenuwidget) {
          if (!this._topMenuList[topmenuwidget.getApplicationIdentifier()]) {
            this._topMenuList[topmenuwidget.getApplicationIdentifier()] = [];
          }
          this._topMenuList[topmenuwidget.getApplicationIdentifier()].push(topmenuwidget);
        },

        renderAppTopmenu: function(appHash) {
          // remove children from all top menu first
          this.getChildren().slice().forEach(child => {
            if (child._topMenuWidget) {
              child._topMenuWidget.adoptChildWidget(child);
            }
          });

          if (this._topMenuList[appHash]) {
            this._topMenuList[appHash].forEach(topmenu => {
              topmenu.getChildren().slice().forEach(child => this.adoptChildWidget(child));
            });
          }
        },
        /**
         * Choose where to render the topmenu
         * @param topmenuwidget
         * @param inSideBar
         */
        renderTopmenu: function(topmenuwidget, inSideBar) {
          const currentSession = gbc.SessionService.getCurrent();
          const currentApp = currentSession ? currentSession.getCurrentApplication().applicationHash : null;
          // get current app topmenus
          const appId = topmenuwidget.getApplicationIdentifier();

          // Not the app topmenu to render!
          if (currentApp !== appId) {
            return false;
          }

          //put back to correct tm
          this.getChildren().slice().forEach(child => {
            if (child._topMenuWidget) {
              child._topMenuWidget.adoptChildWidget(child);
            }
          });

          // display them
          if (inSideBar) { // put top menu children in sidebar
            this._topMenuList[appId].forEach((topmenu) => {
              topmenu.getChildren().slice().forEach((child) => {
                child._element.setAttribute("appId", appId);
                child.setHidden(topmenu.isHidden());
                this.adoptChildWidget(child);
              });
            });
          } else { // put sidebar children in topmenu
            this.getChildren().slice().forEach((child) => {
              topmenuwidget.adoptChildWidget(child);
            });
          }
          return this.getChildren().slice().length > 0;
        },

        setTitle: function(text) {
          this._titleElem.innerText = text;
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

        empty: function() {
          //"empty me"
        },

        destroy: function() {
          $super.destroy.call(this);
        },

      };
    });
    cls.WidgetFactory.registerBuilder('RSidebarTopMenu', cls.RSidebarTopMenuWidget);
  });
