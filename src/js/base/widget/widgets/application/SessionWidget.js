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

modulum('SessionWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.SessionWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.SessionWidget.prototype */ {
        __name: "SessionWidget",
        _waiter: null,
        /** @type {classes.SessionEndWidget} */
        _endWidget: null,
        /** @type {classes.SessionEndRedirectWidget} */
        _endRedirectWidget: null,
        /** @type {classes.SessionWaitingEndWidget} */
        _waitingEndWidget: null,
        __zIndex: 0,
        _currentWidget: null,
        _currentWidgetStack: null,
        _tabbedContainerWidget: null,
        _session: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          this._currentWidgetStack = [];
          this._session = opts.session;
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._session = null;
          if (this._tabbedContainerWidget) {
            this._tabbedContainerWidget.destroy();
            this._tabbedContainerWidget = null;
          }
          if (this._endRedirectWidget) {
            this._endRedirectWidget.destroy();
            this._endRedirectWidget = null;
          }
          if (this._endWidget) {
            this._endWidget.destroy();
            this._endWidget = null;
          }
          if (this._waitingEndWidget) {
            this._waitingEndWidget.destroy();
            this._waitingEndWidget = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
          this._endWidget = cls.WidgetFactory.createWidget('SessionEnd', this.getBuildParameters());
          this._endWidget.setHidden(true);
          this._element.appendChild(this._endWidget.getElement());
          this._endRedirectWidget = cls.WidgetFactory.createWidget('SessionEndRedirect', this.getBuildParameters());
          this._endRedirectWidget.setHidden(true);
          this._element.appendChild(this._endRedirectWidget.getElement());
          this._waitingEndWidget = cls.WidgetFactory.createWidget('SessionWaitingEnd', this.getBuildParameters());
          this._waitingEndWidget.setHidden(true);
          this._element.appendChild(this._waitingEndWidget.getElement());
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          // no layout
        },

        /**
         * @inheritDoc
         * @param widget
         * @param options
         */
        addChildWidget: function(widget, options) {
          options = options || {};
          options.noDOMInsert = (options.noDOMInsert !== false);
          $super.addChildWidget.call(this, widget, options);
        },

        _getNextApplication: function(previousWidget) {
          let nextApp = null;
          if (this._currentWidgetStack.length) {
            nextApp = this._currentWidgetStack[this._currentWidgetStack.length - 1];
            if (nextApp === previousWidget && this._currentWidgetStack.length > 1) {
              nextApp = this._currentWidgetStack[this._currentWidgetStack.length - 2];
            }
          }
          return nextApp;
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          const displayedWidget = null;
          if (widget instanceof cls.ApplicationWidget) {
            this._currentWidgetStack.remove(widget);
          }
          $super.removeChildWidget.call(this, widget);
        },

        /**
         *
         * @param {classes.ApplicationWidget} widget
         */
        setCurrentWidget: function(widget) {
          if (this._currentWidget !== widget && (!this._tabbedContainerHostWidget || this._tabbedContainerHostWidget !== widget)) {
            if (widget) {
              const isBuffering = context.styler.isBuffering();
              if (!isBuffering) {
                context.styler.bufferize();
              }
              const previousWidget = this.getCurrentWidget();

              if (this._tabbedContainerWidget) {
                if (previousWidget) {
                  previousWidget.disable();
                }
                this._tabbedContainerWidget.setCurrentPage(widget._tabbedPage);
              } else {
                // REWORKED AND SIMPLIFIED ALGORITHM
                if (previousWidget) {
                  // if contains WebComponent or is under creation (happens when switching app during typeahead), then only hide the application
                  if (!previousWidget.isDestroyed() && (previousWidget.hasChildWebComponent() || !previousWidget._uiWidget)) {
                    previousWidget.addClass("gbc_out_of_view");
                  } else {
                    // otherwise remove the application from the dom (optimization)
                    if (this.getContainerElement() && previousWidget.getElement()) {
                      this.getContainerElement().removeChild(previousWidget.getElement());
                    }
                  }
                  previousWidget.disable();
                }
                // if widget contains this class (has webcomponent or was being added during its creation), just remove it
                if (widget.hasClass("gbc_out_of_view")) {
                  widget.removeClass("gbc_out_of_view");
                }
                // if widget is not in DOM, add it
                if (this.getContainerElement() && widget.getElement() && !widget.getElement().isInDOM()) {
                  this.getContainerElement().appendChild(widget.getElement());
                }
              }
              if (!this._currentWidgetStack.contains(widget)) {
                this._currentWidgetStack.push(widget);
              }
              widget.activate();
              if (!isBuffering) {
                context.styler.flush();
              }
            }
            this._currentWidget = widget;
          }
        },
        getCurrentWidget: function() {
          return this._currentWidget;
        },
        showWaitingEnd: function() {
          this._waitingEndWidget.setHidden(false);
        },
        showEnd: function() {
          this._waitingEndWidget.setHidden(true);
          this._endWidget.setHidden(false);
          this.emit(context.constants.widgetEvents.titleChanged, "");
          //A          context.HostService.setCurrentTitle();
          //A          context.HostService.setCurrentIcon();
        },
        showRedirectEnd: function() {
          this._waitingEndWidget.setHidden(true);
          this._endRedirectWidget.setHidden(false);
          this.emit(context.constants.widgetEvents.titleChanged, "");
          //A          context.HostService.setCurrentTitle();
          //A          context.HostService.setCurrentIcon();
        },
        getEndWidget: function() {
          return this._endWidget;
        },
        getWaitingEndWidget: function() {
          return this._waitingEndWidget;
        },

        setTabbedContainer: function(tabbedContainerWidget) {
          this._tabbedContainerWidget = tabbedContainerWidget;
        },

        setTabbedContainerHost: function(widget) {
          this._tabbedContainerHostWidget = widget;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Session', cls.SessionWidget);
  });
