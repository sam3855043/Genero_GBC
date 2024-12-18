/// FOURJS_START_COPYRIGHT(D,2021)
/// Property of Four Js*
/// (c) Copyright Four Js 2021, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('ValuePrefixedVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Prefix value according to UR spec for images or webcomponents
     * @class ValuePrefixedVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ValuePrefixedVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ValuePrefixedVMBehavior.prototype */ {
        __name: "ValuePrefixedVMBehavior",

        watchedAttributes: {
          anchor: ['value'],
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setValue) {
            const anchorNode = controller.getAnchorNode();
            const auiValue = anchorNode.attribute('value');

            let value;
            if (widget.getWebComponentType && widget.getWebComponentType() === "api") {
              value = auiValue;
            } else {
              value = anchorNode.getApplication().wrapResourcePath(auiValue);
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

            if (widget?.setValue) {
              widget.setValue(value, true);
            }
          }
        }
      };
    });
  });
