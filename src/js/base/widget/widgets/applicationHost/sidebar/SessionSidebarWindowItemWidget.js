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

modulum('SessionSidebarWindowItemWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionSidebarWindowItemWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.SessionSidebarWindowItemWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.SessionSidebarWindowItemWidget.prototype */ {
        __name: "SessionSidebarWindowItemWidget",

        /** @type {Element} */
        _windowNameElement: null,
        /** @type {classes.ImageWidget} */
        _windowIconImage: null,
        /** @type {classes.WindowWidget} */
        _windowWidget: null,

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
          this._windowNameElement = this._element.getElementsByClassName("windowName")[0];

          this._windowIconImage = cls.WidgetFactory.createWidget("ImageWidget", this.getBuildParameters());
          this._windowIconImage.setAutoScale(true);
          this._element.getElementsByClassName("windowIcon")[0].prependChild(this._windowIconImage.getElement());

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
          this._windowWidget = null;
          this._windowNameElement = null;
          if (this._windowIconImage) {
            this._windowIconImage.destroy();
            this._windowIconImage = null;
          }

          $super.destroy.call(this);
        },

        /**
         * Set window's name
         * @param {String} name - window's name
         * @publicdoc
         */
        setWindowName: function(name) {
          this._windowNameElement.textContent = name;
          this._windowNameElement.setAttribute("title", name);

          this._virtualWidgetList.forEach((widget) => {
            widget.setText(name);
          });
        },

        /**
         * Get window's name
         * @return {string} window's name
         * @publicdoc
         */
        getWindowName: function() {
          return this._windowNameElement.textContent;
        },

        /**
         * Change the image icon
         * @param {String} image - image path
         * @publicdoc
         */
        setWindowIcon: function(image) {
          if (image && image !== "") {
            this._windowIconImage.setSrc(image);

            this._virtualWidgetList.forEach((widget) => {
              widget.setImage(image);
            });
          }
        },

        /**
         * Set the corresponding window widget
         * @param {classes.WindowWidget} widget - window
         */
        setWindowWidget: function(widget) {
          this._windowWidget = widget;
        },

        /**
         * Set window froze or not
         * @param {boolean} frozen - true if window is frozen
         */
        setFrozen: function(frozen) {
          this._element.toggleClass("frozenWindow", Boolean(frozen));
        },

        /**
         * Get the icon path
         * @return {string|null}
         */
        getWindowIcon: function() {
          if (this._windowIconImage && !this._windowIconImage.isHidden()) {
            return this._windowIconImage.getSrc();
          }

          return null;
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

        /**
         * True if this is the active window
         * @return {boolean}
         */
        isActive: function() {
          return this._element.hasClass("activeWindow");
        },

        /**
         * True if this is the visible window
         * @return {boolean}
         */
        isVisible: function() {
          return this._element.hasClass("visibleWindow");
        }

      };
    });
    cls.WidgetFactory.registerBuilder('SessionSidebarWindowItem', cls.SessionSidebarWindowItemWidget);
  });
