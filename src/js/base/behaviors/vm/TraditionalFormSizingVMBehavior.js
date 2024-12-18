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

modulum('TraditionalFormSizingVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TraditionalFormSizingVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TraditionalFormSizingVMBehavior = context.oo.Singleton(cls.BehaviorBase, function() {
      return /** @lends classes.TraditionalFormSizingVMBehavior.prototype */ {
        __name: "TraditionalFormSizingVMBehavior",

        watchedAttributes: {
          parent: ['width', 'height', 'posX', 'posY']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const window = controller.getAnchorNode().getParentNode();
          const widget = controller.getWidget();
          const baseheight =
            parseFloat(context.ThemeService.getValue("theme-field-default-height")) +
            2 * parseFloat(context.ThemeService.getValue("theme-field-height-ratio"));
          const left = window.attribute("posX");
          const top = Math.round(window.attribute("posY") * baseheight);
          const width = window.attribute("width");
          const height = Math.round(window.attribute("height") * baseheight);
          const letterSpacing = context.ThemeService.getValue("theme-traditional-mode-letter-spacing");
          const winStyle = window.attribute("style");

          const style = {
            top: top + 'px !important',
            left: 'calc(' + left + 'ch + ' + left + ' * ' + letterSpacing + ') !important',
            'min-height': height + 'px !important',
            'min-width': 'calc(' + width + 'ch + ' + width + ' * ' + letterSpacing + ') !important'
          };

          if (winStyle !== 'dialog') {
            style.position = 'absolute';
          }

          widget.setStyle(style);
        }
      };
    });
  }
);
