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

modulum('VisibleRowsVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class VisibleRowsVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.VisibleRowsVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.VisibleRowsVMBehavior.prototype */ {
        __name: "VisibleRowsVMBehavior",

        watchedAttributes: {
          anchor: ['size', 'offset', 'bufferSize', 'dialogType']
        },

        /**
         * Update the visibleRowCount of the linked table Widget
         */
        _apply: function(controller, data) {
          let tableWidget = controller.getWidget();
          if (!tableWidget?.setVisibleRowCount) {
            return;
          }
          let tableNode = controller.getAnchorNode();
          let size = tableNode.attribute('size');
          let offset = tableNode.attribute('offset');
          let bufferSize = tableNode.attribute('bufferSize');
          let currentRow = tableNode.attribute('currentRow');

          let visibleRows = Math.min(bufferSize, size - offset);
          let dialogType = tableNode.attribute('dialogType');
          if ((dialogType === "Construct" || dialogType === "Input" || (dialogType === "InputArray" && currentRow === 0)) &&
            visibleRows === 0) {
            visibleRows = 1;
          }
          tableWidget.setVisibleRowCount(visibleRows);
        }
      };
    });
  });
