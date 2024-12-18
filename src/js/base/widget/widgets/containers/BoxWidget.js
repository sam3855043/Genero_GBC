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

modulum('BoxWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Box Widget
     * @publicdoc Widgets
     * @class BoxWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.BoxWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.BoxWidget.prototype */ {
        __name: "BoxWidget",
        /** @type {?Boolean} */
        _canHaveSplitter: null,
        _splitters: null,
        _splitterIdentifier: null,
        _ignoreStoredSettings: false,
        /** @type {String} */
        _orientation: "",
        /** @type {Boolean} */
        _isSplit: false,
        /** @type {?Boolean} */
        _noSwipe: null,
        /** @type {Boolean} */
        _splitViewEnabled: false,
        /** @type {Boolean} */
        _navigationArrows: false,
        /** @type {Boolean} */
        _navigationDots: false,
        /** @type {Boolean} */
        _navigationDotSetByUser: false,
        /** @type {Boolean} */
        _isPacked: false,
        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          this._splitters = [];
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._isSplit = false;
          if (this._splitters) {
            for (let i = this._splitters.length - 1; i > -1; i--) {
              let currentChildren = this._splitters[i].widget;
              currentChildren.destroy();
              currentChildren = null;
            }
            this._splitters.length = 0;
          }
          this._noSwipe = null;
          this.disableSwipe();
          if (this._gesture) {
            this._gesture.destroy();
            this._gesture = null;
          }
          if (this._focusRestoredHandler) {
            this._focusRestoredHandler();
            this._focusRestoredHandler = null;
          }
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          if (!(widget instanceof cls.SplitterWidget)) {
            options = options || {
              position: ((this._children.length || -1) + 1) / 2
            };
            if (Object.isNumber(options.position)) {
              options.position = options.position * 2;
            }
            if (options.position) {
              const splitter = this._createSplitter();
              splitter.activateSplitter(this._canHaveSplitter);
              const onSplit = splitter.when(context.constants.widgetEvents.splitter, this._onSplit.bind(this));
              const onSplitStart = splitter.when(context.constants.widgetEvents.splitterStart, this._onSplitStart.bind(this));
              const onSplitEnd = splitter.when(context.constants.widgetEvents.splitterEnd, this._onSplitEnd.bind(this));
              this.addChildWidget(splitter, {
                position: options.position - 1
              });
              this._splitters.splice(options.position / 2, 0, {
                widget: splitter,
                onSplit: onSplit,
                onSplitStart: onSplitStart,
                onSplitEnd: onSplitEnd
              });
            }
          }
          $super.addChildWidget.call(this, widget, options);
        },

        /**
         * Create a splitter widget
         * @return {classes.HVBoxSplitterWidget} the created splitter widget
         * @protected
         */
        _createSplitter: function() {

          const splitter = cls.WidgetFactory.createWidget("HVBoxSplitter", this.getBuildParameters());
          splitter.setOrientation(this._orientation);
          return splitter;
        },

        /**
         * Get Box orientation
         * @returns {string}
         */
        getOrientation: function() {
          return this._orientation;
        },

        /**
         * _onSplit
         * @param {classes.Event} event the event
         * @param {classes.EventListener} sender the sender
         * @param {*} delta the delta value
         * @private
         */
        _onSplit: function(event, sender, delta) {
          this._layoutEngine.splitting(delta);
          this.emit(context.constants.widgetEvents.splitter);
        },

        /**
         * _onSplitStart
         * @param {classes.Event} event the event
         * @param {classes.EventListener} sender the sender
         * @private
         */
        _onSplitStart: function(event, sender) {
          this._layoutEngine.startSplitting((this._children.indexOf(sender) - 1) / 2);
        },

        /**
         * _onSplitEnd
         * @param {classes.Event} event the event
         * @param {classes.EventListener} sender the sender
         * @private
         */
        _onSplitEnd: function(event, sender) {
          this._layoutEngine.stopSplitting();
          if (!this._ignoreStoredSettings) {
            context.StoredSettingsService.setSplitter(this._splitterIdentifier.formName,
              this._splitterIdentifier.id, this._layoutEngine._referenceSplitHints);
          }
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          if (!(widget instanceof cls.SplitterWidget)) {
            const pos = this._children.indexOf(widget) - 1;
            if (pos > 0) {
              this._children[pos].destroy();
            }
          } else {
            const item = this._splitters.find(function(splitter) {
              return splitter.widget === widget;
            });
            if (item) {
              item.onSplit();
              item.onSplitStart();
              item.onSplitEnd();
              this._splitters.remove(item);
            }
          }
          $super.removeChildWidget.call(this, widget);
        },

        /**
         * @inheritDoc
         */
        _addChildWidgetToDom: function(widget, position) {
          this.getLayoutEngine().registerChild(widget, position);
          const widgetHost = document.createElement('div');
          widgetHost.addClass('g_BoxElement');
          widget.getLayoutInformation().setHostElement(widgetHost);
          widgetHost.appendChild(widget._element);
          widgetHost.insertAt(position, this._containerElement);
        },

        /**
         * @inheritDoc
         */
        _removeChildWidgetFromDom: function(widget) {
          this.getLayoutEngine().unregisterChild(widget);
          const info = widget.getLayoutInformation();
          let host = info && info.getHostElement();
          if (host && host.parentNode === this._containerElement) {
            widget._element.remove();
            host.remove();
            host = null;
          }
        },

        /**
         * getIndexOfChild
         * @param {classes.WidgetBase} widget the widget
         * @return {number} the index
         */
        getIndexOfChild: function(widget) {
          const rawIndex = this._children.indexOf(widget);
          return rawIndex / (widget instanceof cls.SplitterWidget ? 1 : 2);
        },

        /**
         * ignoreStoredSettings
         * @param {boolean} ignore ignore stored settings
         */
        ignoreStoredSettings: function(ignore) {
          this._ignoreStoredSettings = Boolean(ignore);
        },

        /**
         * Initialize splitter layout engine hints
         */
        initSplitterLayoutEngine: function() {
          if (!this._ignoreStoredSettings) {
            if (this._layoutEngine.initSplitHints) {
              this._layoutEngine.initSplitHints(context.StoredSettingsService.getSplitter(
                this._splitterIdentifier.formName, this._splitterIdentifier.id));
            }
          }
        },

        /**
         * switchSplitters
         * @param {boolean} canSplit can split
         * @param {*} splitterId splitter id
         */
        switchSplitters: function(canSplit, splitterId) {
          if (this._canHaveSplitter !== canSplit) {
            this._splitterIdentifier = splitterId;

            this.initSplitterLayoutEngine();

            this._canHaveSplitter = canSplit;
            for (let i = 0; i < this._splitters.length; i++) {
              this._splitters[i].widget.activateSplitter(this._canHaveSplitter);
            }
          }
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          //Default is vertical, might change after
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.HVBoxLayoutEngine(this);
          this._element.addClass("g_VBoxLayoutEngine");
        },

        /**
         * Set the box orientation
         * @param {String} orientation could be horizontal or vertical
         */
        setOrientation: function(orientation) {
          this._orientation = orientation || this.getDefaultOrientation();

          this._refreshSplit();

          if (this._layoutEngine.setOrientation) {
            this._layoutEngine.setOrientation(this._orientation);

            this._splitters.forEach((splitter) => {
              splitter.widget.setOrientation(this._orientation);
            });
          }

        },

        /**
         * Get default orientation
         * @return {string} - horizontal if HBOX, vertical if VBOX or not known
         */
        getDefaultOrientation: function() {
          return "vertical";
        },

        /**
         * Set packed 4ST attribute on HBOX and VBOX. By default, is false. If true, HBOX/VBOX will be left/top centered
         * @param packed
         */
        setPacked: function(packed) {
          this._isPacked = packed;
        },

        /**
         * Returns true if HBOX/VBOX is packed
         * @returns {Boolean}
         */
        isPacked: function() {
          return this._isPacked;
        },

        // SPLIT & SWIPE

        /**
         * Set Split VM attribute and enable/disable split view
         */
        setSplit: function(isSplit) {
          if (this._isSplit !== isSplit) {
            this._isSplit = isSplit;
            this._refreshSplit();
          }
        },

        /**
         * Enable/disable split depending of orientation updates and current split value
         * @private
         */
        _refreshSplit: function() {
          if (this._isSplit && this.getOrientation() === "horizontal") {
            this.enableSplitView();
          } else {
            this.disableSplitView();
          }
        },

        /**
         * Enable/disable navigation Arrows 4ST attribute
         * @param active
         */
        setNavigationArrows: function(active) {
          this._navigationArrows = active;
          if (this._gesture) {
            if (active) {
              this._gesture.addArrows();
            } else {
              this._gesture.removeArrows();
            }
          }
        },

        /**
         * Enable/disable navigation dots 4ST attribute
         * @param active
         */
        setNavigationDots: function(active) {
          this._navigationDots = active;
          this._navigationDotSetByUser = true;
          if (this._gesture) {
            if (active) {
              this._gesture.addDots();
            } else {
              this._gesture.removeDots();
            }
          }
        },

        /**
         * Enable Split view layout of HBOX or VBOX orientation horizontal
         */
        enableSplitView: function() {
          if (!this._splitViewEnabled) {
            this._splitViewEnabled = true;
            const oldEngine = this._layoutEngine;
            this.addClass("splitView");
            this._layoutEngine = new cls.SplitLayoutEngine(this);
            this._layoutInformation.getStretched().setDefaultX(true);
            this._layoutInformation.getStretched().setDefaultY(true);

            // enable swipe gesture
            this.enableSwipe();

            for (const element of this.getChildren()) {
              const child = element;
              if (child instanceof cls.SplitterWidget) { // hide splitter in splitview
                child.setHidden(true);
              } else if (!child.isHidden()) {
                oldEngine.unregisterChild(child);
                this._layoutEngine.registerChild(child);
              }
              if (child.isHidden()) {
                if (child.getElement().parentNode) {
                  child.getElement().parentNode.addClass("hidden");
                }
              }

              this._listenToGroupVisibilityChange(child);
            }

            // if the navigation dot not set by user then add it (yes = default value)
            if (!this._navigationDotSetByUser && !this._gesture.hasDots()) {
              this._gesture.addDots();
            }

            if (!this._focusRestoredHandler) {
              this._focusRestoredHandler = context.SessionService.getCurrent().getCurrentApplication().focus.when(context.constants
                .widgetEvents.focusRestored,
                function() {
                  this._focusRestoredHandler = null;
                  this._layoutEngine.refreshLayout();
                }.bind(this), true);
            }
          }
        },

        /**
         * Disable Split view layout of HBOX or VBOX orientation horizontal
         */
        disableSplitView: function() {
          if (this._splitViewEnabled) {
            this._splitViewEnabled = false;

            if (this._focusRestoredHandler) {
              this._focusRestoredHandler();
              this._focusRestoredHandler = null;
            }

            const oldEngine = this._layoutEngine;
            this.removeClass("splitView");
            this._layoutEngine = new cls.HVBoxLayoutEngine(this);
            this._layoutInformation.getStretched().setDefaultX(false);
            this._layoutInformation.getStretched().setDefaultY(false);

            this.disableSwipe();

            for (let i = this.getChildren().length - 1; i >= 0; i--) {
              const child = this.getChildren()[i];
              if (child.isHidden()) {
                if (child.getElement().parentNode) {
                  child.getElement().parentNode.removeClass("hidden");
                }
              }
              if (child instanceof cls.SplitterWidget) { // show splitter in splitview
                child.setHidden(false);
              }
              oldEngine.unregisterChild(child);
              this._layoutEngine.registerChild(child);

              this._stopListeningToGroupVisibilityChange(child);
            }

            this._layoutEngine.setOrientation(this.getOrientation(), true);

          }

        },

        /**
         * Listen to group visibility change to be able to add/remove it from swipeable element
         * @param {classes.WidgetBase} widget - SplitView child group
         * @private
         */
        _listenToGroupVisibilityChange: function(widget) {
          if (!(widget instanceof cls.SplitterWidget)) {
            widget.detachVisibilityChangeListener = widget.when(context.constants.widgetEvents.visibilityChange, this._addRemoveGroup.bind(
              this, widget));
            // each child group need to listen to focus to display. Mostly needed for folder pages.
            if (this._gesture) {
              widget.detachSplitViewChangeListener = widget.when(context.constants.widgetEvents.splitViewChange, this._gesture.swipeTo.bind(
                this._gesture, widget, {
                  smoothEffect: false
                }));
            }
          }
        },

        /**
         * Stop to listen to group visibility change
         * @param {classes.WidgetBase} widget - SplitView child group
         * @private
         */
        _stopListeningToGroupVisibilityChange: function(widget) {
          if (!(widget instanceof cls.SplitterWidget)) {
            if (widget.detachVisibilityChangeListener) {
              widget.detachVisibilityChangeListener();
              delete widget.detachVisibilityChangeListener;
            }
            if (widget.detachSplitViewChangeListener) {
              widget.detachSplitViewChangeListener();
              delete widget.detachSplitViewChangeListener;
            }
          }
        },

        /**
         * Add or remove a group in the list of swipeable groups of the HBox SplitView depending on group visibility
         * @param {classes.WidgetBase} widget - SplitView child group
         * @private
         */
        _addRemoveGroup: function(widget) {
          if (widget.isHidden()) {
            this._layoutEngine.unregisterChild(widget);
            widget.getElement().parentNode.addClass("hidden");
          } else {
            this._layoutEngine.registerChild(widget);
            widget.getElement().parentNode.removeClass("hidden");
          }

        },

        // SWIPE

        /**
         * Set NoSwipe attribute value and enable/disable swipe gestures
         * @param noSwipe
         */
        setNoSwipe: function(noSwipe) {
          if (this._noSwipe !== noSwipe) {
            this._noSwipe = noSwipe;
            if (this.isSwipeable()) { // if we can swipe, then enable it
              this.enableSwipe();
            } else {
              this.disableSwipe();
            }
          }
        },

        /**
         * Determine if swipe gestures are supported on current device
         * @returns {*}
         */
        isSwipeable: function() {
          return this._isSplit && !this._noSwipe && window.isTouchDevice() && this.getOrientation() === "horizontal";
        },

        /**
         * Enable swipe functionality on folder pages
         */
        enableSwipe: function() {
          if (!this._gesture) {
            const params = {
              noSwipe: !this.isSwipeable(),
              arrows: this._navigationArrows,
              dots: this._navigationDots
            };
            this._gesture = new cls.GestureService(this, params);
          } else {
            this._gesture.addTouch();
          }
        },

        /**
         * Disable swipe functionality on folder pages
         */
        disableSwipe: function() {
          if (this._isSplit && this.getOrientation() ===
            "horizontal") { // Both SPLIT and NOSWIPE enabled. Add dots to be able to switch of view
            if (this._gesture) {
              this._gesture.removeTouch();
              if (!this._gesture.hasArrows() && !this._gesture.hasDots()) {
                this._gesture.addDots();
              }
            }
          } else { // can delete all instance of gesture
            if (this._gesture) {
              this._gesture.destroy();
              this._gesture = null;
            }
          }
        }

      };
    });
    cls.WidgetFactory.registerBuilder('Box', cls.BoxWidget);
  });
