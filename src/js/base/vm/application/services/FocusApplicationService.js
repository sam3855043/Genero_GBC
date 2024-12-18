/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FocusApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * @class FocusApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.FocusApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.FocusApplicationService.prototype */ {
        __name: "FocusApplicationService",

        /**
         * true if we are currently restoring the VM focus, false otherwise
         * @type {boolean}
         */
        _restoringVMFocus: false,

        /**
         * Active DropDown widget
         * @type {classes.WidgetGroupBase}
         */
        _activeDropDownWidget: null,

        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
          this._activeDropDownWidget = null;
        },

        /**
         * Restores the focus according to the VM focus
         * @param {boolean=} [restoreDOMFocus] ensure to restore the DOM focus
         */
        restoreVMFocus: function(restoreDOMFocus) {
          const node = this._application.getFocusedVMNodeAndValue(true);
          if (node) {
            // set current focused node
            context.LogService.focus.log("restoreVMFocus for node : ", node);

            const ctrl = node.getController();
            if (ctrl) {
              // ensure visible for folder pages
              const parentForm = node.getAncestor("Form");
              let visibleId = null;
              if (parentForm) {
                visibleId = parentForm.attribute("visibleId");
              }
              let uiWidget = null;
              const appWidget = this._application.getUI().getWidget();
              if (appWidget) {
                uiWidget = appWidget._uiWidget;
              }
              const focusedWidget = ctrl.getWidget() || ctrl.getCurrentInternalWidget();
              if (focusedWidget) {
                if (!uiWidget) {
                  uiWidget = focusedWidget.getUserInterfaceWidget();
                }
                if (uiWidget) { // set ui current focused widget
                  uiWidget.setFocusedWidget(focusedWidget);
                }
              } else if (ctrl instanceof cls.MatrixController) {
                //When the current cell of a Matrix is not visible refresh the layout
                restoreDOMFocus = true;
              }

              this._restoringVMFocus = true;
              if (uiWidget && (restoreDOMFocus || uiWidget.hasFocusedWidgetChanged())) {
                // if no visibleId is set we make sure to display potential current page
                if (!visibleId || visibleId === -1) {
                  if (ctrl.ensureVisible()) {
                    this._application.scheduler.layoutCommand();
                  }
                }

                if (node.isInTable()) {
                  //We need to set the focus on the Table to be able to show the rowbound
                  let tableNode = node.getAncestor('Table');
                  let tableController = tableNode.getController();

                  tableController.setFocus();
                }

                ctrl.setFocus(); // set ui focus on widget element

                // hide previously displayed dropdowns
                if (cls.DropDownWidget.hasAnyVisible() && !cls.DropDownWidget.isChildOrParentOfDropDown(focusedWidget
                    .getElement())) {
                  cls.DropDownWidget.hideAll();
                }

              }
              this.emit(context.constants.widgetEvents.focusRestored);
              this._restoringVMFocus = false;
            }
          }
        },

        /**
         * @returns {boolean} true if we are currently restoring the VM focus, false otherwise
         */
        isRestoringVMFocus: function() {
          return this._restoringVMFocus;
        },

        /**
         * Set the widget which has an active DropDown
         * @param {classes.WidgetGroupBase} activeDDWidget - active DropDown widget
         */
        setActiveDropDownWidget: function(activeDDWidget) {
          this._activeDropDownWidget = activeDDWidget;
        },

        /**
         * Get the widget which has an active DropDown
         * @return {classes.WidgetGroupBase} the active DropDown widget
         */
        getActiveDropDownWidget: function() {
          return this._activeDropDownWidget;
        }
      };
    });
    cls.ApplicationServiceFactory.register("Focus", cls.FocusApplicationService);
  });
