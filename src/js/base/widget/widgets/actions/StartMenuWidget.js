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

modulum('StartMenuWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * StartMenu widget.
     * @class StartMenuWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.StartMenuWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.StartMenuWidget.prototype */ {
        __name: 'StartMenuWidget',
        /**
         * Element that hold the text
         * @type Element
         */
        _textElement: null,
        _resizerElement: null,
        _resizeHandle: null,
        _dragHandle: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._textElement = this._element.getElementsByClassName('gbc_StartMenuText')[0];

          this._currentSize = 100;
          this._resizerElement = this._element.getElementsByClassName("resizer")[0];
          this._panel = this._element.getElementsByClassName("panel")[0];
          this._dragHandle = this._resizerElement.getElementsByClassName("firefox_placekeeper")[0];
          this._resizerElement.setAttribute("draggable", "true");
          this._resizerElement.on("dragstart.ApplicationHostSidebarWidget", this._onDragStart.bind(this));
          this._resizerElement.on("dragend.ApplicationHostSidebarWidget", this._onDragEnd.bind(this));
          this._resizerElement.on("drag.ApplicationHostSidebarWidget", this._onDrag.throttle(5).bind(this));
          window.addEventListener("resize", this.updateResizeTimer.bind(this));

        },

        updateResizeTimer: function() {
          if (window.isMobile() && !window.isOrientationImplemented) {
            window.orientation = window.innerWidth > window.innerHeight ? 90 : 0;
          }
          // for mobiles, only relayout on screen orientation
          if (this._resizeHandle) {
            this._clearTimeout(this._resizeHandle);
            this._resizeHandle = null;
          }
          if (!window.isMobile() || this._screenOrientation !== window.orientation) {
            this._screenOrientation = window.orientation;

            this._resizeHandle = this._registerTimeout(this.updateResize.bind(this, null, false), 100);
          }
        },
        updateResize: function(deltaX, absolute) {
          const previousSize = this._currentSize;
          this._resizeHandle = null;

          let max = 400;
          if (absolute) {
            this._currentSize = deltaX;
          } else {
            this._currentSize = (Object.isNumber(this._origin) ? this._origin : this._currentSize) + (deltaX || 0);
            if (this._currentSize < 16) {
              this._currentSize = 16;
            }
          }
          if (this._currentSize > max) {
            this._currentSize = max;
          }

          this._panel.style.width = this._currentSize + 'px';
          // if sidebar size or visibility changed, we emit displayChanged
          if (this._currentSize !== previousSize) {
            // if sidebar size changed only, we update size
            this.setStyle({
              width: this._currentSize + "px"
            });
            // Save sidebar width into storedSettings
            gbc.StoredSettingsService.setSideBarwidth(this._currentSize);
          }
          gbc.HostService.updateDisplay(); // re-align everything in window
          this._panel.querySelector(".wrapper").scrollLeft = 0;
          this.emit(context.constants.widgetEvents.displayChanged);
        },

        _onDragOver: function(evt) {
          this._pageX = evt.clientX || evt.screenX || evt.pageX;
          evt.preventCancelableDefault();
        },
        _onDragStart: function(evt) {
          document.body.on("dragover.ApplicationHostSidebarWidget", this._onDragOver.bind(this));
          this._isDragging = true;
          if (window.browserInfo.isFirefox) {
            evt.dataTransfer.setData('text', ''); // for Firefox compatibility
          }
          if (evt.dataTransfer.setDragImage) {
            evt.dataTransfer.setDragImage(this._dragHandle, 0, 0);
          }
          evt.dataTransfer.effectAllowed = "move";
          this._pageX = this._resizerDragX = evt.clientX || evt.screenX || evt.pageX;
          this._origin = this._currentSize;
        },
        _onDragEnd: function(evt) {
          document.body.off("dragover.ApplicationHostSidebarWidget");
          this._isDragging = false;
          this._origin = this._currentSize;
          // Save sidebar width into storedSettings
          gbc.StoredSettingsService.setSideBarwidth(this._currentSize);
        },
        _onDrag: function(evt) {
          if (this._isDragging) {
            const deltaX = this._pageX - this._resizerDragX;
            this.updateResize(deltaX);

          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this.setAcceptEventWhenWindowInactive(true);
        },

        /**
         * Set the text of the group
         * @param {string} text
         */
        setText: function(text) {
          this._setElementAttribute('title', text, "_textElement");
          this._setTextContent(text, "_textElement");
        },

        /**
         * Get the text of the group
         * @return {string}
         */
        getText: function() {
          return this._textElement.textContent;
        },
        setProcessing: function(isProcessing) {
          if (this.getElement()) {
            if (isProcessing) {
              this.getElement().setAttribute("processing", "processing");
            } else {
              this.getElement().removeAttribute("processing");
            }
          }
        }
      };
    });
    cls.WidgetFactory.registerBuilder('StartMenu', cls.StartMenuWidget);
  });
