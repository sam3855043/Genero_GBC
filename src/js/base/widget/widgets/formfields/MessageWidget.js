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

modulum('MessageWidget', ['TextWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Message Widget to display information as toated popups
     * @class MessageWidget
     * @memberOf classes
     * @extends classes.TextWidgetBase
     * @publicdoc Widgets
     */
    cls.MessageWidget = context.oo.Class(cls.TextWidgetBase, function($super) {
      return /** @lends classes.MessageWidget.prototype */ {
        __name: 'MessageWidget',
        $static: /** @lends classes.MessageWidget */ {
          defaultDisplayTime: 10
        },

        /**
         * Content of the message
         * @type {string}
         */
        _text: '',

        /**
         * Is the message is displayed with html formatting
         * @type {boolean}
         */
        _htmlFormat: false,

        /**
         * true if we must sanitize the html
         * @type {boolean}
         * */
        _sanitize: null,

        /** @type {string} */
        _kind: 'message',

        /** @type {?string} */
        _forcedPosition: null,

        /**
         * Timer to handle display time
         * @type {?number}
         */
        _currentTimeout: null,

        /**
         * Time (in seconds) before hiding message
         * 0  : always show
         * -1 : always hide
         */
        _messageDisplayTime: 0,

        /**
         * Close button element
         * @type {HTMLElement}
         */
        _closeButton: null,

        /**
         * Text Element
         * @type {HTMLElement}
         */
        _textElement: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);

          this._closeButton = this._element.querySelector('.close-button');
          this._textElement = this._element.querySelector('.message-text');

          const themeDisplayTime = context.ThemeService.getValue('theme-message-display-time');
          this._messageDisplayTime = Object.isNumber(themeDisplayTime) || Object.isString(themeDisplayTime) ?
            parseInt(themeDisplayTime, 10) : cls.MessageWidget.defaultDisplayTime;

          const swipeDirections = this.getPosition().split('-');
          // Interesting on touch device. On desktop click catches all
          this._element.onSwipe('MessageWidget', this._onSwipe.bind(this), {
            direction: swipeDirections
          });

          this.setHidden(true);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._closeButton = null;
          this._textElement = null;
          if (this._htmlFilter) {
            this._htmlFilter.destroy();
            this._htmlFilter = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          this.setHidden(true);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * Set the message text
         * @param {string} text - the text to display
         * @publicdoc
         */
        setText: function(text) {
          if (text !== this._text) {
            this._text = text;
            this._refreshText();
            this.getLayoutEngine().invalidateMeasure();
          }
        },

        /**
         * Handle text reformatting
         * @private
         */
        _refreshText: function() {
          this.domAttributesMutator(function() {
            if (this._htmlFormat) {
              if (this._sanitize) {
                if (!this._htmlFilter) {
                  this._htmlFilter = cls.WidgetFactory.createWidget('HtmlFilterWidget', this.getBuildParameters());
                }
                this._textElement.innerHTML = this._htmlFilter.sanitize(this._text);
              } else {
                this._textElement.innerHTML = this._text;
              }
            } else {
              this._textElement.textContent = this._text;
            }
          }.bind(this));

          if (this._text.trim().length <= 0) {
            this.setHidden(true);
          } else {
            this.setHidden(false);
          }
          if (this.isReversed()) {
            const ui = this.getUserInterfaceWidget();
            if (ui) {
              const left = ui.getElement().getBoundingClientRect().left;
              this.setStyle({
                'left': (left + 12) + 'px'
              });
            }
          }
        },

        /**
         * Get the current text
         * @returns {string} the displayed text
         * @publicdoc
         */
        getText: function() {
          return this._textElement.textContent;
        },

        /**
         * Hide / show the message
         * @param {boolean} hidden - visibility state
         * @publicdoc
         */
        setHidden: function(hidden) {
          // Message text is empty or display time is 0, hide it
          if (this._text.trim().length <= 0 || this._messageDisplayTime < 0) {
            hidden = true;
          }
          if (!hidden) {
            this.removeClass("out-of-view");
          }
          const disp = this._messageDisplayTime * 1000;
          // Handle hide timeout only if display time is positive
          if (this._messageDisplayTime > 0) {
            if (this._hidden !== hidden) {
              $super.setHidden.call(this, hidden);
              if (this._currentTimeout !== null) {
                this._clearTimeout(this._currentTimeout);
                this._currentTimeout = null;
              }
              if (!hidden) {
                this._currentTimeout = this._registerTimeout(this._hide.bind(this), disp);
              }
              this.emit("hide.MessageWidget", hidden);
            }
          } else {
            $super.setHidden.call(this, hidden);
          }
        },

        /**
         * Hide message with a sliding animation
         * @private
         */
        _onSwipe: function() {
          this.getElement().addClass("slideOut");
          this._registerTimeout(function() {
            this.setHidden(true);
            this.getElement().removeClass("slideOut");
          }.bind(this), 350);
        },

        /**
         * do hide
         * @private
         */
        _hide: function() {
          this.setHidden(true);
          this._currentTimeout = null;
        },

        /**
         * Set message formatting as html
         * @param {boolean} html - true if html formatted, false otherwise
         * @publicdoc
         */
        setHtmlFormat: function(html) {
          if (this._htmlFormat !== html) {
            this._htmlFormat = html;
            this._refreshText();
          }
        },

        /**
         * sanitize = false : Authorize to send html text without control
         * @param {boolean} sanitize
         */
        setSanitize: function(sanitize) {
          this._sanitize = sanitize;
        },

        /**
         * Defines the type of message, thus the right customization variables will be used
         * @param {string} kind - could be 'message' or 'error'
         * @publicdoc
         */
        setMessageKind: function(kind) {
          this._kind = kind;
          this._setElementAttribute("data-message-kind", kind);
          if (kind) {
            // Handle display time
            const themeDisplayTime = context.ThemeService.getValue('theme-' + kind + '-display-time');
            this._messageDisplayTime = Object.isNumber(themeDisplayTime) || Object.isString(themeDisplayTime) ?
              parseInt(themeDisplayTime, 10) : cls.MessageWidget.defaultDisplayTime;
            // Handle position
            if (context.ThemeService.getValue("theme-" + kind + "-display-position")) {
              this.addClass(context.ThemeService.getValue("theme-" + kind + "-display-position"));
            }
          }
        },

        /**
         * Get the message kind
         * @return {string} could be 'error' or 'message'
         */
        getMessageKind: function() {
          return this._kind;
        },

        setMessageDisplayTime: function(displayTime) {
          this._messageDisplayTime = displayTime;
        },
        setMessageColor: function(color, bgColor) {
          this._element.style.color = color;
          this._element.style.backgroundColor = bgColor;
        },

        /**
         * Get the 4ST position value for the message
         * @return {string} - something like "bottom-left"
         */
        getPosition: function() {
          const pos = "bottom-right"; // default value
          const kind = this.getMessageKind();
          const themePos = context.ThemeService.getValue("theme-" + kind + "-display-position");
          return themePos ? themePos : pos;
        },

        /**
         * In case of position forced, return it
         * @return {?string} - something like "bottom-left" or null if not forced
         */
        getForcedPosition: function() {
          return this._forcedPosition;
        },

        /**
         * Define a position to ignore theme value
         * @param {String} forcedPosition - same as theme available positions
         */
        setPosition: function(forcedPosition) {
          this._forcedPosition = forcedPosition;
        },

        /**
         * Use this to create a widget in the dom without displaying it
         */
        setDummyMessage: function() {
          this.setText("...");
          this.addClass("out-of-view"); // see: GBC-2187
        },

      };
    });
    cls.WidgetFactory.registerBuilder('Message', cls.MessageWidget);
  });
