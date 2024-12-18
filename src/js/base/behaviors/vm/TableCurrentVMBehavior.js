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

modulum('TableCurrentVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableCurrentVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableCurrentVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableCurrentVMBehavior.prototype */ {
        __name: "TableCurrentVMBehavior",

        watchedAttributes: {
          anchor: ['currentRow', 'currentColumn', 'offset']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setCurrentRow) {
            const tableNode = controller.getAnchorNode();
            const app = tableNode.getApplication();
            const uiNode = app.uiNode();
            const currentRow = tableNode.attribute('currentRow');

            if (!app.scheduler.hasPendingNavigationCommands()) {
              const offset = tableNode.attribute('offset');
              const size = tableNode.attribute('size');
              const localCurrentRow = currentRow - offset;

              if (!app.scheduler.hasPendingScrollCommands()) {
                const ensureRowVisible = (currentRow !== data.oldCurrentRow && localCurrentRow === 0 && size > 0);
                widget.setCurrentRow(localCurrentRow, ensureRowVisible, currentRow);
              }

              if (widget.setCurrentColumn) {
                let hasChanged = false;
                const currentColumn = tableNode.attribute('currentColumn');
                if (widget.getCurrentColumn) {
                  hasChanged = currentColumn !== widget.getCurrentColumn();
                }
                widget.setCurrentColumn(currentColumn);
                // look to manually scroll to the new column if not currenty visible
                if (hasChanged) {
                  if (widget.scrollToCurrentColumn) {
                    widget.scrollToCurrentColumn();
                  }
                }
              }

              if (widget.updateCurrentItem) {
                widget.updateCurrentItem();
              }
            }

            const hasFocus = tableNode.getId() === uiNode.attribute("focus");
            const parentForm = tableNode.getAncestor("Form");
            let visibleId = null;
            if (parentForm) {
              visibleId = parentForm.attribute("visibleId");
            }
            // if table has vm focus and no visibleId is set on its parent form, then we display it
            if (hasFocus && (!visibleId || visibleId === -1)) {
              controller.ensureVisible();
            }

            // =====================================
            if (controller.updateMultiRowSelectionRoot && data.oldCurrentRow !== currentRow) {
              controller.multiRowSelectionRoot = currentRow;
            }

            controller.updateMultiRowSelectionRoot = true;
            // =====================================

            data.oldCurrentRow = currentRow;
          }
        }
      };
    });
  });
