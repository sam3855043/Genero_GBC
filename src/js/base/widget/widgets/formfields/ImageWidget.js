/// FOURJS_START_COPYRIGHT(D,2015)
/// Property of Four Js*
/// (c) Copyright Four Js 2015, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

'use strict';

modulum('ImageWidget', ['ColoredWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Image widget.
     * @class ImageWidget
     * @memberOf classes
     * @extends classes.ColoredWidgetBase
     * @publicdoc Widgets
     */
    cls.ImageWidget = context.oo.Class(cls.ColoredWidgetBase, function($super) {
      return /** @lends classes.ImageWidget.prototype */ {
        __name: 'ImageWidget',
        /**
         * @type {?string}
         */
        _src: null,
        _defaultColor: null,
        /** @type {boolean} */
        _autoScale: false,
        /** @type {String|null} **/
        _scaleIconValue: null,

        /** @type {boolean} */
        _gotFirstInitialImage: false,
        /** @type {boolean} */
        _firstInitialSizing: true,
        /** @type {boolean} */
        _initialAutoscaling: false,
        /** @type {HTMLElement} */
        _img: null,
        /** @type {HTMLElement} */
        _border: null,
        /** @type {boolean} */
        _standalone: false,
        /** @type {boolean} */
        _hasContent: false,
        /** @type {Object} */
        _alignment: null,
        /** @type {number} */
        _rowIndex: -1,

        /**
         * Custom error handler called inside _onError
         * @type {function} */
        _onErrorHandler: null,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutInformation.shouldFillStack = true;
          this._layoutEngine = new cls.ImageLayoutEngine(this);
          this._layoutEngine._shouldFillHeight = true;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._border = null;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this._onRequestFocus(domEvent); // request focus
          this.emit(context.constants.widgetEvents.click, domEvent);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * @inheritDoc
         */
        manageMouseDblClick: function(domEvent) {
          // request Focus already done by singleClick
          this.emit(context.constants.widgetEvents.doubleClick, domEvent);
          return true;
        },

        /**
         * Define image as a regular standalone widget
         * @param {boolean} standalone - true if standalone, false otherwise
         */
        setStandaloneImage: function(standalone) {
          this._standalone = Boolean(standalone);
          this._element.toggleClass('gbc_withBorder', this._standalone);
          this._element.toggleClass('gbc_selfImage', this._standalone);
        },

        /**
         * If image has action, change cursor
         * @param {boolean} clickable - true if clickable, false otherwise
         * @publicdoc
         */
        setClickableImage: function(clickable) {
          if (clickable) {
            this.addClass('clickable');
          } else {
            this.removeClass('clickable');

          }
        },

        /**
         * ShortCut for setSrc
         * This is used in the context of an Image FormField
         * @param {string} val the URL of the image to display or a font-image URL: font:[fontname]:[character]:[color]
         * @see setSrc
         * @publicdoc
         */
        setValue: function(val) {
          this.setSrc(val);
        },

        /**
         * Shortcut for getSrc
         * This is used in the context of an Image FormField
         * @returns {string} the URL of the displayed image or a font-image URL: font:[fontname]:[character]:[color]
         * @see getSrc
         * @publicdoc
         */
        getValue: function() {
          return this.getSrc();
        },

        /**
         * ShortCut for setSrc
         * This is used in the context of a Static Image
         * @param {string} image the URL of the image to display or a font-image URL: font:[fontname]:[character]:[color]
         * @see setSrc
         * @publicdoc
         */
        setImage: function(image) {
          this.setSrc(image);
        },

        /**
         * Shortcut for getSrc
         * This is used in the context of a Static FormField
         * @returns {string} the URL of the displayed image or a font-image URL: font:[fontname]:[character]:[color]
         * @see getSrc
         * @publicdoc
         */
        getImage: function() {
          return this.getSrc();
        },

        /**
         * Check if image is a font image
         * @return {boolean} true if is a font image
         * @publicdoc
         */
        isFontImage: function() {
          if (this._src) {
            return this._src.startsWith('font:');
          } else {
            return false;
          }
        },

        /**
         * Set the source of the image file
         * @param {string} src the URL of the image to display or a font-image URL: font:[fontname]:[character]:[color]
         * @param {boolean?} directApply true to apply src directly (internal use)
         * @publicdoc
         */
        setSrc: function(src, directApply) {
          this.getLayoutInformation().invalidateMeasure();
          if (src !== this._src) {
            const old = this._src;
            const initial = this.getLayoutInformation().getSizePolicyConfig().isInitial();
            this._src = src;
            if (initial && src !== null) {
              if (this._gotFirstInitialImage && old !== null) {
                this._firstInitialSizing = false;
              }
              this._gotFirstInitialImage = true;
            }
            this._updateImage(directApply);
          }
          this.domAttributesMutator(function() {
            if (!this._destroyed && this._img && this.getTitle()) {
              this._img.setAttribute("alt", this.getTitle());
            }
          }.bind(this));
        },

        /**
         * Get the source of the image file
         * @returns {string} the URL of the displayed image or a font-image URL: font:[fontname]:[character]:[color]
         * @publicdoc
         */
        getSrc: function() {
          return this._src;
        },

        /**
         * @inheritDoc
         */
        setTitle: function(title) {
          $super.setTitle.call(this, title);
          if (this._img) {
            this._img.setAttribute('alt', title);
          }
        },

        /**
         * Define the image as stretchable
         * @param {boolean} stretch - true if stretchable
         * @publicdoc
         */
        setStretch: function(stretch) {
          this._element.toggleClass('stretch', stretch);
        },

        /**
         * Forces the image to be stretched to fit in the area reserved for the image.
         * @param {boolean} setted true : autoScale , false: default
         * @publicdoc
         */
        setAutoScale: function(setted) {
          if (setted !== this._autoScale) {
            this._autoScale = setted;
            this._updateImage();
          }
        },

        /**
         * Set autoscale value as nnnpx
         * @param {string} value - css string value with valid units
         */
        setScaleIconValue: function(value) {
          this._scaleIconValue = value;
          this.addClass('gbc_scaleIconValue');
          this._updateImage(true);
        },

        /**
         * Se the default color
         * @param {string} color - any CSS compliant color
         */
        setDefaultColor: function(color) {
          this._defaultColor = color;
          this._updateImage(true);
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          this._element.domFocus();
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection) {
          return this.getSrc();
        },

        /**
         * Align the image
         * @param {number|string} y - y positionsetSrc(imgSrc, true)
         * @param {number|string} x - x
         * @publicdoc
         */
        setAlignment: function(y, x) {
          const rtl = this.getStart() === 'right';

          let hAlign = (x === 'right' && !rtl) || (x !== 'right' && rtl) ? 'right' : 'left';
          hAlign = (x === 'horizontalCenter' || x === 'center') ? 'center' : hAlign;
          let vAlign = (y === 'bottom') ? 'bottom' : 'top';
          vAlign = (y === 'verticalCenter' || y === 'center') ? 'center' : vAlign;
          this._alignment = {
            x: x,
            y: y,
            val: `${hAlign} ${vAlign}`
          };

          const posY = (y === 'bottom') ? 'flex-end' : 'flex-start';
          const posX = (x === 'right') ? 'flex-end' : 'flex-start';
          const pos = {
            'align-items': (y === 'verticalCenter') ? 'center' : posY,
            'justify-content': (x === 'horizontalCenter') ? 'center' : posX,
            'background-position': this._alignment.val
          };
          this.setStyle(pos);
        },

        /**
         * Update image according to several pre-set parameters
         * @param {boolean} directApply true to apply src directly (internal use)
         * @private
         */
        _updateImage: function(directApply) {
          if (!this._element) {
            return;
          }
          if (this._hasContent) {
            this._element.empty();
            this._hasContent = false;
          }
          if (this._img) {
            this._img.off('error.ImageWidget');
            this._img.off('load.ImageWidget');
            this._img = null;
          }
          let style = {
            backgroundImage: null,
            backgroundPosition: null,
            backgroundRepeat: null,
            backgroundSize: null,
            width: null,
          };

          if (this._src) {
            if (this._src.startsWith('font:')) {
              this._applyImageAsFont(directApply);
            } else {

              // /!\ BAD : we update style object values inside this method
              this._applyImage(directApply, style);
            }
            this.toggleClass('gbc_autoScale', this._autoScale);
            if (this._scaleIconValue && this._img) {
              this._img.style.setProperty('--scaleIconValue', this._scaleIconValue);
              this.getLayoutInformation().invalidateMeasure();
            }
          }
          if (this._standalone) {
            if (!this._border) {
              this._border = document.createElement('div');
              this._border.addClass('gbc_ImageWidget_border');
            }
            this._element.appendChild(this._border);
          }
          this.setStyle({
            'background-image': style.backgroundImage,
            'background-position': style.backgroundPosition,
            'background-repeat': style.backgroundRepeat,
            'background-size': style.backgroundSize,
            'width': style.width
          });
          if (this.__charMeasurer) {
            this._element.appendChild(this.__charMeasurer);
          }
          this.emit(context.constants.widgetEvents.ready);
        },

        /**
         * Apply image and set parameters considering the image is a font
         * @private
         */
        _applyImageAsFont(directApply) {
          const pattern = /font:([^:]+).ttf:([^:]+):?([^:]*)/,
            match = this._src.match(pattern);
          let fontName, sCharCode, color, iCharCode, finalChar;
          if (match) {
            fontName = match[1];
            sCharCode = match[2];
            iCharCode = parseInt('0x' + sCharCode, 16);
            if (0x10000 <= iCharCode && iCharCode <= 0x10FFFF) {
              iCharCode = iCharCode - 0x10000;
              finalChar = String.fromCharCode(0xD800 | (iCharCode >> 10)) +
                String.fromCharCode(0xDC00 | (iCharCode & 0x3FF));
            } else {
              finalChar = String.fromCharCode('0x' + sCharCode);
            }
            color = match[3] || this._defaultColor;
          }
          if (fontName && sCharCode) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 640 512');
            // to left align svg, we need to set xMin, otherwise with a 100% width viewBox it will be centered
            svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('text-anchor', 'middle');
            // EDGE & IE doesn't support dominant-baseline central attribute, so we need to center using another way
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('x', '320');
            text.setAttribute('y', '256');
            text.setAttribute('font-size', (this._scaleIconValue ? '44em' : '470'));
            text.setAttribute('font-family', '"image2font_' + fontName.trim() + '"');

            if (this._scaleIconValue) {
              svg.style.setProperty('--scaleIconValue', this._scaleIconValue);
            }
            if (directApply) {
              text.textContent = finalChar;
            } else {
              window.requestAnimationFrame(function(text, character) {
                text.textContent = character;
              }.bind(this, text, finalChar));
            }
            if (color) {
              text.setAttribute('fill', color);
            }
            svg.appendChild(text);
            this._element.appendChild(svg);
            this._hasContent = true;
            this.emit(context.constants.widgetEvents.ready);
          }
          this.getElement().toggleClass('gbc_fixedSvg', !this._autoScale && !this._scaleIconValue);
        },

        _applyImage(directApply, style) {
          const isInitial = this.getLayoutInformation().getSizePolicyConfig().isInitial();
          if (this._inTable || (this._autoScale && !this._inToolBar && (!isInitial || !this._firstInitialSizing))) {
            style.backgroundImage = "url('" + this._src + "')";
            style.backgroundPosition = this._alignment && this._alignment.val || this.getStart();
            style.backgroundRepeat = 'no-repeat';
            style.backgroundSize = 'contain';
            style.width = '100%';
            this.emit(context.constants.widgetEvents.ready);
          } else {
            this._appendImage(directApply);
          }
          this._hasContent = true;
        },

        /**
         * Appends an <img> tag to the element
         * @private
         */
        _appendImage(directApply) {
          this._img = document.createElement('img');
          this._img.on('error.ImageWidget', this._onError.bind(this));
          if (directApply) {
            this._img.setAttribute("src", this._src);
          } else {
            this._setElementAttribute("src", this._src, "_img");
          }
          this._img.on('load.ImageWidget', this._onLoad.bind(this));
          this._element.appendChild(this._img);
        },

        /**
         * Set a custom process in the default error handler
         * @param errorHdl
         */
        setErrorHandler: function(errorHdl) {
          this._onErrorHandler = errorHdl;
        },

        /**
         * Error handler in case of wrong loading and other
         * @private
         */
        _onError: function() {
          this._img.off('error.ImageWidget');
          this._img.off('load.ImageWidget');
          if (this._element) {
            this._element.addClass('hidden');
          }

          if (this._onErrorHandler) {
            this._onErrorHandler();
          }
        },

        /**
         * Load handler to decide what to do after image finished loading
         * @private
         */
        _onLoad: function() {
          this._img.off('error.ImageWidget');
          this._img.off('load.ImageWidget');
          if (this._element) {
            this._element.removeClass('hidden');
            const w = this._img.naturalWidth,
              h = this._img.naturalHeight;
            if (!this.getLayoutEngine().hasNaturalSize()) {
              if (!this._autoScale) {
                this._layoutEngine.invalidateMeasure();
              }
              this.getLayoutEngine()._needMeasure = true;
            }
            this.getLayoutEngine().setNaturalSize(w, h);
            this._element.toggleClass('gbc_ImageWidget_wider', w > h).toggleClass('gbc_ImageWidget_higher', w <= h);

            this.getLayoutInformation()._sizeRatio = h / w;

            const isInitial = this.getLayoutInformation().getSizePolicyConfig().isInitial();
            if (isInitial && this._firstInitialSizing) {
              if (this._autoScale) {
                this._initialAutoscaling = true;
                this.getLayoutInformation()._keepRatio = true;
              } else {
                if (!this.getLayoutEngine().hasNaturalSize()) {
                  this.getLayoutEngine()._needMeasure = true;
                }
              }
            }
            this.emit(context.constants.widgetEvents.ready, this.getLayoutEngine().hasNaturalSize());
            gbc.LogService.ui.log("Image loaded", true, this.__name, this);
          }
        },

        /**
         * Callback once image has been layouted
         * @private
         */
        _whenLayouted: function() {
          if (this._initialAutoscaling) {
            this._initialAutoscaling = false;
            this._firstInitialSizing = false;
            this._updateImage();
          }
        },

        /**
         * @inheritDoc
         */
        setHidden: function(hidden) {
          $super.setHidden.call(this, hidden);
          if (!this._hidden && this._element.parentNode) {
            this._element.parentNode.removeClass('gl_gridElementHidden');
          }
        },

        getStyleSheetId: function() {
          const windowWidget = this.getWindowWidget(),
            windowWidgetId = windowWidget && windowWidget.getUniqueIdentifier();
          return this._uuid || windowWidgetId || "_";
        },

        /**
         * Get the natural dimension of the image
         * @return {{width: number, height: number}}
         */
        getNaturalDimension: function() {
          return {
            width: this._img.naturalWidth,
            height: this._img.naturalHeight
          };
        },

        /**
         * Return current row index if set (parent widget is a scrollgrid)
         * @returns {?number|number|*}
         */
        getRowIndex: function() {
          if (this.getParentWidget().getRowIndex) {
            return this.getParentWidget().getRowIndex();
          }
          return this._rowIndex;
        },

        /**
         * @inheritDoc
         */
        getContextMenuAuthorizedActions: function() {
          return {
            paste: false,
            copy: true,
            cut: false,
            selectAll: false
          };
        }

      };
    });
    cls.WidgetFactory.registerBuilder('Image', cls.ImageWidget);
    cls.WidgetFactory.registerBuilder('ImageWidget', cls.ImageWidget);
  });
