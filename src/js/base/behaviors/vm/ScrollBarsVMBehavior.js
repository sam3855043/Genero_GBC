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

modulum('ScrollBarsVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ScrollBarsVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ScrollBarsVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ScrollBarsVMBehavior.prototype */ {
        __name: "ScrollBarsVMBehavior",

        watchedAttributes: {
          decorator: ['scrollBars']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setScrollBars) {
            const decoratorNode = controller.getNodeBindings().decorator;
            const scrollBars = decoratorNode.isAttributeSetByVM('scrollBars') ? decoratorNode.attribute('scrollBars').toLowerCase() :
              'auto';
            widget.setScrollBars(scrollBars);
          }
        }
      };
    });
  });
