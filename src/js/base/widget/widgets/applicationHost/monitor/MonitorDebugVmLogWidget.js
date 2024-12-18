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

modulum('MonitorDebugVmLogWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class MonitorDebugVmLogWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.MonitorDebugVmLogWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.MonitorDebugVmLogWidget.prototype */ {

        __name: "MonitorDebugVmLogWidget",
        _propertiesContainer: null,
        _logs: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
        },

        getPropertiesContainer: function() {
          return this._propertiesContainer;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._logs.innerHTML = "";
          $super.destroy.call(this);
        },

        /**
         * Set the content of the vm text logs
         */
        loadDebugContent: function(sessionId) {
          this._logs = this._element.getElementsByClassName('vm-logs-content')[0];
          this._logs.innerHtml = "";
          fetch(window.location.origin + '/monitor/log/vm-' + sessionId)
            .then(async raw => {
              this._logs.innerHTML = await raw.text();
            });
        },

      };
    });
    cls.WidgetFactory.registerBuilder('MonitorDebugVmLogs', cls.MonitorDebugVmLogWidget);
  });
