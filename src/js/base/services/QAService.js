/// FOURJS_START_COPYRIGHT(D,2014)
/// Property of Four Js*
/// (c) Copyright Four Js 2014, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('QAService', ['InitService'],
  function(context, cls) {

    /**
     * @namespace gbc.QAService
     */
    context.QAService = context.oo.StaticClass( /** @lends gbc.QAService */ {
      __name: "QAService",

      /** @type {Array} */
      _qaReadyActionWidgets: null,

      _afterLayoutHandler: null,

      _isReady: false,

      /**
       * Initialize the service
       */
      init: function() {
        this._afterLayoutHandlers = {};
      },

      /**
       * Get the afterLayout for the given widget
       * @param {cls.WidgetBase} widget - widget to get handler
       * @returns {*|null}
       * @private
       */
      _getHandlerForWidget: function(widget) {
        return this._afterLayoutHandlers[widget.getUniqueIdentifier()] ? this._afterLayoutHandlers[widget.getUniqueIdentifier()] : null;
      },

      /**
       * Set the afterLayout Handler for the given widget
       * @param {cls.WidgetBase} widget - widget to get handler
       * @param {function} handler
       * @private
       */
      _setHandlerForWidget: function(widget, handler) {
        if (handler) {
          this._afterLayoutHandlers[widget.getUniqueIdentifier()] = handler;
        } else {
          delete(this._afterLayoutHandlers[widget.getUniqueIdentifier()]);
        }
      },

      /**
       * Attach the afterLayout handler to widget
       * @param {cls.WidgetBase} widget - widget to bind
       */
      bindQAReadyButton: function(widget) {
        if (this._getHandlerForWidget(widget)) {
          this._getHandlerForWidget(widget)(); // call to remove handler
        }
        let modelHelper = new cls.ModelHelper(widget); // using ModelHelper to ensure correct current app is used
        this._setHandlerForWidget(widget, modelHelper.getApplication().scheduler.schedulerProcessEndedEvent(() => {
          // event executed once : we release reference because event listener will destroy it
          this._setHandlerForWidget(widget, null);
          widget.emit(context.constants.widgetEvents.click); // auto-click on itself
        }, true));
      },

      /**
       * @param {cls.SchedulerApplicationService} schedulerInstance
       */
      bindToScheduler: function(schedulerInstance) {
        schedulerInstance.schedulerProcessStartedEvent(() => {
          this._isReady = false;
        }, false);

        schedulerInstance.schedulerProcessEndedEvent(() => {
          this._isReady = true;
        }, false);
      },

      /**
       * Check if app is ready for QA
       * By asking the scheduler if there is nothing more to process
       * @return {boolean} - true if ready, false otherwise
       */
      isQAReady: function() {
        return this._isReady;
      },
    });
    context.InitService.register(context.QAService);
  });
