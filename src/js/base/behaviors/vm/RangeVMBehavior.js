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

modulum('RangeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class RangeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.RangeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.RangeVMBehavior.prototype */ {
        __name: "RangeVMBehavior",

        watchedAttributes: {
          decorator: ['valueMin', 'valueMax', 'step']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const decoratorNode = controller.getNodeBindings().decorator;
          if (widget?.setMax) {
            const valueMax = decoratorNode.attribute('valueMax');
            widget.setMax(valueMax);
          }
          if (widget?.setMin) {
            const valueMin = decoratorNode.attribute('valueMin');
            widget.setMin(valueMin);
          }
          if (widget?.setStep) {
            const step = decoratorNode.attribute('step');
            widget.setStep(step);
          }
        }
      };
    });
  });
