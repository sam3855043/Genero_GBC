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

modulum('StretchableScrollGridPageSizeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class StretchableScrollGridPageSizeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.StretchableScrollGridPageSizeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.StretchableScrollGridPageSizeVMBehavior.prototype */ {
        __name: "StretchableScrollGridPageSizeVMBehavior",

        _previousValueListsAmount: 0,

        watchedAttributes: {
          anchor: ['wantFixedPageSize', 'size', 'offset', 'pageSize', 'bufferSize']
        },
        /**
         *
         * @param controller
         * @param data
         */
        setup: function(controller, data) {
          data.linesCount = 0;
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          if (data.animationFrameOffset) {
            window.cancelAnimationFrame(data.animationFrameOffset);
          }
          // This requestAnimationFrame is needed as we have to create lines only once the layout has been done
          data.animationFrameOffset = window.requestAnimationFrame(
            function() { // TODO Check if we can use LayoutApplicationService.onAfterLayout
              data.animationFrameOffset = 0;
              context.styler.bufferize();
              const scrollGridNode = controller.getAnchorNode();
              const valueListNode = scrollGridNode.getDescendants("ValueList");

              if (scrollGridNode && valueListNode.length > 0) {
                const size = scrollGridNode.attribute('size');
                const pageSize = scrollGridNode.attribute('pageSize');
                const bufferSize = scrollGridNode.attribute('bufferSize');
                const offset = scrollGridNode.attribute('offset');
                const count = Math.max(pageSize, bufferSize);
                let lineIndex;
                let lineController;
                const linesCount = controller.getLineControllersCount();

                // If a widget was initially set hidden, the matrix starts with no value list
                const hasNewValueLists = (valueListNode.length > this._previousValueListsAmount);
                if (hasNewValueLists) {
                  // Create the corresponding controllers and widgets
                  for (lineIndex = 0; lineIndex < controller.getLineControllersCount(); ++lineIndex) {
                    controller.getLineController(lineIndex).updateControllers();
                  }
                }
                if (linesCount !== count) {
                  for (lineIndex = linesCount; lineIndex < count; ++lineIndex) {
                    // Add widgets
                    lineController = new cls.ScrollGridLineController(scrollGridNode, lineIndex);
                    scrollGridNode.getController().getWidget().addChildWidget(lineController.getWidget());
                    controller.pushLineController(lineController);
                  }
                  for (lineIndex = linesCount - 1; lineIndex >= count; --lineIndex) {
                    // Remove Widgets
                    lineController = controller.popLineController();
                    lineController.destroy();
                  }
                  controller.getWidget().updateHighlight();

                  //Needed to correct updateHighlight actions
                  if (this._previousValueListsAmount === 0) {
                    const ctrl = controller.getLineController(controller.getCurrentRow() > 0 ? controller.getCurrentRow() : controller
                      .getWidget().getCurrentRow());

                    if (ctrl) {
                      ctrl._applyBehaviors();
                    }
                  }
                }

                // we need to detect cases when stretchable scrollgrid is being setuped (bufferSize, pageSize, size returned by VM) from the case where only offset is changed
                // on first launches (setuping) we need to hide images to avoid flickering but once we scroll we don't want to hide them anymore to avoid flickering as well
                // to detect stretchable setuping we listen and compare bufferSize attribute (supposed to be set at the beginning only and not during scrolls anymore
                const firstLaunch = bufferSize !== controller.getWidget().getBufferSize();
                controller.getWidget().setBufferSize(bufferSize);

                // Add the new line to the DOM but set its visibility to hidden.
                // It will be displayed in the after layout handler below.
                // This avoids flashs with SVG images during the initial render.
                for (lineIndex = 0; lineIndex < controller.getLineControllersCount(); ++lineIndex) {
                  lineController = controller.getLineController(lineIndex);
                  const hidden = offset + lineIndex >= size;
                  lineController.getWidget().setHidden(hidden);
                  // hide images when scrollgrid is building until layout is finished
                  // only do that on first setup and not anymore during scrolling to avoid image flickering by hiding/showing it very quickly
                  if (firstLaunch) {
                    lineController.getWidget().addClass('loading-line');
                  }
                }

                context.styler.flush();
                scrollGridNode.getApplication().layout.afterLayout(function(isFirstLaunch) {
                  if (controller.getWidget()) {
                    if (isFirstLaunch) {
                      for (lineIndex = 0; lineIndex < controller.getLineControllersCount(); ++lineIndex) {
                        lineController = controller.getLineController(lineIndex);
                        if (lineController) {
                          const lineWidget = lineController.getWidget();
                          if (lineWidget && lineWidget.getElement()) {
                            lineWidget.removeClass('loading-line');
                          }
                        }
                      }
                    }
                    //We must recalculate the scroll div height after gridline count update
                    if (controller.getWidget().isInstanceOf(cls.StretchableScrollGridWidget)) {
                      controller.getWidget().updateVerticalScroll(false);
                    }
                  }
                }.bind(this, firstLaunch), true);
                scrollGridNode.getApplication().scheduler.layoutCommand({
                  resize: true
                });

                this._previousValueListsAmount = valueListNode.length;
              }
            }.bind(this));
        },

        /**
         * @inheritDoc
         */
        _detach: function(controller, data) {
          if (data.animationFrameOffset) {
            window.cancelAnimationFrame(data.animationFrameOffset);
            data.animationFrameOffset = 0;
          }
        },
      };
    });
  }
);
