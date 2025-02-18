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

modulum('DBDateVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class DBDateVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.DBDateVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.DBDateVMBehavior.prototype */ {
        __name: "DBDateVMBehavior",

        watchedAttributes: {
          anchor: ['dbDate']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setDbDateFormat) {
            const anchorNode = controller.getAnchorNode();
            if (anchorNode.isAttributeSetByVM('dbDate')) {
              const dbDate = anchorNode.attribute('dbDate');
              widget.setDbDateFormat(dbDate);
            }
          }
        }
      };
    });
  });
