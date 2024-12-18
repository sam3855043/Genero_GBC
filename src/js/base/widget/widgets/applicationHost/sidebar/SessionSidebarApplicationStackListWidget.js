/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('SessionSidebarApplicationStackListWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionSidebarApplicationStackListWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.SessionSidebarApplicationStackListWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.SessionSidebarApplicationStackListWidget.prototype */ {
        __name: "SessionSidebarApplicationStackListWidget",

        /**
         * @type classes.WidgetBase
         */
        _currentElement: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this.emit(context.constants.widgetEvents.click);
          return false;
        },

        /**
         *
         * @param {classes.WidgetBase} widget
         */
        _addChildWidgetToDom: function(widget) {
          const itemHost = document.createElement('li');
          itemHost.addClass('mt-action');
          widget.getLayoutInformation().setHostElement(itemHost);
          this._containerElement.appendChild(itemHost);
          itemHost.appendChild(widget._element);
        },

        /**
         *
         * @param {classes.WidgetBase} widget
         */
        _removeChildWidgetFromDom: function(widget) {
          const info = widget.getLayoutInformation();
          let host = info && info.getHostElement();
          if (host && host.parentNode === this._containerElement) {
            widget._element.remove();
            host.remove();
            host = null;
          }
        },

        closeSidebar: function() {
          context.HostLeftSidebarService.hideSidebar();
        },

        /**
         * @inheritDoc
         */
        _afterInitElement: function() {
          $super._afterInitElement.call(this);

          if (!window.isMobile()) {
            this._containerElement.on('mouseover.SessionSidebarApplicationStackListWidget', this._onMouseover.bind(this));
          }
        },
        /**
         * Mouse over handler used to highlight current item.
         * @param event
         * @private
         */
        _onMouseover: function(event) {
          const element = event.target;
          if (element) {
            const widgetElement = element.hasClass("gbc_WidgetBase") ? element : element.parent("gbc_WidgetBase");
            if (widgetElement) {
              this.setCurrentElement(widgetElement);
            }
          }
        },

        /**
         * Define element as the current element of the list
         * @param {classes.WidgetBase} element
         */
        setCurrentElement: function(element) {
          if (this._currentElement) {
            this._currentElement.toggleClass("current", false);
          }

          this._currentElement = element;
          this._currentElement.toggleClass("current", true);
        }
      };
    });
    cls.WidgetFactory.registerBuilder("SessionSidebarApplicationStackList", cls.SessionSidebarApplicationStackListWidget);
  });
