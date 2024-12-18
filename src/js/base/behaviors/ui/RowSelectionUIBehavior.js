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

modulum('RowSelectionUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class RowSelectionUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.RowSelectionUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.RowSelectionUIBehavior.prototype */ {
        __name: "RowSelectionUIBehavior",

        /**
         * @inheritDoc
         * @protected
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.onClickHandle = widget.when(context.constants.widgetEvents.tableClick, this._onClick.bind(this, controller, data));
          }
        },
        /**
         * @inheritDoc
         * @protected
         */
        _detachWidget: function(controller, data) {
          if (data.onClickHandle) {
            data.onClickHandle();
            data.onClickHandle = null;
          }
        },

        _onClick: function(controller, data, event, sender, domEvent) {
          const bindings = controller.getNodeBindings();
          const anchorNode = bindings.anchor;
          const tableNode = bindings.container.getParentNode();

          if (tableNode.attribute('multiRowSelection') !== 0) {
            const offset = tableNode.attribute('offset');
            const index = anchorNode.getIndex();
            const clickedRow = offset + index;

            // If right click on selected row, just ignore it
            if (domEvent.which === 3 && tableNode.getWidget().getRows()[clickedRow].isSelected()) {
              return;
            }

            const vmEvent = tableNode.getController().buildRowSelectionEvent(clickedRow, domEvent.ctrlKey || domEvent.metaKey,
              domEvent.shiftKey);

            tableNode.getApplication().scheduler.eventVMCommand(vmEvent, anchorNode, true);
          }
        }
      };
    });
  });
