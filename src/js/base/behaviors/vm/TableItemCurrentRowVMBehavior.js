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

modulum('TableItemCurrentRowVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableItemCurrentRowVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableItemCurrentRowVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableItemCurrentRowVMBehavior.prototype */ {
        __name: "TableItemCurrentRowVMBehavior",

        watchedAttributes: {
          table: ['currentRow', 'offset', 'dialogType', 'active']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setEnabled) {
            const tableNode = controller.getNodeBindings().table;
            const dialogType = tableNode.attribute('dialogType');

            if (dialogType === "Input" || dialogType === "Construct") {
              const currentRow = tableNode.attribute('currentRow');
              const offset = tableNode.attribute('offset');
              const itemNode = controller.getAnchorNode();
              const index = itemNode.getParentNode().getChildren().indexOf(itemNode);
              const enabled = (index === (currentRow - offset)) && (itemNode.getParentNode().getParentNode().attribute('active') ===
                1);
              widget.setEnabled(enabled);
            }
          }
        }
      };
    });
  });
