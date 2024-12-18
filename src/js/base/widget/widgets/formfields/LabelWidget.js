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

modulum('LabelWidget', ['TextWidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Label widget.
     * @class LabelWidget
     * @memberOf classes
     * @extends classes.TextWidgetBase
     * @publicdoc Widgets
     */
    cls.LabelWidget = context.oo.Class(cls.TextWidgetBase, function($super) {
      return /** @lends classes.LabelWidget.prototype */ {
        __name: 'LabelWidget',
        __dataContentPlaceholderSelector: cls.WidgetBase.selfDataContent,
        /**
         * @type {HTMLElement}
         */
        _textContainer: null,
        /** @type {boolean} */
        _hasHTMLContent: false,
        _htmlFilter: null,
        _value: null,
        _displayFormat: null,

        /**
         * true if we must sanitize the html
         * @type {boolean}
         * */
        _sanitize: null,

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.LeafLayoutEngine(this);
            this._layoutInformation.forcedMinimalWidth = 16;
            this._layoutInformation.forcedMinimalHeight = 16;
            if (this.isInTable() && this._layoutInformation.getSizePolicyConfig().mode === "initial") {
              // in a table, widget is measured only one time at start of the application (and after when theme is changing)
              // for label widget "initial" size policy means "dynamic" at first measure and "fixed" after
              // therefore when measuring label in a table, we must always consider widget with size policy "dynamic"
              // to measure correctly the widget especially when the user changes the theme
              this._layoutInformation.setSizePolicyMode("dynamic");
            }
          }
        },

        /**
         * @inheritDoc
         */
        resetLayout: function() {
          if (this._layoutInformation) {
            this._layoutInformation._initialMeasure = false;
            this._layoutInformation.invalidateInitialMeasure(false, this._value !== null && this._value !== '' && this._value !==
              false && this._value !== 0);
          }
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          this._textContainer = this._element.getElementsByTagName('span')[0];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._textContainer = null;
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
          this._onRequestFocus(domEvent);
          this.emit(context.constants.widgetEvents.click, domEvent);
          return $super.manageMouseClick.call(this, domEvent);
        },

        /**
         * Get the display format
         * @return {?string} could be null, or 'html'
         * @publicdoc
         */
        getDisplayFormat: function() {
          return this._displayFormat;
        },

        /**
         * Set current display format to use on each set value
         * @param {string} format the display format
         * @publicdoc
         */
        setDisplayFormat: function(format) {
          this._displayFormat = format;
        },

        /**
         * @inheritDoc
         */
        setValue: function(value) {
          const formattedValue = value;
          const hadValue = this._value !== null && this._value !== '' && this._value !== false && this._value !== 0;
          const hasValue = formattedValue !== null && formattedValue !== '' && formattedValue !== false && formattedValue !== 0;
          if (this._layoutInformation) {
            this._layoutInformation.invalidateInitialMeasure(hadValue, hasValue);
          }
          this._value = formattedValue || null;
          this.domAttributesMutator(function() {
            if (this._hasHTMLContent === true) {
              if (this._sanitize) {
                if (!this._htmlFilter) {
                  this._htmlFilter = cls.WidgetFactory.createWidget('HtmlFilterWidget', this.getBuildParameters());
                }
                this._textContainer.innerHTML = this._htmlFilter.sanitize(formattedValue);
              } else {
                this._textContainer.innerHTML = formattedValue;
              }
            } else {
              let newValue = (formattedValue || formattedValue === 0 || formattedValue === false) ? formattedValue : '';
              if (this.isInTable()) {
                newValue = newValue.replace(/\n/g, " "); // no newline in label in table
              }
              this._textContainer.textContent = newValue;
              this._textContainer.toggleClass("is-empty-label", newValue === "");
            }
          }.bind(this));
          if (this._layoutEngine) {
            if (!hadValue && hasValue) {
              this._layoutEngine.forceMeasurement();
            }
            this._layoutEngine.invalidateMeasure();
          }
        },

        /**
         * @inheritDoc
         */
        getValue: function() {
          if (this._hasHTMLContent === true) {
            return this._textContainer.innerHTML;
          } else {
            const content = this._textContainer.textContent;
            if (content === '\u00a0') {
              return '';
            }
            return content;
          }
        },

        /**
         * @inheritDoc
         */
        getValueForClipboard: function(ignoreSelection = false) {
          let valueForCB = null;
          if (!ignoreSelection) {
            valueForCB = window.getSelectionText();
            valueForCB = valueForCB.length > 0 ? valueForCB : null;
          }
          if (valueForCB === null) {
            valueForCB = this.getValue();
          }
          return valueForCB;
        },

        /**
         * @inheritDoc
         */
        setFocus: function(fromMouse) {
          this._element.domFocus();
        },

        /**
         * Add some html formating
         * @param {HTMLElement} jcontrol - holder for html content
         */
        setHtmlControl: function(jcontrol) {
          jcontrol.innerHTML = this.getValue();
          jcontrol.addClass('gbc-label-text-container');
          jcontrol.setAttribute("__" + this.__name, "");
          this._textContainer.replaceWith(jcontrol);
          this._textContainer = jcontrol;
          this._hasHTMLContent = true;
        },

        /**
         * sanitize = false : Authorize to send html text without control
         * @param {boolean} sanitize
         */
        setSanitize: function(sanitize) {
          this._sanitize = sanitize;
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
    cls.WidgetFactory.registerBuilder('Label', cls.LabelWidget);
  });
