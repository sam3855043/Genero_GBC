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

modulum('FormLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {
    /**
     * @class FormLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.FormLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.FormLayoutEngine.prototype */ {
        __name: "FormLayoutEngine",
        _initialRenderSize: null,
        /**
         * Auto overflow mode. Active when the form is taller than the browser viewport
         * @type {boolean}
         */
        _autoOverflowMode: false,
        /**
         * stylesheet id
         */
        _styleSheetId: null,
        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._styleSheetId = "formLayout_" + widget.getUniqueIdentifier();
        },
        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);
          this._initialRenderSize = null;
          this._autoOverflowMode = false;
          const modal = this._widget && this._widget.getParentWidget() && this._widget.getParentWidget().getModal();
          if (modal) {
            modal.resetLayout();
            modal._hasBeenSized = false;
          }
        },
        _getMinHintWidth: function() {
          const layoutInfo = this._getLayoutInfo();
          return cls.CharSize.translate(layoutInfo.getMinSizeHint().getWidth(), layoutInfo.getCharSize().getWidthM(),
            layoutInfo.getCharSize().getWidth0());
        },
        _getMinHintHeight: function() {
          const layoutInfo = this._getLayoutInfo();
          return cls.Size.translate(layoutInfo.getMinSizeHint().getHeight(), layoutInfo.getCharSize().getHeight());
        },

        /**
         * @inheritDoc
         */
        prepareMeasure: function() {
          const modal = this._widget && this._widget.getParentWidget() && this._widget.getParentWidget().getModal();
          if (modal) {
            const element = this._widget.getElement();
            if (!this._initialRenderSize) {
              this._initialRenderSize = {
                x: element.offsetWidth,
                y: element.offsetHeight
              };
            }
          }
        },

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          const windowWidget = this._widget.getWindowWidget();
          if (windowWidget?.isModal) {
            // need a little extra space reserved as decoration for mobile (font size increase?) to avoid mini scrollbars appearing in Modal middle container
            const extraMargins = window.isMobile() ? context.ThemeService.getValue("gbc-ModalWidget-margin-ratio") * 30 : 0;
            const menuContainers = windowWidget.getMenuContainers();
            const menusXWidth = menuContainers.left.offsetWidth + menuContainers.right.offsetWidth,
              menusYHeight = menuContainers.top.offsetHeight + menuContainers.bottom.offsetHeight;
            const titleHeight = windowWidget.getModal().getHeader().offsetHeight,
              footerHeight = windowWidget.getModal().getFooter().offsetHeight;
            const decorateHeight = titleHeight + footerHeight + menusYHeight + extraMargins,
              decorateWidth = menusXWidth + extraMargins;
            this._getLayoutInfo().setDecorating(decorateWidth, decorateHeight);
          }
        },

        /**
         * @inheritDoc
         */
        measure: function() {
          if (this._widget.getParentWidget().isModal) {
            this._measureModal();
          } else {
            this._measure();
          }
        },
        _measure: function() {
          const layoutInfo = this._getLayoutInfo();
          // set form dom size (offsetWidth/offsetHeight) as MEASURED
          layoutInfo.setMeasured(
            layoutInfo.getRawMeasure().getWidth(true),
            layoutInfo.getRawMeasure().getHeight(true)
          );
          // transfer form measured size to child group as available size (to be potentially used later on as allocated size for child group children)
          const childInfo = this._getLayoutInfo(this._widget.getChildren()[0]);
          if (childInfo) {
            const measured = layoutInfo.getMeasured();
            childInfo.wouldOverflowContainerIfNeeded(true);
            // will be overriden in adjustMeasure, is it needed here ?
            childInfo.setAvailable(measured.getWidth(), measured.getHeight());
          }
        },
        _measureModal: function() {
          const layoutInfo = this._getLayoutInfo(),
            width = this._getMinHintWidth(),
            height = this._getMinHintHeight();

          // set modal form min size as MINIMAL and MEASURED (is it needed ?)
          layoutInfo.setMinimal(width, height);
          layoutInfo.setMeasured(width, height);

          const availViewport = this._widget.getUserInterfaceWidget()?.getContainerElement()?.getBoundingClientRect();

          const measuredWidth = availViewport ? availViewport.width : 0;
          const measuredHeight = availViewport ? availViewport.height : 0;
          const decorationWidth = layoutInfo.getDecorating().getWidth(true);
          const decorationHeight = layoutInfo.getDecorating().getHeight(true);

          // set modal form available size with application measured size (modal viewport basically)
          // check to remove
          layoutInfo.setAvailable(
            measuredWidth - decorationWidth,
            measuredHeight - decorationHeight
          );
          const childInfo = this._getLayoutInfo(this._widget.getChildren()[0]);
          if (childInfo) {
            childInfo.setAvailable(
              measuredWidth - decorationWidth,
              measuredHeight - decorationHeight
            );
          }

        },

        /**
         * @inheritDoc
         */
        adjustMeasure: function(lastInvalidated, layoutApplicationService) {
          const windowWidget = this._widget.getWindowWidget(),
            isInModal = windowWidget && windowWidget.isModal;
          if (isInModal) {
            this._adjustMeasureModal();
          } else {
            this._adjustMeasure();
          }
        },
        _adjustMeasure: function() {
          const windowWidget = this._widget.getWindowWidget();
          const parentLayoutInformation = windowWidget.getLayoutInformation();
          const childInfo = this._getLayoutInfo(this._widget.getChildren()[0]);

          if (childInfo) {
            // flag child container as overflowable
            childInfo.wouldOverflowContainerIfNeeded(true);
            // if window is sizable, we take form measured size, otherwise we take child group measured size
            const measure = parentLayoutInformation.isSizable() ? this._getLayoutInfo().getMeasured() : childInfo.getMeasured();
            // if child group measured size is bigger than form measured size, set "willScroll" as true
            const willXScroll = childInfo.getMeasured().getWidth() > measure.getWidth();
            const willYScroll = childInfo.getMeasured().getHeight() > measure.getHeight();

            // set form measured size as available size on child group minus scrollbar size if child group will scroll
            childInfo.setAvailable(
              measure.getWidth() - (willYScroll ? window.scrollBarSize : 0),
              measure.getHeight() - (willXScroll ? window.scrollBarSize : 0)
            );

            // if window is sizable : if child group minimal height is bigger than form measured height, then flag form as autoOverflowMode
            if (parentLayoutInformation.isSizable()) {
              const minimal = childInfo.getMinimal();
              if (minimal.getHeight(true) > measure.getHeight(true)) {
                if (!this._statuses.adjusted) {
                  this._autoOverflowMode = true;
                }
              }
            }
          }
        },
        _adjustMeasureModal: function() {
          const childInfo = this._getLayoutInfo(this._widget.getChildren()[0]);
          if (childInfo) {
            const windowWidget = this._widget.getWindowWidget();
            const childMeasure = childInfo.getMeasured();
            childInfo.wouldOverflowContainerIfNeeded(true);
            const modal = windowWidget.getModal();
            const childPreferred = childInfo.getPreferred();
            let sizedX = 0,
              sizedY = 0;

            if (modal._hasBeenSized) {
              const childMinimal = childInfo.getMinimal(),
                sizingInfo = modal._sizingPositions;
              sizedX = sizingInfo.size.x - sizingInfo.decoration.x;
              sizedY = sizingInfo.size.y - sizingInfo.decoration.y;

              // set modal form measured size with : max between child group preferred size (.PER defined size), child group min size and manual size (why not always take manual size when it has been sized ?)
              const formMeasuredWidth = Math.max(childPreferred.getWidth(true), sizedX - window.scrollBarSize, childMinimal.getWidth(
                true));
              const formMeasuredHeight = Math.max(childPreferred.getHeight(true), sizedY - window.scrollBarSize, childMinimal
                .getHeight(
                  true));
              this._getLayoutInfo().setMeasured(formMeasuredWidth, formMeasuredHeight);
            }
            const measuredX = Math.max(childPreferred.getWidth(true), childMeasure.getWidth(true), this._getLayoutInfo().getMeasured()
              .getWidth(true));
            const measuredY = Math.max(childPreferred.getHeight(true), childMeasure.getHeight(true), this._getLayoutInfo().getMeasured()
              .getHeight(true));

            const formAvailable = this._getLayoutInfo().getAvailable();

            const willXScroll = measuredX > formAvailable.getWidth();
            const willYScroll = measuredY > formAvailable.getHeight();

            const availableX = (willXScroll ? formAvailable.getWidth() - window.scrollBarSize : measuredX);
            const availableY = (willYScroll ? formAvailable.getHeight() - window.scrollBarSize : measuredY);

            // set child available with max between form measured, child preferred, child measured if size doesn't exceed form available size, otherwise take form available size
            childInfo.setAvailable((sizedX || availableX), (sizedY || availableY));

            // if child height is going to overflow and generates vertical scrollbars in all case,
            // then flag autoOverflowMode to allow stretchable child to use their preferred size instead of their minimal size
            const minimal = childInfo.getMinimal();
            if (minimal.getHeight(true) > childInfo.getAvailable().getHeight(true)) {
              if (!this._statuses.adjusted) {
                this._autoOverflowMode = true;
              }
            }

          }
        },

        /**
         * @inheritDoc
         */
        applyLayout: function() {
          const parentWidget = this._widget.getParentWidget(),
            isInModal = parentWidget && parentWidget.isModal,
            modal = parentWidget && parentWidget.getModal();

          if (isInModal) {
            const childInfo = this._getLayoutInfo(this._widget.getChildren()[0]);
            if (modal) {
              modal._sizingPositions.contentMin = {
                x: Math.max(childInfo.getMinimal().getWidth(true), this._getMinHintWidth()),
                y: Math.max(childInfo.getMinimal().getHeight(true), this._getMinHintHeight())
              };
            }
          }
        },

        /**
         * @inheritDoc
         */
        notifyLayoutApplied: function() {
          $super.notifyLayoutApplied.call(this);
          this._onNotified();
        },

        _onNotified: function() {
          const widget = this._widget,
            windowWidget = widget && widget.getWindowWidget();
          if (windowWidget) {
            if (windowWidget.isModal) {
              this._notifyModal();
            } else {
              this._notify();
            }
          }
        },

        _notify: function() {
          const style = {};
          let overflownX = false,
            overflownY = false;
          const widget = this._widget,
            windowWidget = widget && widget.getWindowWidget(),
            element = widget.getElement();
          if (widget) {
            // need to check : if disabled: don't do that, but if visible behind modal, do that!
            if (windowWidget && !windowWidget._disabled) {
              const measured = widget.getLayoutInformation().getMeasured(),
                childWidget = widget.getChildren() && widget.getChildren()[0],
                childAllocated = childWidget && childWidget.getLayoutInformation().getAllocated(),
                childAllocatedWidth = childAllocated ? childAllocated.getWidth() : 0,
                childAllocatedHeight = childAllocated ? childAllocated.getHeight() : 0,
                dWidth = measured.getWidth() - childAllocatedWidth,
                dHeight = measured.getHeight() - childAllocatedHeight;
              style["#w_" + this._widget.getUniqueIdentifier() + ".g_measureable>.containerElement>.gbc_FormWidget_scrollkeeper"] = {
                height: (childAllocated && childAllocated.hasHeight(true)) ? cls.Size.cachedPxImportant(childAllocated.getHeight()) : null
              };
              context.styler.appendStyleSheet(style, this._styleSheetId, true, this.getLayoutSheetId());

              overflownX = dWidth < -0.9;
              overflownY = dHeight < -0.9;

              // Case where Webkit Scrollbars are used
              if (overflownY &&
                dWidth > 0 &&
                gbc.ThemeService.getValue("theme-webkit-scrollbars-global-enable") &&
                'WebkitAppearance' in document.documentElement.style) {
                overflownX = dWidth < window.scrollBarSize + 1;
              }

            }
            element
              .toggleClass("notOverflownX", !overflownX)
              .toggleClass("notOverflownY", !overflownY)
              .toggleClass("overflownX", overflownX)
              .toggleClass("overflownY", overflownY);
          }
        },
        _notifyModal: function() {
          const widget = this._widget,
            element = widget.getElement(),
            layoutInformation = widget.getLayoutInformation(),
            windowWidget = widget.getWindowWidget(),
            modal = windowWidget.getModal(),
            modalElement = modal.getElement(),
            modalpane = modalElement && modalElement.child("mt-dialog-pane"),
            modalcontent = modalpane && modalpane.child("mt-dialog-content");
          if (modalcontent) {
            const deltaWidth = modalpane.offsetWidth - modalElement.offsetWidth,
              deltaHeight = modalpane.offsetHeight - modalElement.offsetHeight,
              menuContainers = windowWidget.getMenuContainers();
            if (window.browserInfo.isSafari) {
              element.addClass("safariMeasure");
            }
            const measure = layoutInformation.getMeasured(),
              firstChild = widget.getChildren()[0],
              childInfo = firstChild && firstChild.getLayoutInformation(),
              childMeasure = childInfo && childInfo.getMeasured(),

              referenceWidth = modal._hasBeenSized ? 0 : childInfo.getPreferred().getWidth(true),
              referenceHeight = modal._hasBeenSized ? 0 : childInfo.getPreferred().getHeight(true);

            const width = Math.max(referenceWidth,
              childMeasure && childMeasure.getWidth() || (element.clientWidth - (deltaWidth > 0 ? deltaWidth : 0)),
              this._getMinHintWidth()
            );
            measure.setWidth(width);
            const height = Math.max(referenceHeight,
              childMeasure && childMeasure.getHeight() || (element.clientHeight - (deltaHeight > 0 ? deltaHeight : 0)),
              this._getMinHintHeight()
            );
            measure.setHeight(height);
            if (window.browserInfo.isSafari) {
              this._widget.getElement().removeClass("safariMeasure");
            }

            const menusXWidth = Math.max(0, menuContainers.left.offsetWidth + menuContainers.right.offsetWidth - 1),
              minWidth = this._getMinHintWidth(),
              minHeight = this._getMinHintHeight();
            const minStyle = {};
            minStyle[".g_measured .gbc_ModalWidget #w_" + this._widget.getUniqueIdentifier() + ".g_measureable"] = {
              "min-width": cls.Size.cachedPxImportant(minWidth),
              "min-height": cls.Size.cachedPxImportant(minHeight)
            };
            context.styler.appendStyleSheet(minStyle, this._styleSheetId, true, this.getLayoutSheetId());

            const modalContentWidth = modalcontent.offsetWidth - menusXWidth;
            const contentMaxWidth = Math.max(measure.getWidth() + window.scrollBarSize + menusXWidth, this._getMinHintWidth());
            const calculatedWidth = (modal._hasBeenSized ? modalContentWidth : contentMaxWidth);
            this._widget.getLayoutInformation().setToolbarAllocatedWidth(calculatedWidth);

            if (windowWidget._toolBarWidget) {
              windowWidget._toolBarWidget.setStyle({
                "width": calculatedWidth + "px"
              });
            }
            if (modal) {
              modal.setMeasuredInfo(this._getLayoutInfo().getMeasured());
              modal.ensureInViewPort();
            }

            modalElement.removeClass('g_needLayout');
          }
        },

        /**
         * @inheritDoc
         */
        invalidateMeasure: function(invalidation) {
          const invalidated = !invalidation || this._invalidatedMeasure < invalidation;
          $super.invalidateMeasure.call(this, invalidation);
          if (invalidated) {
            this.invalidateAllocatedSpace(this._invalidatedMeasure);
          }
        },

        /**
         * @inheritDoc
         */
        invalidateAllocatedSpace: function(invalidation) {
          const invalidated = !invalidation || this._invalidatedAllocatedSpace < invalidation;
          $super.invalidateAllocatedSpace.call(this, invalidation);
          if (invalidated) {
            this.invalidateMeasure(this._invalidatedAllocatedSpace);
          }
        },

        /**
         * @return {boolean} true when the form is taller than the browser viewport
         */
        isAutoOverflowActivated: function() {
          return this._autoOverflowMode;
        },

        /**
         * @inheritDoc
         */
        needMeasureSwitching: function() {
          return false;
        },

        /**
         * @inheritDoc
         */
        needMeasure: function() {
          return true;
        }
      };
    });
  });
