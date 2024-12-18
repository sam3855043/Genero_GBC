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

modulum('ApplicationWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Main container widget for an application
     * @class ApplicationWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     * @publicdoc Widgets
     */
    cls.ApplicationWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.ApplicationWidget.prototype */ {
        __name: "ApplicationWidget",
        _waiter: null,
        /**
         * the contextmenu widget
         * @type {classes.ContextMenuWidget}
         */
        _contextMenu: null,

        /**
         * the RowBound menu widget
         * @type {classes.ContextMenuWidget}
         */
        _rowBoundMenu: null,

        _handlers: null,
        _uiWidget: null,

        /** @type {Array} */
        _domAttributesMutationBuffer: null,

        /** @type {Array} */
        _afterDomMutationBuffer: null,

        /** @type {boolean} */
        _isBuffering: false,

        /** @type {boolean} */
        _isDomMutating: false,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          opts.appWidget = this;
          $super.constructor.call(this, opts);
          this._domAttributesMutationBuffer = [];
          this._afterDomMutationBuffer = [];
          this._handlers = [];
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._handlers) {
            for (const element of this._handlers) {
              element();
            }
            this._handlers.length = 0;
          }
          if (this._waiter) {
            this._waiter.destroy();
            this._waiter = null;
          }
          context.styler.removeStyleSheet(this._appHash);

          if (this._contextMenu) {
            this._contextMenu.destroy();
            this._contextMenu = null;
          }

          if (this._rowBoundMenu) {
            this._rowBoundMenu.destroy();
            this._rowBoundMenu = null;
          }

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);

          this._waiter = cls.WidgetFactory.createWidget("Waiting", this.getBuildParameters());
          this._element.appendChild(this._waiter.getElement());

          this._contextMenu = cls.WidgetFactory.createWidget("ContextMenu", this.getBuildParameters());
          this._contextMenu.setParentWidget(this);

          this._rowBoundMenu = cls.WidgetFactory.createWidget("ContextMenu", this.getBuildParameters());
          this._rowBoundMenu.setParentWidget(this);

        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;
          if (this.getContextMenu() && this.getContextMenu().isVisible()) {
            switch (keyString) {
              case "space":
                const currentChild = this.getContextMenu().getCurrentChildren();
                if (currentChild) {
                  if (currentChild._onClick) { // TODO review this
                    currentChild._onClick(null);
                  } else {
                    this.getContextMenu()._onClick(null, this.getCurrentChildren());
                  }
                  keyProcessed = true;
                }
                break;
              default:
                break;
            }
            if (!keyProcessed) {
              keyProcessed = this.getContextMenu().managePriorityKeyDown(keyString, domKeyEvent, repeat);
            }
          }
          return keyProcessed;
        },

        /**
         * Show context menu and show it
         * @param evt
         * @param widget
         */
        showContextMenu: function(evt, widget) {

          this._contextMenu.setColor(this.getColor());
          this._contextMenu.setBackgroundColor(this.getBackgroundColor());

          evt.preventCancelableDefault();
          evt.stopImmediatePropagation();
          evt.stopPropagation();

          this._contextMenu.x = evt.clientX;
          this._contextMenu.y = evt.clientY;

          if (this._contextMenu.isVisible()) {
            this._contextMenu.hide(); // hide it before display it, to be sure it is in the correct position
          }

          // once VM gave focus to widget, show the contextMenu
          const app = context.SessionService.getCurrent().getCurrentApplication();
          app.scheduler.callbackCommand(function() {
            if (this._contextMenu && !this._contextMenu.isDestroyed()) {
              // Extra actions defines by widgets in buildExtraContextMenuActions function
              this._contextMenu.removeAndDestroyActions(true);

              widget.buildExtraContextMenuActions(this._contextMenu);
              if (this._contextMenu.hasVisibleAction()) {
                this._contextMenu.show();
              }
            }
          }.bind(this));
        },

        /**
         * Returns contextMenu widget
         * @returns {classes.ContextMenuWidget} contextMenu widget
         */
        getContextMenu: function() {
          return this._contextMenu;
        },

        /**
         * Returns rowBound menu widget
         * @returns {classes.ContextMenuWidget} rowBound menu widget
         */
        getRowBoundMenu: function() {
          return this._rowBoundMenu;
        },

        /**
         *
         * @param {classes.WidgetBase} widget
         * @param {Object=} options - possible options
         * @param {boolean=} options.noDOMInsert - won't add child to DOM
         * @param {number=} options.position - insert position
         * @param {string=} options.tag - context tag
         * @param {string=} options.mode - context mode : null|"replace"
         */
        addChildWidget: function(widget, options) {
          this._uiWidget = widget;
          $super.addChildWidget.call(this, widget, options);
        },
        /**
         * Set application hash
         * @param {string} applicationHash
         */
        setApplicationHash: function(applicationHash) {
          this._appHash = applicationHash;
        },
        /**
         * Hide waiter
         */
        hideWaiter: function() {
          this._waiter.getElement().remove();
        },
        /**
         * Activate application
         */
        activate: function() {
          this.emit(context.constants.widgetEvents.activate);
          if (this._uiWidget) {
            this._uiWidget.emit(context.constants.widgetEvents.activate);
          }
        },
        /**
         * Bind a handler executed when application is activated
         * @param {Hook} hook
         * @returns {HandleRegistration} return handler reference
         */
        onActivate: function(hook) {
          this._handlers.push(this.when(context.constants.widgetEvents.activate, hook));
          return this._handlers[this._handlers.length - 1];
        },
        /**
         * Disable application
         */
        disable: function() {
          this.emit(context.constants.widgetEvents.disable);
          if (this._uiWidget) {
            this._uiWidget.emit(context.constants.widgetEvents.disable);
          }
        },
        /**
         * Emit a request to relayout application
         */
        layoutRequest: function() {
          this.emit(context.constants.widgetEvents.layoutRequest);
        },
        /**
         * Bind a handler executed when layout is requested
         * @param hook
         * @returns {Function} return handler reference
         */
        onLayoutRequest: function(hook) {
          this._handlers.push(this.when(context.constants.widgetEvents.layoutRequest, hook));
          return this._handlers[this._handlers.length - 1];
        },

        /**
         * @inheritDoc
         */
        flash: function(duration) {
          this.addClass("flash");
          this._registerTimeout(function() {
            this.removeClass("flash");
          }.bind(this), duration || 50);
        },

        /**
         * register function to run when not buffering. Executed directly if not buffering.
         * @param {Function} fn function to run when not buffering
         * @param {classes.WidgetBase} ctx a widget context - used to check is this context is destroyed or not when executing
         * @returns {boolean} whether or not the function zas buffered
         */
        domAttributesMutationBuffer: function(fn, ctx) {
          if (this._isBuffering) {
            this._domAttributesMutationBuffer.push([fn, ctx]);
            return true;
          }
          return false;
        },

        /**
         * register function to run when not buffering. Executed directly if not buffering.
         * @param {Function} fn function to run when not buffering
         * @param {classes.WidgetBase} context a widget context - used to check is this context is destroyed or not when executing
         * @returns {boolean} whether or not the function zas buffered
         */
        afterDomMutationBuffer: function(fn, context) {
          if (this._isBuffering || this._isDomMutating) {
            this._afterDomMutationBuffer.push([fn, context]);
            return true;
          }
          return false;
        },

        /**
         * Set buffering state
         * @param {boolean} buffering the new buffering state
         */
        bufferizeDom: function(buffering) {
          if (buffering) {
            this._isBuffering = true;
          } else {
            this._isDomMutating = true;
            this._isBuffering = false;
            const domAttributesMutationBuffer = this._domAttributesMutationBuffer;
            this._domAttributesMutationBuffer = [];
            const afterDomMutationBuffer = this._afterDomMutationBuffer;
            this._afterDomMutationBuffer = [];
            domAttributesMutationBuffer.forEach(function(item) {
              if (!item[1] || !item[1].isDestroyed()) {
                item[0]();
              }
            });
            context.styler.bufferize();
            afterDomMutationBuffer.forEach(function(item) {
              if (!item[1] || !item[1].isDestroyed()) {
                item[0]();
              }
            });
            context.styler.flush();
            this._isDomMutating = false;
          }
        },

        /**
         * @inheritDoc
         */
        hasChildWebComponent: function() {
          return (Boolean(this._uiWidget) && this._uiWidget.hasChildWebComponent()) ||
            $super.hasChildWebComponent.call(this);
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Application', cls.ApplicationWidget);
  });
