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

modulum('MatrixCurrentRowVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class MatrixCurrentRowVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.MatrixCurrentRowVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.MatrixCurrentRowVMBehavior.prototype */ {
        __name: "MatrixCurrentRowVMBehavior",

        watchedAttributes: {
          container: ['currentRow', 'offset', 'size'],
          ui: ['focus']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const bindings = controller.getNodeBindings();
          const matrixNode = bindings.container;
          const app = matrixNode.getApplication();

          if (!widget || app.scheduler.hasPendingNavigationCommands()) {
            return;
          }

          const uiNode = app.uiNode();
          const currentRow = matrixNode.attribute("currentRow");
          const offset = matrixNode.attribute("offset");
          const size = matrixNode.attribute("size");
          const hasFocus = matrixNode.getId() === uiNode.attribute("focus");

          let addCurrentRowOnField = currentRow !== -1 && (currentRow < size && currentRow - offset === bindings.anchor.getIndex());

          let newCurrentRow = -1;
          // case of scrollgrid
          let matrixParent = matrixNode.getParentNode();
          let matrixParentWidget = matrixParent && matrixParent.getController() && matrixParent.getController().getWidget();

          // Get the parent matrix that have the setCurrentRow method
          while (matrixParent && matrixParentWidget && !matrixParentWidget.setCurrentRow) {
            matrixParent = matrixParent.getParentNode();
            matrixParentWidget = matrixParent && matrixParent.getController() && matrixParent.getController().getWidget();
          }

          // If the parent matrix does have setCurrentRow method
          if (matrixParentWidget && matrixParentWidget.setCurrentRow) {

            // if one matrix in scrollgrid has a currentRow equal to -1 --> focusOnField activated
            if (currentRow === -1 && matrixParent.attribute("active") === 1) {
              matrixParentWidget.setFocusOnField(true);
            }

            // scrollgrid
            const scrollGridCurrentRow = matrixParent.attribute('currentRow');
            const scrollGridOffset = matrixParent.attribute('offset');

            newCurrentRow = scrollGridCurrentRow - scrollGridOffset;
            matrixParentWidget.setCurrentRow(newCurrentRow);

            const isDisplayArray = (matrixNode.attribute("dialogType") === "DisplayArray");
            if (isDisplayArray && matrixParentWidget.hasFocusOnField()) {
              addCurrentRowOnField = addCurrentRowOnField && matrixParentWidget.isHighlightCurrentCell();
            } else if (!isDisplayArray) {
              if (!matrixParentWidget.isHighlightCurrentRow() || matrixParentWidget.isHighlightCurrentCell()) {
                addCurrentRowOnField = addCurrentRowOnField && hasFocus && matrixParentWidget.isHighlightCurrentCell();
              } else {
                addCurrentRowOnField = addCurrentRowOnField && !hasFocus;
              }
            }
          } else if (matrixNode.getController().updateAllSiblingMatrixCurrentRow) {
            // synchronize processed currentRow with VM currentRow
            newCurrentRow = currentRow - offset;
            matrixNode.getController().updateAllSiblingMatrixCurrentRow(newCurrentRow);
          }

          // no hightlight row for alone matrix on input
          const dialogType = matrixNode.attribute("dialogType");
          if (dialogType === 'InputArray' && !matrixNode.isInScrollGrid() && !matrixNode.isInTable()) {
            addCurrentRowOnField = false;
          }

          widget.toggleClass("currentRow", addCurrentRowOnField);

          const parentForm = matrixNode.getAncestor("Form");
          let visibleId = null;
          if (parentForm) {
            visibleId = parentForm.attribute("visibleId");
          }
          // if matrix has vm focus and no visibleId is set on its parent form, then we display it
          if (hasFocus && (!visibleId || visibleId === -1)) {
            controller.ensureVisible();
          }
        }
      };
    });
  }
);
