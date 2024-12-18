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

modulum('ShowVirtualKeyboard4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class ShowVirtualKeyboard4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.ShowVirtualKeyboard4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.ShowVirtualKeyboard4STBehavior.prototype */ {
        __name: "ShowVirtualKeyboard4STBehavior",

        usedStyleAttributes: ["showVirtualKeyboard"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();

          if (widget?.setShowVirtualKeyboardOnFocus) {
            const showKeyboard = controller.getAnchorNode().getStyleAttribute('showVirtualKeyboard');
            widget.setShowVirtualKeyboardOnFocus(showKeyboard !== null && showKeyboard.toUpperCase() === "ONFOCUS");
          }
        }
      };
    });
  });
