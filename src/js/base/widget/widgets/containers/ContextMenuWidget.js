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

modulum('ContextMenuWidget', ['ChoiceDropDownWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * ContextMenu DropDown widget.
     * @class ContextMenuWidget
     * @memberOf classes
     * @extends classes.ChoiceDropDownWidget
     */
    cls.ContextMenuWidget = context.oo.Class(cls.ChoiceDropDownWidget, function($super) {
      /** @lends classes.ContextMenuWidget.prototype */
      return {
        __name: "ContextMenuWidget",
        __templateName: "DropDownWidget",

        /** @type {Map<string, classes.MenuLabelWidget|classes.HLineWidget>} */
        _actionWidgets: null,
        /** @type {Map<string, classes.MenuLabelWidget|classes.HLineWidget>} */
        _extraActionWidgets: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          $super.constructor.call(this, opts);
        },

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);

          this._actionWidgets = new Map();
          this._extraActionWidgets = new Map();

          this.allowMultipleChoices(true);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          // no layout
        },

        /**
         * @inheritDoc
         */
        destroy: function() {

          this.removeAndDestroyActions();
          this._actionWidgets = null;
          this._extraActionWidgets = null;

          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        manageMouseClick: function(domEvent) {
          if (!domEvent.target.elementOrParent("gbc_CheckBoxWidget")) { // if click is not on a checkbox
            this.hide(); // hide context menu
          }
          return false;
        },

        /**
         * @inheritDoc
         */
        managePriorityKeyDown: function(keyString, domKeyEvent, repeat) {
          let keyProcessed = false;

          if (this.isVisible()) {
            switch (keyString) {
              case "tab":
              case "shift+tab":
                this.hide();
                break;
              case "space":
                const currentChild = this.getCurrentChildren();
                if (currentChild) {
                  if (currentChild.getName() === "CheckBoxWidget") {
                    currentChild.manageMouseClick(null);
                  } else {
                    this._onClick(null, currentChild);
                  }
                  keyProcessed = true;
                }
                break;
            }
          }

          if (!keyProcessed) {
            keyProcessed = $super.managePriorityKeyDown.call(this, keyString, domKeyEvent, repeat);
          }
          return keyProcessed;
        },

        /**
         * Remove and destroy all actions widgets
         * @param {boolean} [onlyExtra] - if true remove only extra actions else remove all
         */
        removeAndDestroyActions: function(onlyExtra) {

          // remove extra actions widgets
          this._extraActionWidgets.forEach(function(value, key) {
            this.removeAndDestroyAction(key, true);
          }.bind(this));
          this._extraActionWidgets.clear();

          if (!onlyExtra) {
            // remove other actions widgets
            this._actionWidgets.forEach(function(value, key) {
              this.removeAndDestroyAction(key, false);
            }.bind(this));
            this._actionWidgets.clear();
          }
        },

        /**
         * Remove and destroy one action widget
         * @param {string} actionName - name of the action
         * @param {boolean} extra - is action in the extra actions ?
         */
        removeAndDestroyAction: function(actionName, extra) {
          let widgets = this._actionWidgets;
          if (extra) {
            widgets = this._extraActionWidgets;
          }

          const actionWidget = widgets.get(actionName);
          if (!actionWidget) {
            return;
          }

          if (!actionWidget._destroyed) {
            actionWidget.destroy();
          }
          widgets.delete(actionName);
          this.emit("onActionChange", null);
        },

        /**
         * Add one action in the contextmenu
         * @param {string} actionName - name
         * @param {string} actionText - text
         * @param {string} actionImage - image
         * @param {string} actionAccelerator - accelerator of the action
         * @param {Object} opts - actions options
         * @param {boolean} extra - is it an extra actions ?
         */
        addAction: function(actionName, actionText, actionImage, actionAccelerator, opts, extra) {
          opts = opts || {};

          if (actionText.length === 0) {
            return;
          }

          let widgets = this._actionWidgets;
          if (extra) {
            widgets = this._extraActionWidgets;
            opts.order = 9000; // extra actions must be after all other actions
            if (this._extraActionWidgets.size === 0 && this.hasVisibleAction()) {
              // before the first extra action add a separator
              this.addSeparator(extra, opts);
            }
          }

          let actionWidget = widgets.get(actionName);
          if (!actionWidget) {
            actionWidget = cls.WidgetFactory.createWidget("MenuLabel", this.getBuildParameters());
            actionWidget.getElement().setAttribute("data-aui-name", actionName);
            widgets.set(actionName, actionWidget);
            this.addChildWidget(actionWidget, opts);
          }

          this.updateAction(actionWidget, actionText, actionImage, actionAccelerator, opts);

          return actionWidget;
        },

        /**
         * Update one action in the contextmenu
         * @param {object|string} action
         * @param {string} actionText - text
         * @param {string} actionImage - image
         * @param {string} actionAccelerator - accelerator of the action
         * @param {Object} opts - actions options
         */
        updateAction: function(action, actionText, actionImage, actionAccelerator, opts) {
          let actionWidget = action;
          opts = opts || {};
          if (typeof action === "string") {
            actionWidget = this._actionWidgets.get(action);
          }
          if (actionWidget) {
            actionWidget.setText(actionText);
            if (actionImage) {
              actionWidget.setImage(actionImage);
            }
            if (actionAccelerator && !window.isMobile()) { // don't show accelerator on mobile devices
              if (window.browserInfo.isSafari) {
                actionAccelerator.replace("Control", "⌘")
                  .replace("-", "");
              } else {
                actionAccelerator.replace("-", "+")
                  .replace("Control", "Ctrl");
              }
              actionWidget.setComment(actionAccelerator);
            }
            actionWidget.setEnabled(!opts.disabled);
            actionWidget.setHidden(!!opts.hidden);

            if (opts.order) {
              actionWidget.setStyle({
                "order": opts.order
              });
            }
            this.emit("onActionChange", actionWidget);
          }
        },

        /**
         * @inheritDoc
         */
        hide: function() {
          $super.hide.call(this);

          //restore focus
          const application = context.SessionService.getCurrent().getCurrentApplication();
          if (application) {
            const node = application.getFocusedVMNodeAndValue(true);
            const ctrl = node ? node.getController() : null;
            if (ctrl) {
              ctrl.setFocus();
            }
          }
        },

        /**
         * Returns if there is at least one visible action
         * @returns {boolean} true if there is at least one visible actions
         */
        hasVisibleAction: function() {
          let visible = false;
          for (const element of this.getChildren()) {
            if (element.isVisible()) {
              visible = true;
              break;
            }
          }
          return visible;
        },

        /**
         * Add separator
         * @param {boolean} extra - add it in extra action list
         * @param {Object} opts - separator options
         */
        addSeparator: function(extra = false, opts = {}) {
          let line = cls.WidgetFactory.createWidget("HLine", this.getBuildParameters());
          line.setEnabled(false);
          if (extra) {
            this._extraActionWidgets.set(line.getRootClassName(), line);
          }

          if (opts.order) {
            line.setStyle({
              "order": opts.order
            });
          }

          this.addChildWidget(line);
        },

        /**
         * Return the map of action widgets
         * @return {Map<string, classes.MenuLabelWidget|classes.HLineWidget>} - action widgets
         */
        getActionWidgets: function() {
          return this._actionWidgets;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ContextMenu', cls.ContextMenuWidget);
  });
