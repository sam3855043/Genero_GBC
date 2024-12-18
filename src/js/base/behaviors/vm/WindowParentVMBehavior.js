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

modulum('WindowParentVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the widget's Menu
     * @class WindowParentVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.WindowParentVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.WindowParentVMBehavior.prototype */ {
        __name: "WindowParentVMBehavior",

        watchedAttributes: {
          anchor: ['parent']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const anchorNode = controller.getAnchorNode(),
            app = anchorNode && anchorNode.getApplication(),
            appUI = app.getUI();
          anchorNode.setParentWindowId(anchorNode.attribute('parent'));
          appUI.syncCurrentWindow();
        },
      };
    });
  });
