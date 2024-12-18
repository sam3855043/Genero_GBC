/// FOURJS_START_COPYRIGHT(D,2024)
/// Property of Four Js*
/// (c) Copyright Four Js 2024, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('InputApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  function(context, cls) {
    /**
     * @class InputApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.InputApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.InputApplicationService.prototype */ {
        __name: "InputApplicationService",

        /** @type {*} */
        _lastBeforeInputEvent: null,

        /**
         * @inheritDoc
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._application.dvm.onOrdersManaged(this._bindEvents.bind(this), true);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._unbindEvents();
          this._lastBeforeInputEvent = null;
          $super.destroy.call(this);
        },

        /**
         * Bind input events on the ui
         * @private
         */
        _bindEvents: function() {
          const uiWidget = this._application.getUI().getWidget();
          if (uiWidget) {
            const uiElement = uiWidget.getElement();
            uiElement.on('input.UserInterfaceWidget', this._onInput.bind(this));
            uiElement.on('beforeinput.UserInterfaceWidget', this._onBeforeInput.bind(this));
          }
        },

        /**
         * Unbind input events of the ui
         * @private
         */
        _unbindEvents: function() {
          const uiWidget = this._application.getUI().getWidget();
          if (uiWidget) {
            const uiElement = uiWidget.getElement();
            uiElement.off('input.UserInterfaceWidget');
            uiElement.off('beforeinput.UserInterfaceWidget');
          }
        },

        /**
         * Input event handler.
         * @param {*} event
         * @private
         */
        _onInput: function(event) {
          context.LogService.input.log("_onInput event : ", event);

          const targetElement = event.target;

          // search widget from dom event
          const widget = gbc.WidgetService.getWidgetFromElement(targetElement);
          if (!widget) {
            return;
          }

          let dataString = event.data;
          if (dataString === null) { // if data is not available in input event, try to find it in beforeinput event
            dataString = this._lastBeforeInputEvent ? this._lastBeforeInputEvent.data : "";
          }
          widget.manageInput(dataString, event);
        },

        /**
         * BeforeInput event handler.
         * @param {*} event
         * @private
         */
        _onBeforeInput: function(event) {
          context.LogService.input.log("_onBeforeInput event : ", event);

          const targetElement = event.target;
          this._lastBeforeInputEvent = event;

          // search widget from dom event
          const widget = gbc.WidgetService.getWidgetFromElement(targetElement);
          if (!widget) {
            return;
          }

          let preventDefault = false;

          if (!this._application.hasVMFocus(widget)) {
            // if widget has not the focus:
            // 1. prevent input
            // 2. request focus on this widget
            // 3. add a paste command to insert the input after the focus
            preventDefault = true;
            widget.emit(context.constants.widgetEvents.requestFocus);
            this._application.scheduler.clipboardPasteCommand(event.data, widget);
          } else {
            // execute manageBeforeInput from current widget
            const widgetBeforeInputAccepted = widget.manageBeforeInput(event.data, event);

            // check if scheduler is processing
            const schedulerProcessing = this._application.scheduler.hasProcessingCommands();
            if (schedulerProcessing) {
              // flash app, no input admit during processing
              this._application.getUI().getWidget().flash(100);
            }

            // prevent input when
            // 1. widget manageBeforeInput return false (widget explicit ask to prevent input)
            // 2. scheduler is processing (it means no input accepted when waiting for VM response)
            // 3. inputType is deleteByDrag (it means drag and drop doesn't delete text from drag source)
            preventDefault = !widgetBeforeInputAccepted || schedulerProcessing || event.inputType === 'deleteByDrag';
          }

          // TODO event.inputType === 'insertFromDrop'
          // TODO event.inputType === 'deleteByDrag'

          if (preventDefault) {
            event.stopPropagation();
            event.preventCancelableDefault();
          }
        },
      };
    });
    cls.ApplicationServiceFactory.register("Input", cls.InputApplicationService);
  });
