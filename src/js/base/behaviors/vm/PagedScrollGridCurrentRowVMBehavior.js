/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('PagedScrollGridCurrentRowVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class PagedScrollGridCurrentRowVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.PagedScrollGridCurrentRowVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.PagedScrollGridCurrentRowVMBehavior.prototype */ {
        __name: "PagedScrollGridCurrentRowVMBehavior",

        watchedAttributes: {
          anchor: ['currentRow']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {

          let pagedScrollGridNode = controller.getAnchorNode();
          let currentRow = pagedScrollGridNode.attribute('currentRow');
          let pageSize = pagedScrollGridNode.attribute('pageSize');
          let offset = pagedScrollGridNode.attribute('offset');

          // if VM changes the currentRow need to display the correct page by changing offset
          let newOffset = Math.floor(currentRow / pageSize) * pageSize;
          if (newOffset !== offset) {
            let offsetEventData = {
              offset: newOffset
            };
            pagedScrollGridNode.getApplication().scheduler.eventVMCommand(new cls.VMConfigureEvent(pagedScrollGridNode.getId(),
                offsetEventData),
              pagedScrollGridNode);
          }
        }
      };
    });
  });
