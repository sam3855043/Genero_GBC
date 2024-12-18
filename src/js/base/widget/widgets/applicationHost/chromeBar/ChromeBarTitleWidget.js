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

modulum('ChromeBarTitleWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class ChromeBarTitleWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.ChromeBarTitleWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.ChromeBarTitleWidget.prototype */ {
        __name: "ChromeBarTitleWidget",
        _windowTitle: null,
        //_windowIcon: null,
        _listIcon: null,
        //_image: null,
        _visibility: true,

        _dropDownAvailable: false,
        _currentContent: null,
        /**
         * Dropdown widget which contains the current application stack
         * @type {classes.DropDownWidget}
         */
        _dropDown: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._windowTitle = this._element.getElementsByClassName("windowTitle")[0];

          this._listIcon = this._element.getElementsByClassName("windowListIcon")[0];

          this._dropDown = cls.WidgetFactory.createWidget('DropDown', this.getBuildParameters());
          this._dropDown.setParentWidget(this);

          this.setAcceptEventWhenWindowInactive(true);
        },

        onDropDownBeforeOpen: function(hook) {
          return this._dropDown.onBeforeOpen(hook);
        },

        onDropDownClose: function(hook) {
          return this._dropDown.onClose(hook);
        },

        /**
         *
         * @param {classes.WidgetBase} content
         */
        setDropDownContent: function(content) {
          if (this._currentContent) {
            this._dropDown.getElement().removeChild(this._currentContent.getElement());
            this._currentContent = null;
          }
          if (content) {
            this._currentContent = content;
            this._dropDown.getElement().appendChild(this._currentContent.getElement());

            this._currentContent.getChildren().forEach((application) => {
              application.getChildren().forEach((window) => {
                if (window.isVisible()) {
                  window.getElement().toggleClass("current", true);
                  this._currentContent.setCurrentElement(window.getElement());
                } else {
                  window.getElement().toggleClass("current", false);
                }
              });
            });
          }
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this.emit(context.constants.widgetEvents.click);
          if (this._dropDownAvailable) {
            this._dropDown.show();
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {

          if (this._dropDown) {
            this._dropDown.destroy();
            this._dropDown = null;
          }
          this._windowTitle = null;

          this._listIcon = null;
          $super.destroy.call(this);
        },

        setWindowTitle: function(text, app) {
          this._windowTitle.textContent = text;
          this._windowTitle.setAttribute("title", text);
          context.HostService.setDocumentTitle(text, app);
        },

        getWindowTitle: function() {
          return this._windowTitle.textContent;
        },

        setIcon: function(image) {
          //Design not definitively defined
          /*if (!this._image) {
            this._image = cls.WidgetFactory.createWidget("ImageWidget", this.getBuildParameters());
            this._windowIcon.prependChild(this._image.getElement());
          }
          this._image.setHidden(true);
          if (image && image !== "") {
            this._image.setSrc(image);
            this._image.setHidden(false);
          }*/
        },

        setListingVisibility: function(visibility) {
          this._visibility = visibility;
        },

        setListingVisible: function(visible) {
          visible = this._visibility && visible;
          this._dropDownAvailable = visible;
          this._listIcon.toggleClass("hidden", !visible);
        }
      };
    });
    cls.WidgetFactory.registerBuilder("ChromeBarTitle", cls.ChromeBarTitleWidget);
  });
