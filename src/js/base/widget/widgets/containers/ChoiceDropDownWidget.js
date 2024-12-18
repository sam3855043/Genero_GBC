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

modulum('ChoiceDropDownWidget', ['DropDownWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Choice DropDown widget.
     * @class ChoiceDropDownWidget
     * @memberOf classes
     * @extends classes.DropDownWidget
     */
    cls.ChoiceDropDownWidget = context.oo.Class(cls.DropDownWidget, function($super) {
      return /** @lends classes.ChoiceDropDownWidget.prototype */ {
        $static: {
          widgetEvents: {
            currentChildrenChange: "currentChildrenChange",
          }
        },
        __name: "ChoiceDropDownWidget",
        __templateName: "DropDownWidget",
        /**
         * Indicated if dropdown can handle a multiple' items selection. In this case dropdown isn't closed on item click
         * @type {boolean}
         */
        _allowMultipleChoices: false,
        /**
         * Current highlighted & selected element
         * @type {HTMLElement}
         */
        _currentElement: null,

        /**
         * Value validate by a user action
         * @type {boolean}
         *
         */
        _userValidationAction: false,

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);

          // on dropdown close reset current children selected
          this.onClose(function() {
            this.setCurrentPosition(null);
          }.bind(this));

          this.onOpen(this._addHoverBindings.bind(this));
          this.onClose(this._removeHoverBindings.bind(this));
        },

        /**
         * Bind dropdown items hover styling events
         * @private
         */
        _addHoverBindings: function() {
          if (!window.isMobile()) {
            this._element.on('mouseover.ChoiceDropDownWidget', this._onHover.bind(this));
          } else {
            this._element.on('touchstart.ChoiceDropDownWidget', this._onHover.bind(this));
          }
        },

        /**
         * Remove dropdown items hover styling events
         * @private
         */
        _removeHoverBindings: function() {
          if (!window.isMobile()) {
            this._element.off('mouseover.ChoiceDropDownWidget');
          } else {
            this._element.off('touchstart.ChoiceDropDownWidget');
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._removeHoverBindings();

          if (this.getChildren() && this.getChildren().length > 0) {
            console.warn("We are destroying " + this.getParentWidget().__name +
              " DropDown whereas it still has children. We will automatically destroy children. Please verify how DropDown has been implemented as this may be a side effect."
            );
            this.destroyChildren();
          }

          $super.destroy.call(this);
        },

        /**
         * Mouse/touch handler used to highlight current item.
         * We can't use css :hover otherwise there will be duplicated highlights with keyboard navigation
         * @param event
         * @private
         */
        _onHover: function(event) {
          const element = event.target;
          if (element) {
            const widgetElement = element.hasClass("gbc_WidgetBase") ? element : element.parent("gbc_WidgetBase");
            this._highlightCurrentItem(widgetElement);
          }
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isVisible()) {
            keyProcessed = true;
            const app = context.SessionService.getCurrent().getCurrentApplication();
            switch (keyString) {
              case "enter":
              case "return":
                app.scheduler.callbackCommand(this._onClick.bind(this, null, this.getCurrentChildren()));
                break;
              case "up":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, -1));
                break;
              case "down":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, 1));
                break;
              case "pageup":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, -10));
                break;
              case "pagedown":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, 10));
                break;
              case "home":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, Number.NEGATIVE_INFINITY));
                break;
              case "end":
                app.scheduler.callbackCommand(this.navigateTo.bind(this, Number.POSITIVE_INFINITY));
                break;
              default:
                keyProcessed = false;
            }
          }
          keyProcessed = $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat) || keyProcessed;
          return keyProcessed;
        },

        /**
         * Navigate through a dropdown item using step number. Main method used in keyboard navigation
         * @param {number} pos - position of the item to select
         * @publicdoc
         */
        navigateTo: function(pos) {
          if (this.getParentWidget() && !this.getParentWidget().isDestroyed()) {
            let nextChild = null;
            // get new item position
            let newPos = this.getIndexOfChild(this.getCurrentChildren()) + pos;
            // if new item position if outside of limits
            if (newPos < 0 || newPos > (this.getChildren().length - 1)) {
              // we fall back to first or last item
              if (newPos < 0) {
                newPos = 0;
              } else {
                newPos = this.getChildren().length - 1;
              }
              nextChild = this.getChildren()[newPos];
              // if first or last item isn't focusable, then we end the navigation
              if (!nextChild.isEnabled() || nextChild.isHidden()) {
                return;
              }
            } else {
              // get new item
              nextChild = this.getChildren()[newPos];
            }
            // if new item isn't focusable, we continue navigation
            if (!nextChild.isEnabled() || nextChild.isHidden()) {
              return this.navigateTo(pos < 0 ? pos - 1 : pos + 1);
            }

            // new item validated
            this.setCurrentPosition(nextChild);
            if (!this.isVisible()) {
              this.emit(context.constants.widgetEvents.select, this.getCurrentValue());
            }
          }
        },

        /**
         * Update selected item (highlight + position update + childrenChange emit)
         * @param {classes.WidgetBase} currentChildren - children to set position at
         * @publicdoc
         */
        setCurrentPosition: function(currentChildren) {
          if (currentChildren !== null) {
            this._highlightCurrentItem(currentChildren.getElement());
            this.scrollItemIntoView(currentChildren.getElement());
            this.getParentWidget().emit(cls.ChoiceDropDownWidget.widgetEvents.currentChildrenChange, currentChildren);
          } else {
            this._highlightCurrentItem(null);
          }
        },

        /**
         * Highlight current item of the dropdown
         * @param widgetElement
         * @private
         */
        _highlightCurrentItem: function(widgetElement) {
          if (this._currentElement && this._currentElement !== widgetElement) {
            this._currentElement.removeClass("current");
          }
          this._currentElement = widgetElement;
          if (this._currentElement &&
            !this._currentElement.hasClass("current") &&
            !this._currentElement.hasClass("hidden") &&
            (!this._currentElement.hasClass("disabled") || this._currentElement.hasAttribute("interruptable-active"))) {
            this._currentElement.addClass("current");
          }
        },

        /**
         * Returns current widget element being selected (flagged with 'current' class)
         * @returns {?HTMLElement} The current child DOM element
         * @publicdoc
         */
        getCurrentElement: function() {
          return this._currentElement;
        },

        /**
         * @inheritDoc
         */
        loseFocus: function() {
          $super.loseFocus.call(this);
          this._userValidationAction = false;
        },

        /**
         * Hide all displayed dropdowns
         * @publicdoc
         */
        hide: function() {
          $super.hide.call(this);
        },

        /**
         * Scroll to element if needed
         * @param {HTMLElement} element element
         * @publicdoc
         */
        scrollItemIntoView: function(element) {
          const elemTop = element.offsetTop;
          const elemHeight = element.offsetHeight;
          const parentContainer = this.getElement();
          const containerTop = parentContainer.scrollTop;
          const containerHeight = parentContainer.offsetHeight;
          if (containerTop > elemTop) {
            element.scrollIntoView();
          } else if (containerTop + containerHeight < elemTop + elemHeight) {
            element.scrollIntoView(false);
          }
        },

        /**
         * Returns position of value in dropdown choices list
         * @param {*} value - value to check index
         * @returns {number} - the index of the value in list
         * @publicdoc
         */
        getValueIndex: function(value) {
          const children = this.getChildren();
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.getValue && child.getValue() === value) {
              return i;
            }
          }
          return -1;
        },

        /**
         * Bind handler which is executed each time a dropdown item is selected
         * @param {Hook} hook - method to bind when item change
         * @returns {HandleRegistration} bound handler
         * @publicdoc
         */
        onCurrentChildrenChange: function(hook) {
          return this.getParentWidget().when(cls.ChoiceDropDownWidget.widgetEvents.currentChildrenChange, hook);
        },

        /**
         * On click handler raised when selecting an item in the dropdown :
         * Parent widget get value of clicked item and dropdown is closed.
         * @param event
         * @param sender
         * @param domEvent
         * @private
         */
        _onClick: function(event, sender, domEvent) {
          const parentWidget = this.getParentWidget();
          if (parentWidget && !parentWidget.isDestroyed()) {
            if (sender && sender.getValue) {
              const value = sender.getValue();
              if (parentWidget.setEditing) {
                parentWidget.setEditing(true);
                if (parentWidget._setMultiValue) {
                  parentWidget._setMultiValue(value);
                } else if (parentWidget.setValue) {
                  parentWidget.setValue(value);
                  this._userValidationAction = true;
                  parentWidget.emit(context.constants.widgetEvents.valueChanged, parentWidget.getValue());
                }
              }
            }
            if (domEvent) {
              domEvent.stopPropagation();
            }
            if (!this._allowMultipleChoices) {
              this.hide();
            }

            parentWidget.emit(context.constants.widgetEvents.focus, event);
            if (sender && sender.ddOnClickCallback) {
              sender.ddOnClickCallback();
            }
          }
        },

        /**
         * Returns true if current dropdown action / value change is done but a user action such as click/enter
         * @returns {boolean}
         */
        isUserAction: function() {
          return this._userValidationAction;
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget, options) {
          $super.addChildWidget.call(this, widget, options);
          this._bindClickToItem(widget, options);
        },

        /**
         * @inheritDoc
         */
        adoptChildWidget: function(widget, options) {
          $super.adoptChildWidget.call(this, widget, options);
          this._bindClickToItem(widget, options);
        },

        /**
         * Bind clicks handlers to dropdown item widget and flag it as being inside dropdown
         * @param {classes.WidgetBase} widget - item widget
         * @param {object} options - addChildWidget/adoptChildWidget option paramaters
         * @private
         */
        _bindClickToItem: function(widget, options) {
          widget.isInDropDown = true;
          widget.ddOnClickCallback = options && options.clickCallback;
          widget._clickHandlerFromChoiceDropDown = widget.when(context.constants.widgetEvents.click, function(event, sender,
            domEvent) {
            this._onClick.call(this, event, widget, domEvent);
          }.bind(this));
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          if (widget) {
            if (widget._clickHandlerFromChoiceDropDown) {
              widget._clickHandlerFromChoiceDropDown();
              widget._clickHandlerFromChoiceDropDown = null;
            }
            widget.ddOnClickCallback = null;
            widget.isInDropDown = false;
          }
          $super.removeChildWidget.call(this, widget);
        },

        /**
         * @inheritDoc
         */
        show: function(multiple = false) {
          if (this._userValidationAction) {
            this._userValidationAction = false;
            return;
          }

          if (this.getParentWidget() && !this.getParentWidget().isDestroyed()) {
            if (this.getChildren().length > 0) {
              $super.show.call(this, multiple);
              if (this.getParentWidget().getValue) {
                const defaultValue = this.getParentWidget().getValue();
                const index = this.getValueIndex(defaultValue);
                if (index !== -1) {
                  this.setCurrentPosition(this.getChildren()[index]);
                }
              }
            }
          }
        },

        /**
         * Set whether this list will accept multiple values or not
         * @param {boolean} allow allow
         * @publicdoc
         */
        allowMultipleChoices: function(allow) {
          this._allowMultipleChoices = allow;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ChoiceDropDown', cls.ChoiceDropDownWidget);
  });
