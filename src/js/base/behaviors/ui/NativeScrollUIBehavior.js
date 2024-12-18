/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('NativeScrollUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class NativeScrollUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.NativeScrollUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.NativeScrollUIBehavior.prototype */ {
        __name: "NativeScrollUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          controller.requestOffsetPending = false;
          const widget = /** @type classes.TableWidgetBase|classes.StretchableScrollGridWidget */ controller.getWidget();
          if (widget) {
            data.scrollHandle = widget.when(context.constants.widgetEvents.scroll, this._onScroll.bind(this, controller, data));
            widget.getScrollableArea().on('wheel.NativeScrollUIBehavior', this._preventWhenRequestOffsetPending.bind(this, controller));
            widget.getScrollableArea().on('scroll.NativeScrollUIBehavior', this._preventWhenRequestOffsetPending.bind(this, controller));
          }
          data.requestedOffset = null;
        },

        /**
         * Prevent event when an offset request is pending
         * @param {classes.ControllerBase} controller
         * @param {Object} event - DOM event
         * @private
         */
        _preventWhenRequestOffsetPending: function(controller, event) {
          // for perf, prevent default when a requestoffset is pending
          if (controller.requestOffsetPending) {
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.scrollHandle) {
            data.scrollHandle();
            data.scrollHandle = null;
          }

          const widget = /** @type classes.TableWidgetBase|classes.StretchableScrollGridWidget */ controller.getWidget();
          if (widget) {
            widget.getScrollableArea().off('wheel.NativeScrollUIBehavior');
            widget.getScrollableArea().off('scroll.NativeScrollUIBehavior');
          }
        },

        /**
         * Handle scroll event
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         * @param {Object} event
         * @return {boolean}
         * @private
         */
        _onScroll: function(controller, data, event) {
          const widget = controller.getWidget();
          if (!widget.isEnabled()) {
            return true;
          }
          data.lateEvent = event;
          this.requestOffset(controller, data);
        },

        /**
         * Ask the VM for offset
         * @param {classes.ControllerBase} controller - controller
         * @param {Object} data
         */
        requestOffset: function(controller, data) {
          const node = controller?.getAnchorNode();
          if (!node) {
            return;
          }
          /** 
           * @type {classes.TableWidgetBase|classes.StretchableScrollGridWidget}
           */
          const widget = controller.getWidget();
          if (!widget) {
            return;
          }

          if (data.lateEvent) {
            this._updateScrollData(controller, data);
            data.lateEvent = null;
          }

          const oldOffset = widget.getOffset();
          if (oldOffset !== data.requestedOffset) {

            const app = node.getApplication();
            const offsetChanged = data.requestedOffset !== widget.lastSentOffset;
            // if a request offset already sent to VM, don't send value
            // because the value node will change when VM receive new offset
            // also, do not send value if we are currently processing scroll commands meaning that we may be anticipating values and be desynchronized with VM
            if (!controller.requestOffsetPending && !app.scheduler.hasScrollCommandsToProcess(node)) {
              controller.sendWidgetValue();
            }

            if (app.getFocusedVMNode() === node) {
              widget.setFocus();
            }

            // if requestedOffset is the same as lastSentOffset don't send it again
            if (offsetChanged) {

              controller.requestOffsetPending = true;
              app.scheduler.scrollVMCommand(node, data.requestedOffset);
              widget.setOffset(data.requestedOffset);

              const upScrolling = (oldOffset > data.requestedOffset);
              widget.setScrolling(upScrolling, !upScrolling);

              if (widget.isAnticipateScrollingEnabled()) {
                widget.anticipateScrolling();
              }
              widget.lastSentOffset = data.requestedOffset;
            }
          }

          data.lateEvent = null;
          data.requestedOffset = null;
        },

        /**
         * Update data object with offset info
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         * @private
         */
        _updateScrollData: function(controller, data) {
          let scrollData = data.lateEvent;
          let scrollTop = scrollData.data[0].target.scrollTop;
          let lineHeight = scrollData.data[1] ? scrollData.data[1] : 1; //prevent division by 0

          // get floor of one decimal rounded value
          // means if 0.9 < scrollTop/lineHeight < 1.0 means offset will be 1
          data.requestedOffset = Math.floor(Math.round(scrollTop / lineHeight * 10) / 10);

          let size = controller.getAnchorNode().attribute("size");
          let pageSize = Math.max(controller.getAnchorNode().attribute("pageSize"), 1);

          /** 
           * request offset must not be greater than (size - pageSize), 
           * but also not smaller than 0, else it will create a js crash on IOS
           */
          data.requestedOffset = Math.clamp(data.requestedOffset, 0, Math.abs(size - pageSize));
        }
      };
    });
  });
