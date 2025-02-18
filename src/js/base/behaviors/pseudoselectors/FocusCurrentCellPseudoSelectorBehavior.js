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

modulum('FocusCurrentCellPseudoSelectorBehavior', ['PseudoSelectorBehaviorBase'],
  function(context, cls) {
    /**
     * @class FocusCurrentCellPseudoSelectorBehavior
     * @memberOf classes
     * @extends classes.PseudoSelectorBehaviorBase
     */
    cls.FocusCurrentCellPseudoSelectorBehavior = context.oo.Singleton(cls.PseudoSelectorBehaviorBase, function($super) {
      return /** @lends classes.FocusCurrentCellPseudoSelectorBehavior.prototype */ {
        __name: "FocusCurrentCellPseudoSelectorBehavior",

        currentCellChanged: function(controller, data) {
          const node = controller.getAnchorNode();
          if (node._pseudoSelectorsUsedInSubTree.focus) {
            const offset = node.attribute('offset');
            const currentRowIndex = node.attribute('currentRow') - offset;
            if (node.getTag() === 'Table') {
              const currentColumn = node.attribute('currentColumn');
              if (data.previousCurrentRowIndex !== undefined && data.previousCurrentColumn !== undefined) {
                this._setTableCellStyleBasedBehaviorsDirty(node, data.previousCurrentRowIndex, data.previousCurrentColumn);
              }
              this._setTableCellStyleBasedBehaviorsDirty(node, currentRowIndex, currentColumn);
              data.previousCurrentRowIndex = currentRowIndex;
              data.previousCurrentColumn = currentColumn;
            } else {
              if (data.previousCurrentRowIndex !== undefined) {
                this._setColumnCellStyleBasedBehaviorsDirty(node, data.previousCurrentRowIndex);
              }
              this._setColumnCellStyleBasedBehaviorsDirty(node, currentRowIndex);
              data.previousCurrentRowIndex = currentRowIndex;
            }
          }
        },

        _setTableCellStyleBasedBehaviorsDirty: function(table, rowIndex, columnIndex) {
          const column = table.getChildren('TableColumn')[columnIndex];
          if (column) {
            this._setColumnCellStyleBasedBehaviorsDirty(column, rowIndex);
          }
        },

        _setColumnCellStyleBasedBehaviorsDirty: function(container, rowIndex) {
          const valueList = container.getFirstChild('ValueList');
          if (valueList) {
            const value = valueList.getChildren()[rowIndex];
            if (value) {
              const ctrl = value.getController();
              if (ctrl) {
                ctrl.setStyleBasedBehaviorsDirty(container, null, true);
              }
            }
          }
        },

        _attach: function(controller, data) {
          const node = controller.getAnchorNode();
          const updateFunction = this.currentCellChanged.bind(this, controller, data);
          data.onCurrentRowAttributeChanged = node.onAttributeChanged('currentRow', updateFunction);
          data.onOffsetAttributeChanged = node.onAttributeChanged('offset', updateFunction);
          if (node.getTag() === 'Table') {
            data.onCurrentColumnAttributeChanged = node.onAttributeChanged('currentColumn', updateFunction);
          }
        },

        _detach: function(controller, data) {
          if (data.onCurrentColumnAttributeChanged) {
            data.onCurrentColumnAttributeChanged();
            data.onCurrentColumnAttributeChanged = null;
          }
          if (data.onOffsetAttributeChanged) {
            data.onOffsetAttributeChanged();
            data.onOffsetAttributeChanged = null;
          }
          if (data.onCurrentRowAttributeChanged) {
            data.onCurrentRowAttributeChanged();
            data.onCurrentRowAttributeChanged = null;
          }
        }
      };
    });
  }
);
