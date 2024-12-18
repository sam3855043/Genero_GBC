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

modulum('ValueVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ValueVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ValueVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ValueVMBehavior.prototype */ {
        __name: "ValueVMBehavior",

        watchedAttributes: {
          anchor: ['value'],
          completer: ['size']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const anchorNode = controller.getAnchorNode();
          const auiValue = anchorNode.attribute('value');

          let doSetValue = true;
          // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
          if (anchorNode.isInTable()) {
            const tableWidget = widget.getTableWidgetBase();
            const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
            if (isAnticipateScrollingEnabled) {
              const tableCachedDataModel = tableWidget.getCachedDataModel();
              tableCachedDataModel.updateDataFromValueNode(anchorNode, "value", auiValue);
              const tableNode = anchorNode.getAncestor("Table");
              const hasScrollCommandsToProcess = anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode);
              doSetValue = !hasScrollCommandsToProcess;
            }
          }

          if (widget?.setValue) {
            const anchorNode = controller.getAnchorNode();

            if (!widget.isEditing) { // if widget is not a TextWidgetBase, simply setValue and return
              if (doSetValue) {
                widget.setValue(auiValue, true);
              }
              return;
            }

            // TODO : is lastCommandTime still needed with predictive deletion ?
            const lastCommandTime = anchorNode.getApplication().scheduler.getLastCommandTime();
            if (!widget.isEditing() || lastCommandTime >= widget.getEditingTime()) {
              if (doSetValue) {
                widget.setValue(auiValue, true);
              }
              if (widget.hasFocus() && widget.hasCursors()) { // need to set correct cursor (QA GBC-937)
                const containerNode = controller.getNodeBindings().container;
                const cursor = containerNode.attribute('cursor');
                const cursor2 = containerNode.attribute('cursor2');
                widget.setCursors(cursor, cursor2);
              }
            }
          }
        }
      };
    });
  });
