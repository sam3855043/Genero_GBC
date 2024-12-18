/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ChromeBarItemWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Item to add to the topbar (Use as a base class as well for GBC items)
     * @class ChromeBarItemWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.ChromeBarItemWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.ChromeBarItemWidget.prototype */ {
        __name: "ChromeBarItemWidget",

        /** @type {classes.ImageWidget} */
        _image: null,
        /** @type {Element} */
        _textElement: null,
        /** @type {Element} */
        _imageContainer: null,
        /** @type {string} */
        _itemType: "",

        /** @function */
        _afterLayoutHandler: null,

        /** @type {string|null} */
        _defaultTTFColor: null,

        /** @type {boolean} */
        _forceOverflow: false,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.ChromeBarItemLayoutEngine(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function(initialInformation) {
          $super._initElement.call(this, initialInformation);
          this._textElement = this._element.getElementsByTagName('span')[0];
          this._imageContainer = this._element.getElementsByClassName('gbc_imageContainer')[0];
        },

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this.setItemType("item"); // item type by default (could be item or gbcItem)
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          // Click on any item should close the right bar
          if (this.getParentWidget()) {
            if (this.getParentWidget().closeRightBar) {
              this.getParentWidget().closeRightBar();
            } else {
              this.getParentWidget().hide();
            }
          }
          this.emit(context.constants.widgetEvents.click, domEvent);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this.isEnabled()) {
            if (keyString === "space" || keyString === "enter" || keyString === "return") {
              this.emit(context.constants.widgetEvents.click, domKeyEvent);
              keyProcessed = true;
            }
          }

          if (keyProcessed) {
            return true;
          } else {
            return $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          this._defaultTTFColor = color;
          this.setStyle(".zmdi", {
            'color': color
          });
        },

        /**
         * Set the text of the chromebar item
         * @param {string} text - the text
         * @publicdoc
         */
        setText: function(text) {
          this._setTextContent(text, "_textElement");
          this._layoutEngine.invalidateMeasure();
          this._layoutEngine.forceMeasurement();
          if (gbc.qaMode && ['qa_dialog_ready', 'qa_menu_ready'].indexOf(text) >= 0) {
            gbc.QAService.bindQAReadyButton(this);
          }
        },

        /**
         * Get the text of the chromebar item
         * @return {?string}
         */
        getText: function() {
          return this._textElement ? this._textElement.textContent : null;
        },

        /**
         * Define the chromebar item image
         * @param {string} image - image url to use
         * @publicdoc
         */
        setImage: function(image) {
          if (image && image.length !== 0) {
            this.addClass("hasImage");
            if (!this._image) {
              this._image = cls.WidgetFactory.createWidget(image.startsWith('zmdi-') ? 'GbcImage' : 'ImageWidget', this
                .getBuildParameters());
              this._imageContainer.appendChild(this._image.getElement());
            } else if (this._image.isInstanceOf(cls.GbcImageWidget) && !image.startsWith('zmdi-')) {
              // Case where image is override to be something else than zmdi
              this._image.destroy();
              this._image = null;
              this.setImage(image);
            }
            if (this._defaultTTFColor) {
              this._image.setDefaultColor(this._defaultTTFColor);
            }
            this._image.setSrc(image);
            this._image.toggleClass("svg", image.indexOf(".svg?") >= 0);
            this._image.setErrorHandler(function() {
              this._removeImage();
              //We are outside the GBC engine, so we must run the layout engine
              this.getApplicationWidget().layoutRequest();
            }.bind(this));
          } else if (this._image) {
            this._removeImage();
          }
          this._layoutEngine.invalidateMeasure();
        },

        /**
         * Remove the DOM image element
         * @private
         */
        _removeImage: function() {
          this.removeClass("hasImage");
          this._image.getElement().remove();
          this._image.destroy();
          this._image = null;

          this._layoutEngine.invalidateMeasure();
          this._layoutEngine.forceMeasurement();
        },

        /**
         * Get the chromebar item Image
         * @return {?string}
         */
        getImage: function() {
          return this._image ? this._image.getSrc() : null;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._image) {
            this._image.destroy();
            this._image = null;
          }
          if (this._afterLayoutHandler) {
            this._afterLayoutHandler();
            this._afterLayoutHandler = null;
          }
          $super.destroy.call(this);
        },

        /**
         * Get the item type
         * @return {string} the item type could be item (default) or gbcItem (for gbc Actions) or overflowItem (for item you want to be in overflow panel)
         */
        getItemType: function() {
          return this._itemType;
        },

        /**
         * True if the item can be an element of the right menu
         * @return {boolean}
         */
        canBeInTheOverFlowMenu: function() {
          return true;
        },

        /**
         * Set the item type
         * @param {string} type - the item type could be item (default) or gbcItem (for gbc Actions)
         */
        setItemType: function(type) {
          // GBC items are forced to flow if the theme says so
          if (type === "gbcItem" && context.ThemeService.getValue('gbc-ChromeBarWidget-flow-gbc-items')) {
            this.forceOverflow(true);
          }
          this._itemType = type;
          this.getElement().setAttribute("chromebar-itemtype", type);
        },

        /**
         * Force item to be in right sidebar
         * @param {Boolean} overflow - true to put it in right sidebar, false otherwise
         */
        forceOverflow: function(overflow) {
          this._forceOverflow = overflow;
        },

        /**
         * Get the forceOverflow status
         * @return {boolean} - true if forced to overflow, false otherwise
         */
        getForceOverflowStatus: function() {
          return this._forceOverflow;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ChromeBarItem', cls.ChromeBarItemWidget);
  });
