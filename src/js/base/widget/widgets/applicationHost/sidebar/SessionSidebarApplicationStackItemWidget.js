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

modulum('SessionSidebarApplicationStackItemWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionSidebarApplicationStackItemWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.SessionSidebarApplicationStackItemWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.SessionSidebarApplicationStackItemWidget.prototype */ {
        __name: "SessionSidebarApplicationStackItemWidget",
        _title: null,
        _icon: null,
        _image: null,

        /**
         * @type {Map<String, classes.WidgetBase>}
         */
        _virtualWidgetList: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._virtualWidgetList = new Map();
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._title = this._element.getElementsByClassName("applicationStackTitle")[0];
          this._icon = this._element.getElementsByClassName("applicationStackIcon")[0];
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
          if (this._virtualWidgetList.length > 0) {
            context.LogService.warn("Virtual widget list not empty for " + this.__name);
          }

          if (this._image) {
            this._image.destroy();
            this._image = null;
          }
          this._title = null;
          this._icon = null;
          $super.destroy.call(this);
        },

        /**
         * Set the tooltip of item in the sidebar
         * @param {String?} title - title of the app, null to remove
         */
        setApplicationTitle: function(title) {
          this._title.textContent = title;
          this._title.setAttribute("title", title);
          if (this._image) {
            this._image.setTitle(title);
          }
          this.addClass("has-title");

          this._virtualWidgetList.forEach((widget) => {
            widget.setText(title);
          });
        },

        getTitle: function() {
          return this._title.textContent;
        },

        setVisible: function(visible) {
          this._element.toggleClass("visible", visible);
          if (visible) {
            this._element.scrollIntoView();
          }
        },

        setIcon: function(image) {
          if (!this._image) {
            this._image = cls.WidgetFactory.createWidget("ImageWidget", this.getBuildParameters());
            this._image.setAcceptEventWhenWindowInactive(true);
            this._icon.prependChild(this._image.getElement());
          }
          this._image.setHidden(true);
          if (image && image !== "") {
            this._image.setSrc(image);
            this._image.setAutoScale(true);
            this._image.setHidden(false);
            this._image.setTitle(this.getTitle());
            this.addClass("has-icon");

            this._virtualWidgetList.forEach((widget) => {
              widget.setImage(image);
            });
          }
        },

        closeSidebar: function() {
          context.HostLeftSidebarService.hideSidebar();
        },

        /**
         * Get the image URL
         * @returns {null|string} the URL of the displayed image or a font-image URL: font:[fontname]:[character]:[color]
         */
        getIcon: function() {
          if (!this._image) {
            return null;
          }

          return this._image.getImage();
        },

        /**
         * Add an virtual widget
         * @param {classes.WidgetBase} widget
         */
        addVirtualChildWidget: function(widget) {
          this._virtualWidgetList.set(widget.getUniqueIdentifier(), widget);
        },

        /**
         * Remove the virtual widget
         * @param {classes.WidgetBase} widget
         */
        removeVirtualChildWidget: function(widget) {
          this._virtualWidgetList.delete(widget.getUniqueIdentifier());
        },
      };
    });
    cls.WidgetFactory.registerBuilder("SessionSidebarApplicationStackItem", cls.SessionSidebarApplicationStackItemWidget);
  });
