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

modulum('AggregateVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class AggregateVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.AggregateVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.AggregateVMBehavior.prototype */ {
        __name: "AggregateVMBehavior",

        watchedAttributes: {
          anchor: ['aggregateText', 'aggregateValue'],
          parent: ['aggregateText']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let bindings = controller.getNodeBindings();
          if (!(bindings.anchor.isAttributeSetByVM("aggregateText") ||
              bindings.anchor.isAttributeSetByVM("aggregateValue") ||
              bindings.parent.isAttributeSetByVM("aggregateText"))) {
            return;
          }
          let widget = controller.getWidget();
          if (widget?.setAggregate) {
            if (widget.getColumnIndex() === 0) {
              let globalText = bindings.parent.attribute('aggregateText');
              widget.getTableWidgetBase().setAggregateGlobalText(globalText);
            }

            let text = bindings.anchor.attribute('aggregateText');
            let value = bindings.anchor.attribute('aggregateValue');

            if (text !== "") {
              text = text + " ";
            }

            widget.setAggregate(text + value);
          }
        }
      };
    });
  });
