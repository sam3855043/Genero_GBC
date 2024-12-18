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

modulum('MenuWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Menu widget.
     * @class MenuWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.MenuWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.MenuWidget.prototype */ {
        __name: 'MenuWidget',

        /**
         * Element that hold the text
         * @protected
         * @type HTMLElement
         */
        _textElement: null,

        /** @type {?string} */
        _text: null,

        /**
         * Image of the menu
         * @protected
         * @type {classes.ImageWidget}
         */
        _image: null,

        /**
         * If menu is set as modal, it's stored here
         * @protected
         * @type {classes.ModalWidget}
         */
        _modalWidget: null,

        /**
         * Type of the menu
         * @protected
         * @type {?string}
         */
        _menuType: null,

        /**
         * last known menu panel position
         * @type {!string}
         */
        _menuPanelPosition: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
          this._textElement = this._element.getElementsByClassName('gbc_MenuWidgetText')[0];

          // default orientation is vertical
          this._element.removeClass('gbc_MenuWidget_horizontal').addClass('gbc_MenuWidget_vertical');
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.MenuLayoutEngine(this);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._modalWidget) {
            this._modalWidget.hide();
            this._modalWidget.destroy();
            this._modalWidget = null;
          }

          if (this._image) {
            this._image.destroy();
            this._image = null;
          }

          this._textElement = null;

          $super.destroy.call(this);
        },

        /**
         * Set the text of the menu
         * @param {string} text - text to set
         */
        setText: function(text) {
          if (!this._chromeBar) {
            this._text = text;
            this._setTextContent(text, "_textElement");
            this.setAriaAttribute('label', this.getText());
          }
        },

        /**
         * Get the text of the menu
         * @return {string}
         */
        getText: function() {
          return this._text;
        },

        /**
         * Define the image of the menu
         * @param {classes.ImageWidget} image - img widget
         */
        setImage: function(image) {
          if (!this._image) {
            if (!image) {
              return;
            }
            this._image = cls.WidgetFactory.createWidget('ImageWidget', this.getBuildParameters());
            this._element.getElementsByClassName('gbc_MenuWidgetTitle')[0].prependChild(this._image.getElement());
          }
          this._image.setSrc(image);
        },

        /**
         * Get image of the menu
         * @return {?string} - source of the image, null if not set
         */
        getImage: function() {
          if (this._image) {
            return this._image.getSrc();
          }
          return null;
        },

        /**
         * Set the tooltip of the menu
         * @param {string} title the tooltip text
         */
        setTitle: function(title) {
          this._element.setAttribute('title', title);
        },

        /**
         * Get the title of the menu
         * @returns {string} the tooltip text
         */
        getTitle: function() {
          return this._element.getAttribute('title');
        },

        /**
         * @inheritDoc
         */
        setBackgroundColor: function(color) {
          $super.setBackgroundColor.call(this, color);
          if (this._modalWidget) {
            this._modalWidget.setBackgroundColor(color);
          }
        },

        /**
         * show the modal
         */
        showModal: function() {
          if (this.isEnabled() && this._modalWidget && (this.isModal() || this.isPopup())) {
            this._modalWidget.show();
          }
        },

        /**
         * Set the menu state
         * @param {boolean} enabled - true if the widget allows user interaction, false otherwise.
         */
        setEnabled: function(enabled) {
          $super.setEnabled.call(this, enabled);
          // if a menu get active and was previously hidden, it has to be displayed
          // And added to back to the dom if needed
          if (enabled) {
            this._appendToMenuContainer();
            if (this.isHidden()) {
              this.setHidden(false);
            }
          }
          // a modal or popup which gets disabled has to be hidden
          if (!enabled && this._modalWidget && this._modalWidget.isVisible() && (this.isModal() || this.isPopup())) {
            this._modalWidget.hide();
          }
        },

        /**
         * Change the orientation of the menu
         * @param {string} orientation  - layout orientation. 'vertical' or 'horizontal'.
         */
        setOrientation: function(orientation) {
          if (this.getOrientation() !== orientation) {
            this._element.toggleClass('gbc_MenuWidget_horizontal', orientation !== 'vertical');
            this._element.toggleClass('gbc_MenuWidget_vertical', orientation === 'vertical');
          }
        },

        /**
         * Get the orientation of the menu
         * @returns {string} 'vertical' or 'horizontal'.
         */
        getOrientation: function() {
          if (this._element.hasClass('gbc_MenuWidget_vertical')) {
            return 'vertical';
          }
          return 'horizontal';
        },

        /**
         * Set menu visibility
         * @param {boolean} hidden - hide the menu if set to true
         */
        setHidden: function(hidden) {
          if (this._hidden !== Boolean(hidden)) {
            this._hidden = Boolean(hidden);
            $super.setHidden.call(this, hidden);
            if (this._modalWidget) {
              if (this._hidden) {
                this._modalWidget.hide();
              } else {
                this._modalWidget.show();
              }
            }
          }
          if (this._chromeBar) {
            this._chromeBar.setMenuItemsHidden(hidden);
          }
        },

        /**
         * Know if menu is displayed as popup
         * @return {boolean}
         */
        isPopup: function() {
          return this._menuType === 'popup';
        },

        /**
         * Know if menu is displayed as a modal
         * @return {boolean}
         */
        isModal: function() {
          return this._menuType === 'dialog' || this._menuType === 'winmsg'; // winmsg = fgldialog
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isPopup() && this._modalWidget && this._modalWidget.isVisible()) {
            switch (keyString) {
              case "space":
              case "enter":
              case "return":
                if (this._modalWidget.getCurrentChildren()) {
                  this._modalWidget.getCurrentChildren().emit(context.constants.widgetEvents.click, null);
                  keyProcessed = true;
                }
                break;
            }

            if (!keyProcessed) {
              keyProcessed = this._modalWidget.managePriorityKeyDown(keyString, domKeyEvent, repeat);
            }
          }
          return keyProcessed;
        },

        /**
         * Defines the menu to be displayed as a modal one
         * @param {string} modalType - could be 'popup', 'dialog' or 'winmsg'
         */
        setAsModal: function(modalType) {
          this._menuType = modalType;
          const tabbedMode = context.SessionService.getCurrent().isInTabbedContainerMode();
          // DROPDOWN MENU
          if (this.isPopup()) {
            this._modalWidget = cls.WidgetFactory.createWidget('ChoiceDropDown', this.getBuildParameters());
            this._modalWidget.setParentWidget(this, {
              noLayoutInvalidation: true
            });
            this._modalWidget.getElement().addClass('menu');

            while (this.getChildren().length) {
              this._modalWidget.adoptChildWidget(this.getChildren().shift());
            }
            //Place it at the middle center of the screen if menu opens automatically
            this._modalWidget.x = context.WidgetService.cursorX || 'CENTER';
            this._modalWidget.y = context.WidgetService.cursorY || 'CENTER';

            this._modalWidget.when(cls.DropDownWidget.widgetEvents.dropDownClose, this._onClose.bind(this));

            this._onRequestFocus(); // request focus

            // display dropdown in animation frame because we need dropdown items (menuaction) to be measured before dropdown
            this.afterDomMutator(function() {
              this._modalWidget.show();
            }.bind(this));

            // MODAL MENU
          } else if (this.isModal()) {
            const parentWidget = tabbedMode ? this.getApplicationWidget() : this.getWindowWidget();

            if (!this._modalWidget) {
              this._modalWidget = cls.WidgetFactory.createWidget('Modal', this.getBuildParameters());
              let parentNode = parentWidget.getElement();
              if (parentWidget.isModal) {
                parentNode = parentWidget.getModal().getElement().parentNode;
              }
              parentNode.appendChild(this._modalWidget.getElement());
            }

            this._modalWidget.setHeader(this.getText());
            if (parentWidget.getModal) {
              const parentModal = parentWidget.getModal();
              if (parentModal) {
                parentModal.setClosable(false);
              }
            }

            this._modalWidget.setImage(this.getImage());
            this._modalWidget.setClosable(false);
            this._modalWidget.setContent(this.getTitle());
            this._modalWidget.setFooter(this.getElement());
            this._modalWidget.addClass('gbc_ModalMenuDialog');
            if (this._menuType === 'winmsg') {
              this._modalWidget.addClass('isWinMSG');
            }

            if (tabbedMode) {
              this._modalWidget.addClass('tabbedContainer_Modal');
            }
            this.setOrientation('horizontal');
            this._element.addClass('gbc_ModalMenu');
            this._modalWidget.setStyle('.mt-dialog-content', {
              'white-space': 'pre-wrap',
              'text-align': 'center'
            });
            this._modalWidget.setBackgroundColor(this._backgroundColor);

            this._modalWidget.show();
          }
        },

        /**
         * Will update the position if menu is in a modal
         * @private
         */
        _updateModalPosition: function() {
          if (this._modalWidget && this._modalWidget.resizeHandler) {
            this._modalWidget.resizeHandler();
          }
        },

        /**
         * Define this menu as a chromebar
         * @param chromeBar
         */
        setAsChromeBar: function(chromeBar) {
          this._chromeBar = chromeBar;
        },

        /**
         * Check if this menu is a chromebar
         * @return {boolean}
         */
        isChromeBar: function() {
          return Boolean(this._chromeBar);
        },

        /**
         * @inheritDoc
         */
        _onClose: function() {
          this.emit(context.constants.widgetEvents.close);
        },

        /**
         * Manage actionPanel position
         * actionPanelPosition (Dialog) + ringMenuPosition (Menu) 4ST attribute
         * @param position
         */
        setActionPanelPosition: function(position) {
          if (this._menuPanelPosition === position) {
            return;
          }

          if (!this._menuType && this.getWindowWidget()) {
            this._menuPanelPosition = position;
            const isInWindowMenuContainer = this._appendToMenuContainer();
            if (!isInWindowMenuContainer) {
              this.setHidden(true);
            }
            this.getWindowWidget().getLayoutEngine().invalidateAllocatedSpace();
          }
        },

        /**
         * Append the menu to the menuContainer of the windowWidget
         * @returns {boolean} True, if the widget is in the windowMenuContainer, false otherwise
         * @private
         */
        _appendToMenuContainer: function() {
          const windowWidget = this.getWindowWidget();
          if (!windowWidget) {
            return false;
          }

          const windowMenuContainer = windowWidget.getMenuContainer(this._menuPanelPosition);
          if (!windowMenuContainer) {
            return false;
          }

          if (windowMenuContainer.firstChild !== this._element) {
            if (windowMenuContainer.firstChild) {
              windowMenuContainer.removeChild(windowMenuContainer.firstChild);
            }
            windowMenuContainer.appendChild(this._element);
          }
          this.domAttributesMutator(function(windowMenuContainer) {
            windowMenuContainer.removeClass('hidden');
          }.bind(this, windowMenuContainer));
          return true;
        },

        /**
         * @inheritDoc
         */
        hasFocus: function() {
          return true;
        }

      };
    });
    cls.WidgetFactory.registerBuilder('Menu', cls.MenuWidget);
    cls.WidgetFactory.registerBuilder('Dialog', cls.MenuWidget);
  });
