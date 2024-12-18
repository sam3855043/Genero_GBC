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

modulum('DateTimeValueVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Manage both value and DBDATE format.
     * @class DateTimeValueVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.DateTimeValueVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.DateTimeValueVMBehavior.prototype */ {
        __name: "DateTimeValueVMBehavior",

        watchedAttributes: {
          anchor: ['value'],
          container: ['varType']
        },
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) { // for label the function to change text is setValue
            const bindings = controller.getNodeBindings();
            const anchorNode = bindings.anchor;
            const type = bindings.container.attribute('varType');
            let value = anchorNode.attribute('value');
            if (type || value) {
              // true if minute not found, false otherwise
              const sec = !type || !~type.toLowerCase().indexOf("minute");

              const isConstruct = bindings.container.attribute('dialogType') === "Construct";
              let displayFormat = "";
              if (isConstruct) { // in construct, we display ISO format. No conversion is done.
                displayFormat = cls.DateTimeHelper.getISOFormat(sec);
              } else { // Use DBDATE format
                const anchorNode = controller.getAnchorNode();
                const userInterfaceNode = anchorNode.getApplication().getNode(0);
                const userInterfaceWidget = userInterfaceNode.getController().getWidget();

                const dbDate = userInterfaceWidget.getDbDateFormat();
                displayFormat = cls.DateTimeHelper.parseDbDateFormat(dbDate);
                displayFormat += (sec ? " HH:mm:ss" : " HH:mm");
              }

              if (widget.setFormat) {
                widget.setFormat(displayFormat);
              }

              if (value && !isConstruct) {
                value = cls.DateTimeHelper.toDbDateFormat(value, displayFormat);
              }

              // TODO GBC-3554 GBC-4180 update table cached data model should not be done by VM behavior but directly in manageAUIOrder
              if (anchorNode.isInTable()) {
                const tableWidget = widget.getTableWidgetBase();
                const isAnticipateScrollingEnabled = tableWidget.isAnticipateScrollingEnabled();
                if (isAnticipateScrollingEnabled) {
                  const tableCachedDataModel = tableWidget.getCachedDataModel();
                  tableCachedDataModel.updateDataFromValueNode(anchorNode, "value", value);

                  const tableNode = anchorNode.getAncestor("Table");
                  if (anchorNode.getApplication().scheduler.hasScrollCommandsToProcess(tableNode)) {
                    // if there are some scroll commands to process, widget update will be done in the NativeScrollVMBehavior
                    return;
                  }
                }
              }

              if (widget.setValue) {
                widget.setValue(value, true);
              }

            }
          }
        }
      };
    });
  });
