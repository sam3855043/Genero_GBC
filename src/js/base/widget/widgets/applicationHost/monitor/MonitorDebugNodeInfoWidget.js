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

modulum('MonitorDebugNodeInfoWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class MonitorDebugNodeInfoWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.MonitorDebugNodeInfoWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.MonitorDebugNodeInfoWidget.prototype */ {
        __name: "MonitorDebugNodeInfoWidget",
        _propertiesContainer: null,
        _initElement: function() {
          $super._initElement.call(this);
          this._propertiesContainer = this._element.querySelector("table>tbody");
          this._element.on("click", "table>thead>tr", this._onClick.bind(this));
        },
        _onClick: function(e) {
          const table = this._element.childTag("table");
          if (table) {
            let i = 0;
            const cats = table.querySelectorAll(".category"),
              len = cats.length;
            for (; i < len; i++) {
              context.DebugService.auiview[".cat_" + cats[i].textContent] = true;
              gbc.DebugService.catClicked(cats[i].textContent, true);
            }
          }
          e.stopPropagation();
        },
        getPropertiesContainer: function() {
          return this._propertiesContainer;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('MonitorDebugNodeInfo', cls.MonitorDebugNodeInfoWidget);
  });
