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

modulum('WidgetBase', ['EventListener'],
  function(context, cls) {
    const SPACES_RE = /\s+/;

    /**
     * Base class for widgets.
     * @class WidgetBase
     * @memberOf classes
     * @tutorial widgets
     * @extends classes.EventListener
     * @publicdoc Widgets
     */
    cls.WidgetBase = context.oo.Class({
      base: cls.EventListener
    }, function($super) {

      const __charMeasurer = document.createElement('char-measurer');
      __charMeasurer.className = "g_layout_charMeasurer";
      const __charMeasurer1 = document.createElement('char-measurer-item');
      __charMeasurer1.className = "g_layout_charMeasurer1";
      __charMeasurer1.textContent = "MMMMMMMMMM\nM\nM\nM\nM\nM\nM\nM\nM\nM";
      const __charMeasurer2 = document.createElement('char-measurer-item');
      __charMeasurer2.className = "g_layout_charMeasurer2";
      __charMeasurer2.textContent = "0000000000";
      __charMeasurer.appendChild(__charMeasurer1);
      __charMeasurer.appendChild(__charMeasurer2);
      __charMeasurer.setAttribute("aria-hidden", "true");

      return /** @lends classes.WidgetBase.prototype */ {
        $static: /** @lends classes.WidgetBase */ {
          /** Generic click events handler */
          // TODO is it still necessary to have these methods static ?
          /** Generic focus events handler */
          _onFocus: function(event) {
            this.emit(context.constants.widgetEvents.focus, event);
          },
          /**
           * Need to listen mouseup event on body to be able to focus an input field if selection ends outside the field.
           * If selection ends inside the field, click event will be raised
           * @protected
           */
          _onSelect: function() {
            document.body.on('mouseup.DetectTextSelection', function(event) {
              document.body.off('mouseup.DetectTextSelection');
              this._element.off('mouseleave.DetectTextSelection');
            }.bind(this));
            this._element.on('mouseleave.DetectTextSelection', function(event) {
              document.body.off('mouseup.DetectTextSelection');
              this._element.off('mouseleave.DetectTextSelection');
              if (event.buttons === 1) {
                if ((this.isInTable() && !event.ctrlKey) || !this.isInTable()) {
                  this._onRequestFocus(event); // request focus
                }
              }
            }.bind(this));
          },
          selfDataContent: {},
        },
        __name: "WidgetBase",
        __templateName: null,
        __charMeasurer: null,
        __dataContentPlaceholderSelector: null,
        /**
         * Current widget's unique ID (GBC system wide)
         * @type {?string}
         */
        _uuid: null,

        /**
         * Incremental ID for widgets that are linked to the AUI, 0 otherwise
         * @type {number}
         */
        _nUuid: 0,

        /**
         * Widget root class name (based on widget's unique ID)
         * @type {?string}
         */
        _rootClassName: null,
        _auiTag: null,
        _auiName: null,
        /**
         * the dom element
         * @type {HTMLElement}
         * @protected
         */
        _element: null,
        /**
         * the parent widget
         * @type {classes.WidgetGroupBase}
         * @protected
         */
        _parentWidget: null,
        /**
         * Current instance stylesheet
         * @type {Object}
         */
        _stylesheet: null,
        /**
         * stylesheet context ('global', 'window')
         * @type {string}
         */
        _stylingContext: "global",
        /**
         * the layout engine
         * @type {classes.LayoutEngineBase}
         * @protected
         */
        _layoutEngine: null,
        /**
         * the layout information
         * @type {classes.LayoutInformation}
         * @protected
         */
        _layoutInformation: null,
        /**
         * the user interface widget
         * @type {classes.UserInterfaceWidget}
         * @protected
         */
        _uiWidget: null,
        /**
         * Application widget
         * @type {classes.ApplicationWidget}
         * @protected
         */
        _appWidget: null,
        _appHash: null,
        _windowWidget: null,
        _formWidget: null,
        _tableWidgetBase: null,
        _scrollGridWidget: null,
        _stretchableScrollGridWidgetBase: null,
        _folderWidget: null,

        _i18NList: null,
        _i18nTranslateListener: null,

        /**
         * Dialog type of the widget (Input, Input Array, Display, Display Array, Construct)
         * @type {?string}
         * @protected
         */
        _dialogType: null,
        _enabled: true,
        _noBorder: false,
        _hidden: false,
        _focusable: false,

        _startKey: null,
        _endKey: null,

        _inMatrix: false,
        _inTable: false,
        _inScrollGrid: false,
        _inFirstTableRow: false,
        _inToolBar: false,
        _ignoreLayout: false,

        // arabic mode
        _isReversed: false,

        /**
         * @type {?string}
         */
        _rawStyles: null,

        /**
         * @type {Array<string>}
         */
        _applicationStyles: null,

        /**
         * An interruptible widget is active when the VM is processing
         * @type {boolean}
         */
        _interruptable: false,
        _hasWebcomp: false,

        /**
         * The real AUI widget
         * @type {classes.WidgetBase}
         */
        _realWidget: null,

        /**
         * True if the widget accept events when inside an inactive windows
         * @type {boolean}
         */
        _acceptEventWhenWindowInactive: null,

        /**
         * All the applied behaviors;
         * @type {Set}
         */
        _applyedBehaviors: null,

        /**
         * @inheritDoc
         * @constructs
         * @param {Object} opts instantiation options
         * @param {number} opts.appHash internal app hash
         * @param {classes.ApplicationWidget} opts.appWidget early ApplicationWidget link
         * @param {number} opts.auiTag internal aui tag id
         * @param {boolean} opts.inTable internal is in table
         * @param {boolean} opts.inMatrix internal is in matrix
         * @param {boolean} opts.inFirstTableRow internal
         * @param {boolean} opts.inScrollGrid internal is in a scroll grid
         * @param {boolean} opts.inToolBar internal is in a toolbar
         * @param {boolean} opts.ignoreLayout ignore layout char measurer
         */
        constructor: function(opts) {
          opts = opts || {};
          this._realWidget = opts.realWidget;
          this._appHash = opts.appHash;
          this._appWidget = opts.appWidget;
          this._auiTag = opts.auiTag;
          this._inTable = opts.inTable === true;
          this._inFirstTableRow = opts.inFirstTableRow === true;
          this._inMatrix = opts.inMatrix === true;
          this._inScrollGrid = opts.inScrollGrid === true;
          this._inToolBar = opts.inToolBar === true;
          this._ignoreLayout = this._inTable && !this._inFirstTableRow || opts.ignoreLayout;

          this._applyedBehaviors = new Set();
          this._uuid = context.InitService.uniqueIdAsString();
          this._nUuid = this._auiTag ? context.InitService.uniqueId() : 0;
          this._acceptEventWhenWindowInactive = false;
          $super.constructor.call(this, opts);
          this._rootClassName = "w_" + this._uuid;
          this._initElement();
          this._afterInitElement();
          this._initLayout();
          this._initTranslation();
          if (this._auiTag) {
            this._element.addClass("aui__" + this._auiTag);
            this._element.setAttribute("data-aui-id", this._auiTag);
          }
          context.WidgetService._emit(context.constants.widgetEvents.created, this);
          context.WidgetService.registerWidget(this);
        },

        /**
         * get the real AUI Widget
         * @return {classes.WidgetBase}
         */
        getAUIWidget: function() {
          return this._realWidget;
        },

        /**
         * Define the widget layout on traditional mode
         * @param {!number} letterSpacing - letter spacing in pixel
         * @param {!number} fieldHeight - field height in pixel
         * @param {!number} heightPadding - height padding between 2 lines
         */
        traditionalDisplay: function(letterSpacing, fieldHeight, heightPadding) {
          const layoutInfo = this.getLayoutInformation();

          if (layoutInfo) {
            const left = layoutInfo.getGridX();
            const top = (layoutInfo.getGridY()) * (fieldHeight + 2 * heightPadding) + heightPadding;
            const width = layoutInfo.getGridWidth();
            const height = layoutInfo.getGridHeight() * fieldHeight;

            layoutInfo.getHostElement().toggleClass(layoutInfo.className, true);
            const style = this._element.parentElement.style;
            style.left = 'calc(' + left + 'ch + ' + left + ' * ' + letterSpacing + ')';
            style.top = top + 'px';
            style.width = 'calc(' + width + 'ch + ' + width + ' * ' + letterSpacing + ')';
            style.height = height + 'px';
          }
        },

        /**
         * Returns build parameters
         * @returns {{appHash: (null|*), auiTag: (null|*), inTable: (boolean|*), inFirstTableRow: (boolean|*), inMatrix: (boolean|*), inScrollGrid: *, ignoreLayout: (boolean|*)}} build parameters
         * @publicdoc
         */
        getBuildParameters: function() {
          return {
            realWidget: this._realWidget,
            appHash: this._appHash,
            appWidget: this._appWidget,
            auiTag: this._auiTag,
            inTable: this._inTable,
            inFirstTableRow: this._inFirstTableRow,
            inMatrix: this._inMatrix,
            inScrollGrid: this._inScrollGrid,
            inToolBar: this._inToolBar,
            ignoreLayout: this._ignoreLayout
          };
        },

        /**
         * Destroy style sheet related to widget
         * @private
         */
        _destroyStyle: function() {
          context.styler.removeStyleSheet(this.getUniqueIdentifier());
          if (this._stylingContext === "window") {
            const win = this.getWindowWidget();
            const sheetId = win && win.getUniqueIdentifier() || this._appHash || "_";
            context.styler.appendStyleSheet({}, this.getRootClassName(), true, sheetId);
          } else {
            context.styler.appendStyleSheet({}, this.getRootClassName(), true, this._appHash || "_");
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._destroyStyle();

          if (this._i18nTranslateChangeListener) {
            this._i18nTranslateChangeListener();
            this._i18nTranslateChangeListener = null;
          }
          this.emit(context.constants.widgetEvents.destroyed, this);
          context.WidgetService._emit(context.constants.widgetEvents.destroyed, this);
          if (this._layoutEngine) {
            this._layoutEngine.destroy();
            this._layoutEngine = null;
          }
          if (this._parentWidget && this._parentWidget.removeChildWidget) {
            this._parentWidget.removeChildWidget(this);
          }
          if (this._layoutInformation) {
            this._layoutInformation.destroy();
            this._layoutInformation = null;
          }
          document.body.off('mouseup.DetectTextSelection');
          if (this._element) {
            this._element.remove();
          }

          this._applyedBehaviors.clear();
          this._applyedBehaviors = null;

          this.__charMeasurer1 = null;
          this.__charMeasurer2 = null;
          this.__charMeasurer = null;
          this._stylesheet = null;

          this._uiWidget = null;
          this._appWidget = null;
          this._windowWidget = null;
          this._formWidget = null;
          this._tableWidgetBase = null;
          this._scrollGridWidget = null;
          this._stretchableScrollGridWidgetBase = null;
          this._folderWidget = null;
          this._element = null;

          if (this._i18nTranslateListener) {
            this._i18nTranslateListener();
            this._i18nTranslateListener = null;
          }
          this._i18NList = null;

          $super.destroy.call(this);

          context.WidgetService.unregisterWidget(this);
        },

        /**
         * Method called after the element is initialized
         * Override in inherited widgets if necessary
         * @private
         */
        _afterInitElement: function() {
          this.getElement().toggleClass("gbc_WidgetBase_standalone", !(this._inTable || this._inScrollGrid));
          this.getElement().toggleClass("gbc_WidgetBase_in_array", this._inTable || this._inScrollGrid);
          // For GBC-4255 :  this line can be removed once the highlight system is fixed.
          // PLEASE DO NOT USE THIS CSS Class for anything else
          // Don't add Technical Debt
          this.getElement().toggleClass("gbc_WidgetBase_in_grid_matrix", this._inMatrix && !this._inScrollGrid);
        },

        /**
         * Create all instances for layout management
         * @protected
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.NoLayoutEngine(this);
        },

        /**
         * function to be called by widget's layout engine when resetting the layout if needed
         */
        resetLayout: function() {},

        /**
         * Get the widget's layout information
         * @returns {classes.LayoutInformation} the widget's layout information
         * @publicdoc
         */
        getLayoutInformation: function() {
          return this._layoutInformation;
        },

        /**
         * Get the widget's layout engine
         * @returns {classes.LayoutEngineBase} the widget's layout engine
         * @publicdoc
         */
        getLayoutEngine: function() {
          return this._layoutEngine;
        },

        /**
         * Get the styling context of widget style sheet (global, window or widget);
         * @returns {string} widget styling context used in its style sheet
         */
        getStylingContext: function() {
          return this._stylingContext;
        },

        /**
         * Setups the DOM element
         * @protected
         */
        _initElement: function() {
          this._element = context.TemplateService.renderDOM(this.__templateName || this.__name, this.__ascendance);
          const id = this.getRootClassName();
          this._element.id = id;

          this._element.className += ["", this.__ascendanceClasses, id, "g_measureable"].join(" ");
          // TODO we add class g_measureable in all cases, we should probably just add this class if ignoreLayout=false
          if (!this._ignoreLayout) {
            this._initCharMeasurer();
          }
        },

        /**
         * Init the char Measurer for proper layout management
         * @private
         */
        _initCharMeasurer: function() {
          this.__charMeasurer = __charMeasurer.cloneNode(true);
          this.__charMeasurer1 = this.__charMeasurer.children[0];
          this.__charMeasurer2 = this.__charMeasurer.children[1];
          this._element.appendChild(this.__charMeasurer);
        },

        /**
         * Handle request Focus
         * @param {UIEvent} event - dom event
         */
        _onRequestFocus: function(event) {
          const isFocusable = this.isFocusable() && (this.isEnabled() || this.getDialogType() === "DisplayArray");
          if (this.isInTable()) {
            this.getTableWidgetBase().requestFocusFromWidget(this, event);
            // TODO check if test isInMatrix is still necessary with bellow check Display Array
          } else if (this.isInMatrix() || this.isInScrollGrid() || isFocusable) {
            this.emit(context.constants.widgetEvents.requestFocus, event);
          }
        },

        /**
         * Returns id widget should show application contextmenu
         * @returns {boolean} true if application contextmenu should be displayed
         */
        shouldShowApplicationContextMenu: function() {
          return true;
        },

        /**
         * Build/add extra actions to app contextmenu
         * Must be redefined by widget which must add extra actions
         * @param {classes.ContextMenuWidget} contextMenu - widget
         */
        buildExtraContextMenuActions: function(contextMenu) {

          // Clipboard actions are only added if clipboard API is available
          if (context.ClipboardService.isApiAvailable()) {

            let copyFunction = null;
            let cutFunction = null;
            let pasteFunction = null;
            let valueForClipboard = this.getValueForClipboard();
            const authorizedActions = this.getContextMenuAuthorizedActions();

            if (authorizedActions.copy && valueForClipboard) {
              copyFunction = function(contextMenu) {
                contextMenu.hide();
                gbc.ClipboardService.copyFromWidget(this, valueForClipboard).then(null);
              }.bind(this);
            }

            if (authorizedActions.cut && valueForClipboard) {
              cutFunction = function(contextMenu) {
                contextMenu.hide();
                gbc.ClipboardService.cutFromWidget(this);
              };
            }

            if (authorizedActions.paste) {
              pasteFunction = function(contextMenu) {
                contextMenu.hide();
                context.ClipboardService.pasteToWidget(this).then(null);
              };
            }

            if (cutFunction) {
              contextMenu.addAction("cut", i18next.t("gwc.clipboard.cut"), null, null, {
                clickCallback: cutFunction.bind(this, contextMenu)
              }, true);
            }

            if (this.isInTable()) {
              const valueForClipboardNoSelection = this.getValueForClipboard(true);
              const tableWidget = this.getTableWidgetBase();

              if (copyFunction && (valueForClipboardNoSelection !== valueForClipboard)) {
                contextMenu.addAction("copy", i18next.t("gwc.clipboard.copy"), null, "Control+C", {
                  clickCallback: copyFunction.bind(this, contextMenu)
                }, true);
              }

              if (valueForClipboardNoSelection && tableWidget.canShowCopyCellAndRow()) {
                const copyWidgetValueFunction = function(contextMenu) {
                  contextMenu.hide();
                  gbc.ClipboardService.copyFromWidget(this, null, true).then(null);
                }.bind(this);

                contextMenu.addAction("copyCell", i18next.t("gwc.contextMenu.copyCell"), null, null, {
                  clickCallback: copyWidgetValueFunction.bind(this, contextMenu)
                }, true);
              }

              // build table contextmenu
              tableWidget.buildExtraContextMenuActions(contextMenu);
            } else if (copyFunction) {
              contextMenu.addAction("copy", i18next.t("gwc.clipboard.copy"), null, "Control+C", {
                clickCallback: copyFunction.bind(this, contextMenu)
              }, true);
            }

            // if pasteFunction exists add it to contextmenu
            if (pasteFunction) {
              const pasteWidget = contextMenu.addAction("paste", i18next.t("gwc.clipboard.paste"), null, null, {
                clickCallback: pasteFunction.bind(this, contextMenu)
              }, true);

              context.ClipboardService.getClipboardData().then(function(txt) {
                // disabled paste action if there is nothing in the clipboard
                pasteWidget.setEnabled(!!txt);
              });
            }
          }
        },

        /**
         * Defines if the widget is focusable
         * @param {boolean} focusable - State of focusable
         * @publicdoc
         */
        setFocusable: function(focusable) {
          this._focusable = focusable;
          this._setElementAttribute('tabindex', focusable ? '0' : null);
        },

        /**
         * Returns if the widget is focusable
         * @return {boolean} State of focusable
         * @publicdoc
         */
        isFocusable: function() {
          return this._focusable;
        },

        /**
         * Tests if the widget has really the DOM focus (check document.activeElement)
         * @returns {boolean} true if the widget has the DOM focus
         */
        hasDOMFocus: function() {
          return this._element === document.activeElement;
        },

        /**
         * Initialization of internationalization engine
         * @private
         */
        _initTranslation: function() {
          // Will ask the translation once ready
          this._i18NList = this._element.querySelectorAll("[data-i18n]");
          this._i18nTranslateListener = context.I18NService.translate(this);
          this._i18nTranslateChangeListener = context.I18NService.whenLangChange(function() {
            context.I18NService.translate(this);
          }.bind(this));
        },

        /**
         * Translate the widget
         * @publicdoc
         */
        translate: function() {
          const allSelectors = this._i18NList;
          for (const element of allSelectors) {
            element.innerHTML = i18next.t(element.getAttribute("data-i18n"));
          }
        },

        /**
         * Get the unique identifier of the widget
         * @returns {string} the unique identifier of the widget
         * @publicdoc
         */
        getUniqueIdentifier: function() {
          return this._uuid;
        },

        /**
         * Get the increment identifier of the widget if linked to AUI, 0 otherwise
         * @returns {number} the increment identifier of the widget if linked to AUI, 0 otherwise
         */
        getAuiLinkedUniqueIdentifier: function() {
          return this._nUuid;
        },

        /**
         * Get the unique identifier of the application
         * @returns {string} the unique identifier of the application
         * @publicdoc
         */
        getApplicationIdentifier: function() {
          return this._appHash !== undefined ? this._appHash : null;
        },

        /**
         * Get the root element of the widget
         * @returns {HTMLElement} the root element of the widget
         * @publicdoc
         */
        getElement: function() {
          return this._element;
        },

        /**
         * Get the main class name of the widget
         * @return {string} the main class name
         * @publicdoc
         */
        getClassName: function() {
          return "gbc_" + this.__name;
        },

        /**
         * Get the name of the widget class
         * @return {string} the widget class name
         * @publicdoc
         */
        getName: function() {
          return this.__name;
        },

        /**
         * Get the Aui Tree Tag
         * @return {?number} aui tree tag
         */
        getAuiTag: function() {
          return this._auiTag;
        },

        /**
         * Get the Aui Tree Tag
         * @return {string} html class ready name
         * @private
         */
        _getAuiTagClass: function() {
          return ".aui__" + this._auiTag;
        },

        /**
         * Get the unique class name identifying a widget instance
         * @returns {*|string} the unique class name identifying a widget instance
         */
        getRootClassName: function() {
          return this._rootClassName;
        },

        /**
         * Get the CSS id selector of the widget
         * @param {string=} [subSelector] selector targeting an element below the widget's root node
         * @param {boolean=} [appliesOnRoot] true if the returned selector should match the root too.
         * @param {string} [preSelector] pre selector rule, if any
         * @returns {string} the CSS selector corresponding to the requested DOM element
         * @public
         */
        _getCssSelector: function(subSelector, appliesOnRoot, preSelector) {
          return (preSelector || "") + "#" + this.getRootClassName() +
            (appliesOnRoot ? "" : " ") +
            (subSelector || "");
        },

        /**
         * Get widget style property value
         * @param {?string} [selector] additional sub selector
         * @param {string} property property name
         * @param {boolean=} appliesOnRoot - true if the returned selector should match the root too.
         * @returns {*} property value if set, undefined otherwise
         * @publicdoc
         */
        getStyle: function(selector, property, appliesOnRoot) {
          if (!property) {
            property = selector;
            selector = null;
          }
          const cssSelector = this._getCssSelector(selector, appliesOnRoot);
          return this._stylesheet && this._stylesheet[cssSelector] && this._stylesheet[cssSelector][property];
        },

        /**
         * Updates widget style with new rules
         * @param {?string|{selector:String, preSelector:String, appliesOnRoot:boolean=}} [selector] additional sub selector
         * @param {Object.<string, *>} style style properties to set
         * @publicdoc
         */
        setStyle: function(selector, style) {
          if (!style) {
            style = selector;
            selector = null;
          }
          let subSelector = selector,
            preSelector = null,
            appliesOnRoot = null;
          if (selector && (selector.selector || selector.preSelector)) {
            subSelector = selector.selector;
            preSelector = selector.preSelector;
            appliesOnRoot = selector.appliesOnRoot;
          }
          const cssSelector = this._getCssSelector(subSelector, appliesOnRoot, preSelector);
          if (!this._stylesheet) {
            this._stylesheet = {};
          }
          let localStyle = this._stylesheet[cssSelector];
          if (!localStyle) {
            localStyle = this._stylesheet[cssSelector] = {};
          }
          const keys = Object.keys(style);
          for (const element of keys) {
            if (style[element] === null) {
              delete localStyle[element];
            } else {
              localStyle[element] = style[element];
            }
          }
          const win = this.getWindowWidget(),
            contextChanged = (this._stylingContext === "global" && win) || (this._stylingContext === "window" && !win);

          context.styler.appendStyleSheet(this._stylesheet,
            this.getRootClassName(), true, this._stylingContext === "widget" ? this.getUniqueIdentifier() : this.getStyleSheetId()
          );

          if (contextChanged) {
            this._stylingContext = win ? "window" : "global";
            if (win) {
              context.styler.appendStyleSheet({}, this.getRootClassName(), true, this._appHash || "_");
            }
          }
        },

        /**
         * Retrieve stylesheet id which stores all widget css rules
         * @returns {string|string}
         */
        getStyleSheetId: function() {
          const windowWidget = this.getWindowWidget(),
            windowWidgetId = windowWidget && windowWidget.getUniqueIdentifier();
          return windowWidgetId || this._appHash || "_";
        },

        /**
         * Get the raw styles from VM
         * @returns {?string} the raw styles from VM
         */
        getRawStyles: function() {
          return this._rawStyles;
        },
        setApplicationStyles: function(styles) {
          this._rawStyles = styles;
          let i;
          const oldClasses = this._applicationStyles,
            oldlen = oldClasses ? oldClasses.length : 0,
            newClasses = styles && styles.split(SPACES_RE),
            newlen = newClasses ? newClasses.length : 0;
          for (i = 0; i < oldlen; i++) {
            if (!newClasses || newClasses.indexOf(oldClasses[i]) < 0) {
              this.removeClass("gbc_style_" + oldClasses[i]);
            }
          }
          for (i = 0; i < newlen; i++) {
            if (!oldClasses || oldClasses.indexOf(newClasses[i]) < 0) {
              this.addClass("gbc_style_" + newClasses[i]);
            }
          }
          this._applicationStyles = newClasses;
        },

        /**
         * Defines the parent widget
         * @param {classes.WidgetGroupBase} widget - the widget to use as parent
         * @param {Object=} options - possible options
         * @param {boolean=} options.noLayoutInvalidation - won't affect parent layout
         * @publicdoc
         */
        setParentWidget: function(widget, options) {
          options = options || {};
          this._parentWidget = widget;
          if (this._layoutEngine && !options.noLayoutInvalidation) {
            this._layoutEngine.invalidateMeasure();
          }
        },

        /**
         * Get the parent widget
         * @param {*?} type - class name to look for
         * @returns {classes.WidgetGroupBase} the parent widget
         * @publicdoc
         */
        getParentWidget: function(type) {
          let result = this._parentWidget;

          if (type) {
            while (result && !result.isInstanceOf(type)) {
              result = result.getParentWidget(type);
            }

          }

          return result;
        },

        /**
         * Get the UI widget related to the widget
         * @returns {classes.UserInterfaceWidget} UserInterfaceWidget
         * @publicdoc
         */
        getUserInterfaceWidget: function() {
          if (this._uiWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.UserInterfaceWidget)) {
              result = result.getParentWidget();
            }
            this._uiWidget = result;
          }
          return this._uiWidget;
        },

        /**
         * Get Application Widget related to the widget
         * @returns {classes.ApplicationWidget} ApplicationWidget
         * @publicdoc
         */
        getApplicationWidget: function() {
          if (this._appWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.ApplicationWidget)) {
              result = result.getParentWidget();
            }
            this._appWidget = result;
          }
          return this._appWidget;
        },

        /**
         * Get the Window Widget related to the widget
         * @returns {classes.WindowWidget} WindowWidget
         * @publicdoc
         */
        getWindowWidget: function() {
          if (this._windowWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.WindowWidget)) {
              result = result.getParentWidget();
            }
            this._windowWidget = result;
          }
          return this._windowWidget;
        },

        /**
         * Get the Form Widget related to the widget
         * @returns {classes.FormWidget} FormWidget
         * @publicdoc
         */
        getFormWidget: function() {
          if (this._formWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.FormWidget)) {
              result = result.getParentWidget();
            }
            this._formWidget = result;
          }
          return this._formWidget;
        },

        /**
         * Get the table Widget base class related to the widget
         * @returns {classes.TableWidgetBase} TableWidgetBase
         * @publicdoc
         */
        getTableWidgetBase: function() {
          if (this._tableWidgetBase === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.TableWidgetBase)) {
              result = result.getParentWidget();
            }
            this._tableWidgetBase = result;
          }
          return this._tableWidgetBase;
        },

        /**
         * Get the scrollgrid Widget class related to the widget
         * @returns {classes.ScrollGridWidget} ScrollGridWidget
         * @publicdoc
         */
        getScrollGridWidget: function() {
          if (this._scrollGridWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.ScrollGridWidget)) {
              result = result.getParentWidget();
            }
            this._scrollGridWidget = result;
          }
          return this._scrollGridWidget;
        },

        /**
         * Get the stretchable scrollgrid Widget base class related to the widget
         * @returns {classes.StretchableScrollGridWidgetBase} StretchableScrollGridWidgetBase
         * @publicdoc
         */
        getStretchableScrollGridWidgetBase: function() {
          if (this._stretchableScrollGridWidgetBase === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.StretchableScrollGridWidgetBase)) {
              result = result.getParentWidget();
            }
            this._stretchableScrollGridWidgetBase = result;
          }
          return this._stretchableScrollGridWidgetBase;
        },

        /**
         * Get the Folder Widget related to the widget
         * @returns {classes.FolderWidget} FolderWidget
         * @publicdoc
         */
        getFolderWidget: function() {
          if (this._folderWidget === null) {
            let result = this;
            while (result && !result.isInstanceOf(gbc.classes.FolderWidget)) {
              result = result.getParentWidget();
            }
            this._folderWidget = result;
          }
          return this._folderWidget;
        },

        /**
         * Check if this widget is a child of a given one
         * @param {classes.WidgetBase} parent the reference parent widget
         * @return {boolean} true if is a child, false otherwise
         * @publicdoc
         */
        isChildOf: function(parent) {
          let result = this.getParentWidget();
          while (result && result !== parent) {
            result = result.getParentWidget();
          }
          return Boolean(result);
        },

        /**
         * Replace the current widget with a given one
         * @param {classes.WidgetBase} widget the new widget
         * @publicdoc
         */
        replaceWith: function(widget) {
          if (this._parentWidget) {
            this._parentWidget.replaceChildWidget(this, widget);
          }
        },

        /**
         * Detach the widget from the dom
         * @publicdoc
         */
        detach: function() {
          if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
          } else {
            context.LogService.warn("Trying to detach a widget which is already outside of DOM " + this.__name);
          }
        },

        /**
         * Set widget current dialog type.
         * Can be Input, Input Array, Display, Display Array or Construct
         * @param {string} dialogType Dialog type
         * @publicdoc
         */
        setDialogType: function(dialogType) {
          this._dialogType = dialogType;
        },

        /**
         * return widget current dialog type
         * @returns {string} values can be : Input, InputArray, Display, DisplayArray or Construct
         * @publicdoc
         */
        getDialogType: function() {
          return this._dialogType;
        },

        /**
         * Defines the enabled status of the widget
         * @param {boolean} enabled true if the widget allows user interaction, false otherwise.
         * @publicdoc
         */
        setEnabled: function(enabled) {
          if (this._enabled !== Boolean(enabled)) {
            this._enabled = Boolean(enabled);
            if (this._enabled) {
              this.removeClass("disabled");
            } else {
              this.addClass("disabled");
            }
          }
        },

        /**
         * Check if widget is enabled
         * @returns {boolean} true if the widget allows user interaction, false otherwise.
         * @publicdoc
         */
        isEnabled: function() {
          return this._enabled;
        },

        /**
         * Defines if the widget should be hidden or not
         * @param {boolean} hidden true if the widget is hidden, false otherwise
         * @publicdoc
         */
        setHidden: function(hidden) {
          if (this._hidden !== Boolean(hidden)) {
            this._hidden = Boolean(hidden);
            if (this._element) {
              if (this._hidden) {
                this.addClass("hidden");
              } else {
                this.removeClass("hidden");
              }
            }
            // update replacer element visibility as well if existing
            if (this.hasReplacer()) {
              this.getReplacer().toggleClass("hidden", this._hidden);
            }
            if (this._layoutEngine) {
              this._layoutEngine.changeHidden(hidden);
            }
            this.emit(context.constants.widgetEvents.visibilityChange);
          }
        },

        /**
         * Check if the widget is hidden
         * @returns {boolean} true if the widget is hidden, false otherwise
         * @publicdoc
         */
        isHidden: function() {
          return this._hidden;
        },

        /**
         * Check if the widget is part of layout computing
         * @param {boolean} [deep] true to test against parent widgets as well
         * @returns {boolean} true if the widget is part of layout computing
         */
        isLayoutMeasureable: function(deep) {
          if (!deep) {
            return !this.isHidden();
          }
          if (this.isHidden()) {
            return false;
          }
          let parent = this;
          while (parent) {
            if (!parent.isLayoutMeasureable()) {
              return false;
            }
            if (parent.isLayoutTerminator() && parent.isLayoutMeasureable()) {
              return true;
            }
            parent = parent.getParentWidget();
          }
          return true;
        },

        /**
         * Check if the widget is visible
         * @return {boolean} true if visible, false otherwise
         * @publicdoc
         */
        isVisible: function() {
          return !this.isHidden();
        },

        /**
         * Check if widget or one of its parent is hidden
         * @return {boolean} true if hidden, false otherwise
         */
        isHiddenRecursively: function() {
          let parent = this;
          while (parent) {
            if (parent.isHidden()) {
              return true;
            }
            parent = parent.getParentWidget();
          }
          return false;
        },

        /**
         * Check if widget and all of its parent are visible
         * @return {boolean} true if visible, false otherwise
         */
        isVisibleRecursively: function() {
          let parent = this;
          while (parent) {
            if (!parent.isVisible()) {
              return false;
            }
            parent = parent.getParentWidget();
          }
          return true;
        },

        isLayoutTerminator: function() {
          return false;
        },

        /**
         * Remove or add borders to the widget
         * @param {boolean} noBorder - true if the widget has no border class, false otherwise
         * @publicdoc
         */
        setNoBorder: function(noBorder) {
          if (this._noBorder !== Boolean(noBorder)) {
            this._noBorder = Boolean(noBorder);
            if (this._noBorder) {
              this.addClass("gbc_NoBorder");
            } else {
              this.removeClass("gbc_NoBorder");
            }
          }
        },

        /**
         * Check if the widget is displayed without border
         * @returns {boolean} true if the widget has no border class, false otherwise
         * @publicdoc
         */
        isNoBorder: function() {
          return this._noBorder;
        },

        /**
         * Set the title of the widget
         * @param {string} title - the tooltip text
         * @publicdoc
         */
        setTitle: function(title) {
          if (this.getTitle() === title) {
            return;
          }

          if (title === "") {
            this._setElementAttribute("title", null);
            this.setAriaAttribute("label", null);
          } else {
            this._setElementAttribute("title", title);
            this.setAriaAttribute("label", title);
          }
        },

        /**
         * Get the title of the widget
         * @returns {string} the tooltip text
         * @publicdoc
         */
        getTitle: function() {
          return this._element.getAttribute("title");
        },

        /**
         * Called when widget obtains the focus
         * @param {boolean} [fromMouse] - true if focus comes from mouse event
         * @param {boolean} [stayOnSameWidget] - true if we want to set the focus to the current focused widget
         * @publicdoc
         */
        setFocus: function(fromMouse, stayOnSameWidget) {
          const userInterfaceWidget = this.getUserInterfaceWidget();
          if (userInterfaceWidget) {
            userInterfaceWidget.setFocusedWidget(this);
            // emit current view change (used for hbox splitview)
            userInterfaceWidget.emit(context.constants.widgetEvents.splitViewChange);
            this.setAriaSelection();
          }

          // rare case when we are going to focus a hidden widget. To avoid fallback focus to body, we focus userinterface widget instead.
          if (this.isHidden()) {
            const uiWidget = this.getUserInterfaceWidget();
            if (uiWidget) {
              uiWidget.getElement().domFocus();
            }
          }
        },

        /**
         * Called before setting VM focus to notify previous VM focused widget
         * @param {classes.WidgetBase} vmNewFocusedWidget - new widget which get the focus
         * @publicdoc
         */
        loseVMFocus: function(vmNewFocusedWidget = null) {
          // if widget which lost focus is in a value container
          // and widget which get the focus is not in the same container
          // call lostVMFocus function on its container

          // table
          let oldTableWidgetBase = this.getTableWidgetBase();
          let newTableWidgetBase = vmNewFocusedWidget.getTableWidgetBase();
          if (oldTableWidgetBase &&
            oldTableWidgetBase !== this &&
            oldTableWidgetBase !== newTableWidgetBase) {
            oldTableWidgetBase.loseVMFocus(vmNewFocusedWidget);
            return;
          }

          // stretchable scrollgrid
          let oldStretchableScrollGridBase = this.getStretchableScrollGridWidgetBase();
          let newStretchableScrollGridBase = vmNewFocusedWidget.getStretchableScrollGridWidgetBase();
          if (oldStretchableScrollGridBase &&
            oldStretchableScrollGridBase !== this &&
            oldStretchableScrollGridBase !== newStretchableScrollGridBase) {
            oldStretchableScrollGridBase.loseVMFocus(vmNewFocusedWidget);
          }
        },

        /**
         * Called before setFocus to notify previous focused widget
         * @publicdoc
         */
        loseFocus: function() {},

        /**
         * Check if widget node has VM focus
         * @returns {boolean} true if widget node has VM focus
         * @publicdoc
         */
        hasFocus: function() {
          const ui = this.getUserInterfaceWidget();
          return !ui || this === ui.getFocusedWidget();
        },

        /**
         * Checks if the widget element has the given class
         * @param {string} className - class to check
         * @publicdoc
         */
        hasClass: function(className) {
          return this._element.hasClass(className);
        },

        /**
         * Add the given class to element
         * @param {string} className - class to add
         * @publicdoc
         */
        addClass: function(className) {
          this._element.addClass(className);
        },

        /**
         * Remove the given class from element
         * @param {string} className - class to delete
         * @publicdoc
         */
        removeClass: function(className) {
          this._element.removeClass(className);
        },

        /**
         * Toggle the given class to element
         * @param {string} className - class to toggle
         * @param {string|boolean} className2 - class added if switcher is false
         * @param {boolean=} switcher forced new state
         * @publicdoc
         */
        toggleClass: function(className, className2, switcher) {
          this._element.toggleClass(className, className2, switcher);
        },

        /**
         * Add QA information to the widget
         * @param {string} name - AUI tree name
         * @param {string} value - AUI tree value
         */
        setQAInfo: function(name, value) {
          if (this._element) {
            this._setElementAttribute("data-gqa-" + name, value);
          }
        },

        /**
         * Defines the AUI tree name of the widget
         * @param {string} name the name
         */
        setAuiName: function(name) {
          if (this._element && (name !== this._auiName)) {
            this._auiName = name;
            this._setElementAttribute("data-aui-name", name);
          }
        },

        /**
         * Check if the widget is in a table
         * @param {classes.TableWidgetBase} table - specific table, if null just return if widget is in any table
         * @returns {boolean} true if the widget is in a table, false otherwise.
         * @publicdoc
         */
        isInTable: function(table = null) {
          return this._inTable && ((table === null) || (this.getTableWidgetBase() === table));
        },

        /**
         * Check if the widget is in a scrollGrid
         * @param {classes.WidgetBase} scrollGrid - specific scrollGrid, if null just return if widget is in any scrollGrid
         * @returns {boolean} true if the widget is in a table, false otherwise.
         * @publicdoc
         */
        isInScrollGrid: function(scrollGrid = null) {
          const inSpecificScrollGrid = this.getStretchableScrollGridWidgetBase() === scrollGrid || this.getScrollGridWidget() === scrollGrid;
          return this._inScrollGrid && ((scrollGrid === null) || inSpecificScrollGrid);
        },

        /**
         * Check if the widget is in a matrix
         * @returns {boolean} true if the widget is in a matrix, false otherwise.
         * @publicdoc
         */
        isInMatrix: function() {
          return this._inMatrix;
        },

        /**
         * Check if the widget is in an array (table, matrix or scrollgrid)
         * @returns {boolean} true if the widget is in an array, false otherwise.
         * @publicdoc
         */
        isInArray: function() {
          return this.isInTable() || this.isInMatrix() || this.isInScrollGrid();
        },

        /**
         * Does the widget ignore layouting
         * @returns {boolean} true if the widget ignore all layout.
         * @publicdoc
         */
        ignoreLayout: function() {
          return this._ignoreLayout;
        },

        /**
         * Set Arabic mode
         * @param {boolean} rtl - true if widget is right to left
         * @publicdoc
         */
        setReverse: function(rtl) {
          if (this._isReversed !== rtl) {
            this._isReversed = rtl;
            if (rtl) {
              this.addClass("reverse");
            } else {
              this.removeClass("reverse");
            }
          }
        },

        /**
         * Check if arabic mode is enabled
         * @return {boolean} true if enabled
         * @publicdoc
         */
        isReversed: function() {
          return this._isReversed;
        },

        /**
         * Get start (for reversed mode)
         * @return {string} start keyword for rtl
         * @publicdoc
         */
        getStart: function() {
          return this.isReversed() ? "right" : "left";
        },

        /**
         * Get end (for reversed mode)
         * @return {string} end keyword for rtl
         * @publicdoc
         */
        getEnd: function() {
          return this.isReversed() ? "left" : "right";
        },

        /**
         * Method called when the widget is attached/detached from the DOM
         * Override this in inherited widget if necessary
         */
        _setDOMAttachedOrDetached: function() {},

        /**
         * Returns if element is in the DOM
         * @return {boolean} true if element in the DOM
         */
        isElementInDOM: function() {
          return Boolean(this._element) && this._element.isInDOM();
        },

        /**
         * Add the widget in the DOM
         */
        addInDom: function() {
          if (!this.getElement().parentNode && this._replacerElement && this._replacerElement.parentNode) {
            this._replacerElement.parentNode.replaceChild(this.getElement(), this._replacerElement);
          }
        },

        /**
         * Remove widget from DOM and replace it by an empty DIV
         */
        removeFromDom: function() {
          if (this.getElement() && this.getElement().parentNode) {
            this.getElement().parentNode.replaceChild(this.getReplacer(), this.getElement());
            this.getReplacer().toggleClass("hidden", this.isHidden());
          }
        },

        /**
         * DOM node intended to replace a widget node temporarely
         * @returns {HTMLDivElement}
         */
        getReplacer: function() {
          if (!this._replacerElement) {
            this._replacerElement = document.createElement("div");
            this._replacerElement.setAttribute("tabindex", "0");
            this._replacerElement.classList.add("replacer");
          }
          return this._replacerElement;
        },

        /**
         * Returns true if widget has an existing replacer element
         * @returns {boolean}
         */
        hasReplacer: function() {
          return !!this._replacerElement;
        },

        /**
         * Could the widget get interrupt?
         * @param {boolean} interruptable - true if interruptable, false otherwise
         */
        setInterruptable: function(interruptable) {
          this._interruptable = interruptable;
          if (this._element) {
            this._setElementAttribute("interruptable", interruptable ? "interruptable" : null);
          }
        },
        /**
         * returns true if widget acts as an interruptable
         * @return {boolean} true if widget acts as an interruptable
         */
        isInterruptable: function() {
          return this._interruptable;
        },

        /**
         * Updates widget interruptable active
         * @param isActive is interruptable active?
         */
        setInterruptableActive: function(isActive) {
          if (this._element) {
            this._setElementAttribute("interruptable-active", isActive ? "interruptable-active" : null);
          }
        },

        /**
         * Make the widget flash (basically when some action are forbidden)
         * @param {Number?} duration - flash duration in ms (default 50ms)
         */
        flash: function(duration) {
          if (this.isEnabled()) {
            this.addClass("disabled");
            this._registerTimeout(function() {
              this.removeClass("disabled");
            }.bind(this), duration || 50);
          }
        },

        /**
         * Returns if widget has cursors
         * @return {boolean} true if widget has cursors
         */
        hasCursors: function() {
          // if widget has setCursors & getCursors functions defined -> it supports cursors
          return this.setCursors && this.getCursors;
        },

        /**
         * Manage clipboard on paste data to the widget
         * @param {string} text - pasted text
         */
        manageClipboardPaste: function(text) {
          // Do whatever with text data
        },

        /**
         * Manage data to be copied to the clipboard
         * @param {string} copiedText - is the text copied by clipboard
         * @returns {string} the modified text, default is unchanged
         */
        manageClipboardCopy: function(copiedText) {
          // Do whatever with text data you want to be added to the clipboard when copy
          return copiedText;
        },

        /**
         * Manage cut data to be copied to the clipboards
         */
        manageClipboardCut: function() {},

        /**
         * Manage local action
         * @param {string} localActionName - local action name

         */
        manageLocalAction: function(localActionName) {},

        /**
         * Manage key
         * @param {string} keyString - key string representation
         * @param {Object} domKeyEvent - key event from DOM
         * @param {boolean} repeat - true if key is being pressed
         * @returns {boolean} returns if the domKeyEvent has been processed by the widget
         */
        manageKeyDown: function(keyString, domKeyEvent, repeat) {
          if (this.isInTable()) {
            return this.getTableWidgetBase().manageKeyDown(keyString, domKeyEvent, repeat);
          }
          return false;
        },

        /**
         * Manage key before any action
         * @param {string} keyString - key string representation
         * @param {Object} domKeyEvent - key event from DOM
         * @param {boolean} repeat - true if key is being pressed
         * @returns {boolean} returns if the domKeyEvent has been processed by the widget
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          if (this.isInTable()) {
            return this.getTableWidgetBase().managePriorityKeyDown(keyString, domKeyEvent, repeat);
          } else if (this.isInScrollGrid()) {
            let scrollGridWidget = this.getScrollGridWidget() || this.getStretchableScrollGridWidgetBase();
            return scrollGridWidget.managePriorityKeyDown(keyString, domKeyEvent, repeat);
          }
          return false;
        },

        /**
         * Manage key once released (on key up).
         * @param {string} keyString - keys string representation (can be a combinaison eg: shift+a)
         * @param {Object} domKeyEvent - key event from DOM
         */
        manageKeyUp: function(keyString, domKeyEvent) {
          if (this.isInTable()) {
            this.getTableWidgetBase().manageKeyUp(keyString, domKeyEvent);
          }
        },

        /**
         * Manage mouse down
         * @param {*} domEvent - mouse down event from DOM
         * @returns {boolean} returns if event must be bubbled to parent DOM widget
         */
        manageMouseDown: function(domEvent) {
          return true;
        },

        /**
         * Manage mouse up
         * @param {*} domEvent - mouse up event from DOM
         * @returns {boolean} returns if event must be bubbled to parent DOM widget
         */
        manageMouseUp: function(domEvent) {
          return true;
        },

        /**
         * Manage mouse click
         * @param {*} domEvent - mouse click event from DOM
         * @returns {boolean} returns if event must be bubbled to parent DOM widget
         */
        manageMouseClick: function(domEvent) {
          if (this.isInTable()) {
            this.emit(context.constants.widgetEvents.tableClick, domEvent);
          }

          return true;
        },

        /**
         * Manage mouse double click
         * @param {*} domEvent - mouse dblclick event from DOM
         * @returns {boolean} returns if event must be bubbled to parent DOM widget
         */
        manageMouseDblClick: function(domEvent) {
          return true;
        },

        /**
         * Manage mouse right click
         * @param {*} domEvent - mouse click event from DOM
         * @returns {boolean} returns if event must be bubbled to parent DOM widget
         */
        manageMouseRightClick: function(domEvent) {

          if (domEvent.shiftKey) {
            return false; // don't show context menu if shift key is pressed
          }

          if (context.DebugService.isActive() && domEvent.ctrlKey) {
            domEvent.preventCancelableDefault();
            return false; // right click + CTRL is used to show debugTree
          }

          this._onRequestFocus(domEvent); // request focus
          if (this.isInTable()) {
            this.emit(context.constants.widgetEvents.tableClick, domEvent);
          }

          if (this.shouldShowApplicationContextMenu()) {
            const appWidget = this.getApplicationWidget();
            if (domEvent.target.elementOrParent && appWidget && context.ThemeService.getValue("theme-disable-context-menu") === false) {
              if (!domEvent.target.elementOrParent("gbc_ContextMenuWidget")) { // if right-click is not on a contextmenu
                appWidget.showContextMenu(domEvent, this);
              } else {
                // If right-click on context menu item: use a regular click instead
                domEvent.preventCancelableDefault();
                this.manageMouseClick(domEvent);
              }
              return false; // if contextmenu is managed by this widget don't bubble
            }
          }
          return false;
        },

        /**
         * Manage input
         * @param {String} [dataString] - string with the inserted characters
         * @param {*} [event] - input event from DOM
         */
        manageInput: function(dataString = "", event = null) {},

        /**
         * Manage beforeinput
         * @param {String} [dataString] - string with the inserted characters
         * @param {*} [event] - beforeinput event from DOM
         * @return {boolean} returns true if ok, false if input is not allowed
         */
        manageBeforeInput: function(dataString = "", event = null) {
          return true;
        },

        /**
         * Define the aria role of this widget,
         * Mostly already defined in template
         * @param {string} roleName - aria role name to set
         */
        setAriaRole: function(roleName) {
          if (roleName && this._element) {
            this._setElementAttribute("role", roleName);
          }
        },

        /**
         * Set the aria attribute of this widget,
         * @param {string} attrName - aria attribute Name to set
         * @param {*} attrVal - aria attribute value to set
         */
        setAriaAttribute: function(attrName, attrVal) {
          if (this._element && attrName) {
            this._setElementAttribute("aria-" + attrName, attrVal);
          }
        },

        /**
         * Get the aria attribute of this widget,
         * @param {string} attrName - aria attribute Name to get
         * @return {*} aria attribute value
         */
        getAriaAttribute: function(attrName) {
          if (this._element && attrName) {
            return this._element.getAttribute("aria-" + attrName);
          }
        },

        /**
         * Set the aria-selected attribute to help screen-reader to know wich widget is the current one
         */
        setAriaSelection: function() {
          this.domAttributesMutator(function() {
            const currentSelected = document.querySelector('[aria-selected="true"]');
            if (currentSelected) {
              currentSelected.removeAttribute('aria-selected');
            }
          });
          this.setAriaAttribute('selected', "true");
        },

        /**
         * Set the widget has "expanded" for better accessibility
         * @param {Boolean} expanded - true if widget is expanded, false otherwise
         */
        setAriaExpanded: function(expanded) {
          this.setAriaAttribute("expanded", expanded);
        },

        /**
         * Get the value to put in the clipboard when copying
         * @param {boolean} [ignoreSelection] true to send the widget value
         * @return {?string}
         */
        getValueForClipboard: function(ignoreSelection = false) {
          return null;
        },

        /**
         * Helper method to update attirbutes in DOM using buffering system
         * @param {string} attr the attribute name
         * @param {*} val the attribute new value
         * @param {string|Function} [elementSelector] a string identifier of this class member or a method returning the element to set the attributes value
         * @protected
         */
        _setElementAttribute: function(attr, val, elementSelector) {
          let target = null;
          if (elementSelector) {
            if (typeof elementSelector === "string") {
              target = this[elementSelector];
            } else if (typeof elementSelector === "function") {
              target = elementSelector(this);
            }
          } else {
            target = this._element;
          }
          if (target) {
            if (val === null || val === "" || typeof(val) === "undefined") {
              target.removeAttribute(attr);
            } else {
              target.setAttribute(attr, val.toString());
            }
          }
        },

        /**
         * Helper method to update textContent in DOM using buffering system
         * @param {string} text the new text
         * @param {string|function} [elementSelector] a string identifier of this class member or a method returning the element to set the textContent
         * @protected
         */
        _setTextContent: function(text, elementSelector) {
          this.domAttributesMutator(function(text, elementSelector) {
            let target = null;
            if (elementSelector) {
              if (typeof elementSelector === "string") {
                target = this[elementSelector];
              } else if (typeof elementSelector === "function") {
                target = elementSelector(this);
              }
            } else {
              target = this._element;
            }
            if (target) {
              target.textContent = text;
            }
          }.bind(this, text, elementSelector));
        },

        /**
         * Use this to update attributes of dom nodes using a buffering system
         * @param fn the function to bufferize - don't forget to bind to context
         */
        domAttributesMutator: function(fn) {
          const appWidget = this.getApplicationWidget();
          if (!appWidget || !appWidget.domAttributesMutationBuffer(fn, this)) {
            fn();
          }
        },

        /**
         * @param fn the function to bufferize - don't forget to bind to context
         */
        afterDomMutator: function(fn) {
          const appWidget = this.getApplicationWidget();
          if (!appWidget || !appWidget.afterDomMutationBuffer(fn, this)) {
            this._registerAnimationFrame(fn); // TODO why doing requestAnimationFrame in this case ?
          }
        },

        /**
         * True if the widget accept input when it is inside inactive windows
         * @return {boolean}
         */
        acceptEventWhenWindowInactive: function() {
          return this._acceptEventWhenWindowInactive;
        },

        /**
         * Set if the widget accept events inside inactive windows
         * @param acceptEvent
         */
        setAcceptEventWhenWindowInactive: function(acceptEvent) {
          this._acceptEventWhenWindowInactive = acceptEvent;
        },

        /**
         * Add a behaviour name to the applied behaviours
         * @param {string} name behaviour name
         */
        addAppliedBehavior: function(name) {
          this._applyedBehaviors.add(name);
        },

        /**
         * true if the behaviour wad already applied
         * @param {string} name behaviour name
         * @return {boolean}
         */
        isAppliedBehavior: function(name) {
          return this._applyedBehaviors.has(name);
        },

        /**
         * Get the contextmenu authorized actions
         * @returns {object}
         */
        getContextMenuAuthorizedActions: function() {
          return {
            paste: false,
            copy: false,
            cut: false,
            selectAll: false
          };
        }
      };
    });
  });
