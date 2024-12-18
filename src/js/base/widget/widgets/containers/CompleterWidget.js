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

modulum('CompleterWidget', ['ChoiceDropDownWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Manages a dropdown attached to an edit to provide predefined choices
     * @class CompleterWidget
     * @memberOf classes
     * @extends classes.ChoiceDropDownWidget
     * @publicdoc Widgets
     */
    cls.CompleterWidget = context.oo.Class(cls.ChoiceDropDownWidget, function($super) {
      return /** @lends classes.CompleterWidget.prototype */ {
        __name: "CompleterWidget",
        /**
         * Completer size
         * @type {number}
         */
        _size: 0,

        _completerlinked: false,

        /**
         * @inheritDoc
         */
        destroy: function() {
          this.clearChoices();
          $super.destroy.call(this);
        },

        /**
         * Add a completer to the parent widget
         * @param {classes.WidgetBase} parentWidget to which is attached completer
         * @publicdoc
         */
        addCompleterWidget: function(parentWidget) {
          if (!this._completerlinked) {
            this._completerlinked = true;
            this.setParentWidget(parentWidget);
            this.autoSize = true;
            this.setCanOverlay(false);

            // set edit input of parent widget as parent element
            this.parentElement = parentWidget.getElement().getElementsByTagName("input")[0].parentElement;
          }
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          switch (keyString) {
            case "esc":
            case "enter":
            case "return":
            case "up":
            case "down":
            case "pageup":
            case "pagedown":
              // if existing, emit the change value event, which is being delayed (300ms), immediately before managing dropdown navigation keys
              if (keyString !== "esc") {
                if (this.getParentWidget().cancelCompleterValueChangedDelayer()) {
                  this.getParentWidget().emit(context.constants.widgetEvents.valueChanged, this.getParentWidget().getValue()); // send value
                }
              }
              keyProcessed = $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
              break;
            case "tab":
            case "shift+tab":
              if (this.isVisible()) {
                this.hideDropDown();
              }
              break;
          }

          return keyProcessed;
        },

        /**
         * Bind handler which is executed each time a completer item is selected
         * @param {Hook} hook - function to execute each time a completer item is selected (we pass item value in parameter of the hook)
         * @returns {HandleRegistration} bound handler
         * @publicdoc
         */
        onCurrentChildrenChange: function(hook) {
          return $super.onCurrentChildrenChange.call(this, function(evt, parent, children) {
            hook(children.getValue());
          });
        },

        /**
         * Add item label in dropdown
         * @param {string} choice - item label to be displayed
         * @publicdoc
         */
        addChoice: function(choice) {
          const label = cls.WidgetFactory.createWidget("Label", this.getBuildParameters());
          label.setValue(choice);
          this.addChildWidget(label, {
            clickCallback: function() {
              this.getParentWidget().setFocus();
            }.bind(this)
          });
        },

        /**
         * Remove all items from dropdown
         * @publicdoc
         */
        clearChoices: function() {
          this.destroyChildren();
        },

        /**
         * Set completer items size
         * @param {number} size - size of the completer
         * @publicdoc
         */
        setSize: function(size) {
          this._size = size;
        },

        /**
         * Return completer items size
         * @returns {number} completer size
         * @publicdoc
         */
        getSize: function() {
          return this._size;
        },

        /**
         * Returns completer current input value
         * @returns {string} completer value
         * @publicdoc
         */
        getValue: function() {
          return this.getParentWidget().getValue();
        },

        /**
         * Set current completer input value
         * @param {string} value - value to set in completer
         * @param {boolean} fromVM - indicates if we set value from VM order or not
         * @publicdoc
         */
        setValue: function(value, fromVM) {
          this.getParentWidget().setValue(value, fromVM);
        },

        /**
         * @inheritDoc
         */
        setEditing: function(b) {
          this.getParentWidget().setEditing(b);
        },

        /**
         * @return {boolean} true if we can trigger the autonext
         */
        canAutoNext: function() {
          // if autonext is enabled, we execute it on dropdown item click
          return this.isUserAction();
        },

        /**
         * @inheritDoc
         */
        hasFocus: function() {
          const parent = this.getParentWidget();
          return parent.hasFocus() || parent.getParentWidget().hasFocus();
        },

        /**
         * Show completer results
         * @publicdoc
         */
        showDropDown: function() {
          this._show(true);
        },

        /**
         * Hide completer results
         * @publicdoc
         */
        hideDropDown: function() {
          this._show(false);
        },

        /**
         * Internal method to show/hide completer results
         * @param visibility
         * @private
         */
        _show: function(visibility) {
          if (this._completerlinked) {
            if (visibility === true) {
              if (!this.hasFocus()) {
                return;
              }
              const element = this.getParentWidget().getElement();
              if (element) {
                this.x = element.getBoundingClientRect().left;
                this.width = element.getBoundingClientRect().width;
              }
              this.show(true); //true to stay open if already open
            } else {
              this.hide();
            }
          }
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Completer', cls.CompleterWidget);
  });
