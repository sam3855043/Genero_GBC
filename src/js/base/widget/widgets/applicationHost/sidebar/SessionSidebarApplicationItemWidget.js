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

modulum('SessionSidebarApplicationItemWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionSidebarApplicationItemWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.SessionSidebarApplicationItemWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.SessionSidebarApplicationItemWidget.prototype */ {
        __name: "SessionSidebarApplicationItemWidget",
        _applicationName: null,
        _applicationIconImage: null,
        /**
         * @type {classes.ApplicationWidget}
         */
        _applicationWidget: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._applicationName = this._element.getElementsByClassName("applicationName")[0];
          this.setAcceptEventWhenWindowInactive(true);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this.emit(context.constants.widgetEvents.click);
          return false;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._applicationWidget = null;
          if (this._applicationIconImage) {
            this._applicationIconImage.destroy();
            this._applicationIconImage = null;
          }
          this._applicationName = null;
          $super.destroy.call(this);
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
        setApplicationName: function(text) {
          this._applicationName.textContent = text;
          this._applicationName.setAttribute("title", text);
        },
        getApplicationName: function() {
          return this._applicationName.textContent;
        },
        setApplicationWidget: function(widget) {
          this._applicationWidget = widget;
        },
        setApplicationIcon: function(image) {
          if (!this._applicationIconImage) {
            this._applicationIconImage = cls.WidgetFactory.createWidget("ImageWidget", this.getBuildParameters());
            this._element.getElementsByClassName("applicationIcon")[0].prependChild(this._applicationIconImage.getElement());
          }
          this._applicationIconImage.setHidden(true);
          if (image && image !== "") {
            this._applicationIconImage.setSrc(image);
            this._applicationIconImage.setHidden(false);
            context.HostService.setCurrentIcon(image, true);
          }
        },
        closeSidebar: function() {
          context.HostLeftSidebarService.hideSidebar();
        },
        unfreeze: function() {

        },
        freeze: function() {

        },
        setProcessing: function(isProcessing) {
          if (isProcessing) {
            this.domAttributesMutator(() => this.getElement().setAttribute("processing", "processing"));
          } else {
            this.domAttributesMutator(() => this.getElement().removeAttribute("processing"));
          }
        }
      };
    });
    cls.WidgetFactory.registerBuilder('SessionSidebarApplicationItem', cls.SessionSidebarApplicationItemWidget);
  });
