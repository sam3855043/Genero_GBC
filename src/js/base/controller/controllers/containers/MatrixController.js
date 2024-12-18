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

modulum('MatrixController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class MatrixController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.MatrixController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.MatrixController.prototype */ {
        __name: "MatrixController",
        _currentRow: 0,
        /**
         * true if value list has been initialized and created manually next to a delayed attribute change
         */
        _isValueListCreationForced: false,

        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          this.setCurrentRow(this.getAnchorNode().attribute("currentRow"));
          // pseudo-selector behaviors
          this._addBehavior(cls.FocusCurrentCellPseudoSelectorBehavior);
          this._addBehavior(cls.OffsetPseudoSelectorBehavior);
          this._addBehavior(cls.HiddenVMBehavior);
        },

        /**
         * @inheritDoc
         */
        setFocus: function() {
          const widget = this.getCurrentInternalWidget();
          if (widget) {
            if (this.isInScrollGrid()) {
              const scrollGridNode = this.getAnchorNode().getAncestor('ScrollGrid');
              const scrollGridController = scrollGridNode.getController();
              if (scrollGridController.getWidget() && scrollGridController.getWidget().activateRowBound) {
                scrollGridController.getWidget().activateRowBound();
              }
              // show filter when matrix is in scrollgrid
              scrollGridController.showReduceFilter();
            }
            widget.setFocus();
          } else {
            const appWidget = context.SessionService.getCurrent().getCurrentApplication().getUI().getWidget();
            if (appWidget) {
              const uiWidget = appWidget._uiWidget;
              if (uiWidget) {
                uiWidget.setFocus();
              }
            }
          }
        },

        setCurrentRow: function(currentRow) {
          this._currentRow = currentRow;
        },

        getCurrentRow: function() {
          return this._currentRow;
        },

        // @todo : not used at the moment
        updateCurrentRow: function(matrixNode, currentRow) {
          // Check if we are in a ScrollGrid
          const scrollGridNode = matrixNode.getAncestor('ScrollGrid');
          const scrollGridWidget = scrollGridNode ? scrollGridNode.getController().getWidget() : null;
          if (scrollGridWidget && scrollGridWidget.setCurrentRow) { // SCROLLGRID
            if (currentRow === -1 && scrollGridNode.attribute("active") === 1) {
              // if one matrix in scrollgrid has a currentRow equal to -1 --> focusOnField activated
              scrollGridWidget.setFocusOnField(true);
            }
            scrollGridWidget.setCurrentRow(currentRow);
            this.updateAllSiblingMatrixCurrentRow(currentRow, true, true);
          } else { // SIMPLE MATRIX
            const dialogType = matrixNode.attribute('dialogType');
            const displayDialog = dialogType === "Display" || dialogType === "DisplayArray";
            if (matrixNode.getTag() === "Matrix" && displayDialog) {
              matrixNode.getController().updateAllSiblingMatrixCurrentRow(currentRow, true);
            }
          }
          return null;
        },

        updateAllSiblingMatrixCurrentRow: function(currentRow, updateCss, isScrollGrid) {
          const matrixParent = this.getAnchorNode().getParentNode();
          if (!matrixParent) {
            return;
          }

          const childrenMatrix = matrixParent.getChildren("Matrix");
          if (!childrenMatrix) {
            return;
          }

          for (const colMatrix of childrenMatrix) {
            // update processing current row
            const matrixCtrl = colMatrix.getController();
            if (!matrixCtrl) {
              continue;
            }

            const previousRow = matrixCtrl.getCurrentRow();
            if (matrixCtrl && matrixCtrl.setCurrentRow) {
              matrixCtrl.setCurrentRow(currentRow);
            }

            // update current row css
            if (!updateCss) {
              continue;
            }

            const valueList = colMatrix.getFirstChild("ValueList");
            const widgets = valueList ? colMatrix.getFirstChild("ValueList").getChildren() : [];

            if (currentRow >= widgets.length || previousRow >= widgets.length) {
              continue;
            }

            const previousWidget = widgets[previousRow];
            if (previousWidget) {
              previousWidget.getController().getWidget().removeClass("currentRow");
            }
            const newWidget = widgets[currentRow];
            if (!newWidget) {
              continue;
            }
            let addCurrentRowOnField = true;
            const matrixParentWidget = matrixParent.getController().getWidget();
            if (isScrollGrid && matrixParentWidget.hasFocusOnField) {
              const matrixNode = this.getAnchorNode();
              const uiNode = matrixParent.getApplication().uiNode();
              const hasFocus = matrixNode.getId() === uiNode.attribute("focus");

              const isDisplayArray = (matrixNode.attribute("dialogType") === "DisplayArray");

              if (isDisplayArray && matrixParentWidget.hasFocusOnField()) {
                addCurrentRowOnField = addCurrentRowOnField && matrixParentWidget.isHighlightCurrentCell();
              } else if (!isDisplayArray && !matrixParentWidget.isHighlightCurrentRow()) {
                addCurrentRowOnField = addCurrentRowOnField && hasFocus && matrixParentWidget.isHighlightCurrentCell();
              }

            }
            newWidget.getController().getWidget().toggleClass("currentRow", addCurrentRowOnField);
          }
        },

        /**
         * Sends the updated value to the DVM
         * @private
         */
        sendWidgetValue: function(newValue = null) {
          const valueNode = this.getAnchorNode().getCurrentValueNode(true);
          if (valueNode) {
            const ctrl = valueNode.getController();
            if (ctrl) {
              ctrl.sendWidgetValue(newValue);
            }
          }
        },
      };
    });
    cls.ControllerFactory.register("Matrix", cls.MatrixController);

  });
