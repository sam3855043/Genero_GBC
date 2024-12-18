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

modulum('DefaultTTFColor4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class DefaultTTFColor4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.DefaultTTFColor4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.DefaultTTFColor4STBehavior.prototype */ {
        __name: "DefaultTTFColor4STBehavior",

        usedStyleAttributes: ["defaultTTFColor"],

        /**
         * Get the defaultTTFColor color to apply to the widget
         * @param {classes.ControllerBase} controller
         * @param {classes.WidgetBase} widget
         * @private
         */
        _getColor: function(controller, widget) {
          let windowColor, anchorColor = null;
          const anchorNode = controller.getAnchorNode();
          let winNode = anchorNode.getAncestor("Window");
          // If the widget is a Window
          if (winNode === null && widget instanceof cls.WindowWidget) {
            winNode = controller.getAnchorNode();
          }

          // For global toolbar that are not inside a window node
          if (winNode === null) {
            const windowId = controller.getAnchorNode().getApplication().getNode(0).attribute('currentWindow');
            winNode = controller.getUINode().getFirstChildWithId(windowId);
          }

          if (winNode) {
            windowColor = winNode.getStyleAttribute('defaultTTFColor');
          }

          // If current node has defaultTTFColor defined, use this one
          if (anchorNode && anchorNode.getStyleAttribute("defaultTTFColor")) {
            anchorColor = anchorNode.getStyleAttribute("defaultTTFColor");
          }

          return anchorColor ? anchorColor : windowColor;
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          if (widget) {
            const defaultColorFn = widget.setDefaultColor || widget.setDefaultTTFColor;
            if (defaultColorFn) {
              const color = this._getColor(controller, widget);
              if (color) {
                (defaultColorFn.bind(widget))(color);
              }
            }
          }
        }
      };
    });
  });
