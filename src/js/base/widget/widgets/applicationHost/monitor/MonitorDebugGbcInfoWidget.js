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

modulum('MonitorDebugGbcInfoWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class MonitorDebugGbcInfoWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.MonitorDebugGbcInfoWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.MonitorDebugGbcInfoWidget.prototype */ {

        __name: "MonitorDebugGbcInfoWidget",
        _propertiesContainer: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          $super._initElement.call(this);
          const gbcToGdcItem = cls.WidgetFactory.createWidget(
            'ChromeBarItemRunInGDC',
            this.getBuildParameters()
          );
          this._gbcToGdcItem = this.getElement().querySelector('.gbc-to-gdc');
          this._gbcToGdcItem.appendChild(gbcToGdcItem.getElement());
        },
      };
    });
    cls.WidgetFactory.registerBuilder('MonitorDebugGbcInfo', cls.MonitorDebugGbcInfoWidget);
  });
