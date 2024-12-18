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

modulum('MonitorWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class MonitorWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.MonitorWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.MonitorWidget.prototype */ {
        __name: "MonitorWidget",
        _initElement: function() {
          $super._initElement.call(this);
          this._monitorDebugWidget = cls.WidgetFactory.createWidget(
            'MonitorDebugGbcInfo',
            this.getBuildParameters()
          );
          this._debugHeaderElement = this.getElement().querySelector('.debugHeader');
          this._debugHeaderElement.appendChild(this._monitorDebugWidget.getElement());

        }
      };
    });
    cls.WidgetFactory.registerBuilder('Monitor', cls.MonitorWidget);
  });
