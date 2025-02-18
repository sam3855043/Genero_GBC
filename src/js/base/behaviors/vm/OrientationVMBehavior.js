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

modulum('OrientationVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class OrientationVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.OrientationVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.OrientationVMBehavior.prototype */ {
        __name: "OrientationVMBehavior",

        watchedAttributes: {
          decorator: ['orientation'],
          anchor: ['orientation']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.setOrientation) {
            let decoratorNode = controller.getNodeBindings().decorator;
            let anchor = controller.getNodeBindings().anchor;
            let attrNode = decoratorNode ? decoratorNode : anchor;
            let orientation = attrNode.attribute('orientation');
            widget.setOrientation(orientation);

            if (widget.isInstanceOf(cls.SliderWidget)) {
              let node = controller.getAnchorNode();
              let layoutService = node.getApplication().layout;

              if (data._afterLayoutHandler) {
                data._afterLayoutHandler();
                data._afterLayoutHandler = null;
              }
              data._afterLayoutHandler = layoutService.afterLayout(function() {
                widget.setOrientation(orientation, true);
              }.bind(this));
            }
          }
        },

        _detach: function(controller, data) {
          if (data._afterLayoutHandler) {
            data._afterLayoutHandler();
            data._afterLayoutHandler = null;
          }
        }
      };
    });
  });
