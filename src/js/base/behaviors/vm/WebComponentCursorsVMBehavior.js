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

modulum('WebComponentCursorsVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class WebComponentCursorsVMBehavior
     * Will override the cursor behavior since it's handled differently for webcomponents
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.WebComponentCursorsVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.WebComponentCursorsVMBehavior.prototype */ {
        __name: "WebComponentCursorsVMBehavior",

        watchedAttributes: {
          container: ['cursor', 'cursor2']
        },

        /**
         * Set cursors position to the widget input field
         * @param controller
         * @param data
         * @private
         */
        _apply: function(controller, data) {
          const widget = null;
          const containerNode = controller.getNodeBindings().container;

          // impossible condition ??
          if (widget?.hasCursors()) {
            const cursor = containerNode.attribute('cursor');
            const cursor2 = containerNode.attribute('cursor2');
            widget?.setCursors(cursor, cursor2);
          }
        },

      };
    });
  });
