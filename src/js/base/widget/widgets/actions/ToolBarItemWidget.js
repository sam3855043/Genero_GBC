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

modulum('ToolBarItemWidget', ['TextWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * ToolBarItem widget.
     * @class ToolBarItemWidget
     * @memberOf classes
     * @extends classes.TextWidgetBase
     * @publicdoc
     */
    cls.ToolBarItemWidget = context.oo.Class(cls.TextWidgetBase, function($super) {
      return /** @lends classes.ToolBarItemWidget.prototype */ {
        __name: 'ToolBarItemWidget',

        /** @type {HTMLElement} */
        _textElement: null,
        /** @type {classes.ImageWidget} */
        _image: null,
        /** @type {HTMLElement} */
        _imageContainer: null,
        /** @type {boolean} */
        _autoScale: false,
        /** @type {string|null} */
        _defaultTTFColor: null,

        /**
         * @inheritDoc
         */
        _initElement: function(initialInformation) {
          this._ignoreLayout = true;
          $super._initElement.call(this, initialInformation);
          this._textElement = this._element.getElementsByTagName('span')[0];
          this._imageContainer = this._element.getElementsByClassName('gbc_imageContainer')[0];
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.FlowItemLayoutEngine(this);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._image) {
            this._image.destroy();
            this._image = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this.emit(context.constants.widgetEvents.click);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          this._defaultTTFColor = color;
          if (this._image) {
            this._image.setDefaultColor(color);
          }
        },

        /**
         * Set the text of the toolbar item
         * @param {string} text the text
         * @publicdoc
         */
        setText: function(text) {
          this._hasText = text.length > 0;
          this.toggleClass("hasText", this._hasText);
          this._setTextContent(text, "_textElement");
        },

        /**
         * Get the text of the toolbar item
         * @return {string} the text of the item
         * @publicdoc
         */
        getText: function() {
          return this._textElement.textContent;
        },

        /**
         * Define the toolbar item image
         * @param {string} image - image url to use
         * @publicdoc
         */
        setImage: function(image) {
          if (image.length !== 0) {
            if (!this._image) {
              this._image = cls.WidgetFactory.createWidget('ImageWidget', this.getBuildParameters());
              this._imageContainer.appendChild(this._image.getElement());
              this.setAutoScale(this._autoScale);
              this.setDefaultTTFColor(this._defaultTTFColor);
            }
            this._image.setSrc(image);
          } else if (this._image) {
            this._image.getElement().remove();
            this._image.destroy();
            this._image = null;
          }
          this.toggleClass("hasImage", !!this._image);
        },

        /**
         * Get image of the toolbar item
         * @return {?string} - source of the image, null if not set
         * @publicdoc
         */
        getImage: function() {
          if (this._image) {
            return this._image.getSrc();
          }
          return null;
        },

        /**
         * Define autoScale or not for this item
         * @param {boolean} enabled autoscale state
         * @publicdoc
         */
        setAutoScale: function(enabled) {
          this._autoScale = enabled;
          if (this._image) {
            this._image.setAutoScale(this._autoScale);
          }
          this._imageContainer.toggleClass('gbc_autoScale', this._autoScale);
        },

        setScaleIconValue: function(value) {
          if (this._image) {
            this._image.setScaleIconValue(value);
          }
        },

        /**
         * Set the title to appear as tooltip
         * @param {string} title - tooltip text
         * @publicdoc
         */
        setTitle: function(title) {
          this._element.setAttribute('title', title);
        },

        /**
         * Get the title to appear as tooltip
         * @return {string} the title
         * @publicdoc
         */
        getTitle: function() {
          return this._element.getAttribute('title');
        },
      };
    });
    cls.WidgetFactory.registerBuilder('ToolBarItem', cls.ToolBarItemWidget);
  });
