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

modulum('ScrollUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class ScrollUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.ScrollUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.ScrollUIBehavior.prototype */ {
        __name: "ScrollUIBehavior",

        _throttleTimeout: 180,

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          controller.requestOffsetPending = false;
          const widget = controller.getWidget();
          if (widget) {
            data.scrollHandle = widget.when(context.constants.widgetEvents.scroll, this._onScroll.bind(this, controller, data));
            data.mouseWheelHandle = widget.when(context.constants.widgetEvents.mouseWheel, this._onMousewheel.bind(this, controller, data));
            data.touchMoveHandle = widget.when(context.constants.widgetEvents.touchMove, this._onTouchMove.bind(this, controller, data));
            data.touchStartHandle = widget.when(context.constants.widgetEvents.touchStart, this._onTouchStart.bind(this, controller, data));
          }
          data.requestedOffset = null;
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.throttleScroll) {
            window.clearTimeout(data.throttleScroll);
            data.throttleScroll = null;
          }

          if (data.scrollHandle) {
            data.scrollHandle();
            data.scrollHandle = null;
          }
          if (data.mouseWheelHandle) {
            data.mouseWheelHandle();
            data.mouseWheelHandle = null;
          }
          if (data.touchMoveHandle) {
            data.touchMoveHandle();
            data.touchMoveHandle = null;
          }
          if (data.touchStartHandle) {
            data.touchStartHandle();
            data.touchStartHandle = null;
          }
          if (data.touchEndHandle) {
            data.touchEndHandle();
            data.touchEndHandle = null;
          }
        },

        /**
         * Handle scroll event
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         * @param {Object} e
         * @return {boolean}
         * @private
         */
        _onScroll: function(controller, data, e) {
          const widget = controller.getWidget();
          if (!widget.isEnabled()) {
            return true;
          } else {
            data.lateEvent = e;
            this._updateScrollData(controller, data);
            this._postRequest(controller, data);
          }
        },

        /**
         * Update data object with offset info
         * @param {classes.ControllerBase} controller
         * @param {Object} data
         * @private
         */
        _updateScrollData: function(controller, data) {
          const scrollData = data.lateEvent;
          const forceOffset = scrollData.data[0].forceOffset; // case of scrollbar widget
          if (forceOffset) {
            data.requestedOffset = forceOffset;
          } else {
            const scrollTop = scrollData.data[0].target.scrollTop;
            const lineHeight = scrollData.data[1] ? scrollData.data[1] : 1; //prevent division by 0
            data.requestedOffset = Math.round(scrollTop / lineHeight);

            const size = controller.getAnchorNode().attribute("size");
            const pageSize = Math.max(controller.getAnchorNode().attribute("pageSize"), 1);
            // request offset must not be greater than (size - pageSize)
            data.requestedOffset = Math.min(data.requestedOffset, Math.abs(size - pageSize));
          }
        },

        /**
         *
         * @param controller
         * @param data
         * @param e
         * @return {boolean}
         * @private
         */
        _onMousewheel: function(controller, data, e) {
          const widget = controller.getWidget();
          const event = e.data[0];
          if (!widget.isEnabled()) {
            event.stopImmediatePropagation();
            return false;
          } else {
            //event.preventCancelableDefault(); // Not allowed since passive:true
            //throttle events...
            if (data.requestedOffset === null) {
              data.requestedOffset = controller.getAnchorNode().attribute("offset");
            }
            const original = data.requestedOffset;
            const delta = (window.browserInfo.isFirefox ? (53 / 3) : 1) * event.deltaY;

            const size = controller.getAnchorNode().attribute("size");
            const pageSize = Math.max(controller.getAnchorNode().attribute("pageSize"), 1);

            data.requestedOffset += Math.round(delta / 16);
            data.requestedOffset = Math.max(0, Math.min(data.requestedOffset, size - pageSize));

            if (original !== data.requestedOffset) {
              this._postRequest(controller, data);
            }
          }
        },

        /**
         *
         * @param controller
         * @param data
         * @param e
         * @return {boolean}
         * @private
         */
        _onTouchMove: function(controller, data, e) {
          // Don't do anything if the VM offset order is pending
          if (!controller.requestOffsetPending) {
            const widget = controller.getWidget();
            const event = e.data[0];
            if (!widget.isEnabled()) {
              event.stopImmediatePropagation();
              return false;
            } else {
              //throttle events...
              if (data.requestedOffset === null) {
                data.requestedOffset = controller.getAnchorNode().attribute("offset");
              }
              const original = data.requestedOffset;

              if (this._initialTouchPos && event.touches[0]) {
                const deltaY = event.touches[0].clientY;
                const deltaX = event.touches[0].clientX;

                // If scrolling verticaly : continue, horizontaly: do nothing
                if (Math.abs(this._initialTouchPos.x - deltaX) < Math.abs(this._initialTouchPos.y - deltaY)) {
                  let delta = (window.browserInfo.isFirefox ? (53 / 3) : 1) * deltaY;

                  const size = controller.getAnchorNode().attribute("size");
                  const pageSize = Math.max(controller.getAnchorNode().attribute("pageSize"), 1);

                  const move = this._initialTouchPos.y - delta;
                  delta = Math.sign(move) * delta / 8;

                  data.requestedOffset += Math.round(delta / 16);
                  data.requestedOffset = Math.max(0, Math.min(data.requestedOffset, size - pageSize));

                  if (original !== data.requestedOffset) {
                    this._postRequest(controller, data);
                  }
                }
              }
            }
          }
        },

        /**
         *
         * @param controller
         * @param data
         * @param e
         * @private
         */
        _onTouchStart: function(controller, data, e) {
          const event = e.data[0];
          this._initialTouchPos = {
            x: event.touches[0] ? event.touches[0].clientX : 0,
            y: event.touches[0] ? event.touches[0].clientY : 0
          };
        },

        /**
         *
         * @param controller
         * @param data
         * @private
         */
        _postRequest: function(controller, data) {
          if (!data.throttleScroll) {
            data.throttleScroll = window.setTimeout(function(controller, data) {
              this.requestOffset(controller, data);
            }.bind(this, controller, data), this._throttleTimeout);
          }
          return this;
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
          const widget = controller.getWidget();
          if (!widget) {
            return;
          }

          // before requestOffset (clear current throttle timeout)
          window.clearTimeout(data.throttleScroll);
          data.throttleScroll = null;

          if (data.lateEvent) {
            this._updateScrollData(controller, data);
            data.lateEvent = null;
          }

          const oldOffset = node.attribute("offset");
          if (oldOffset !== data.requestedOffset) {
            const app = node.getApplication();

            // if a request offset already sent to VM, don't send value
            // because the value node will change when VM receive new offset
            if (!controller.requestOffsetPending) {
              controller.sendWidgetValue();
            }
            if (app.getFocusedVMNode() === node) {
              widget.setFocus();
            }

            controller.requestOffsetPending = true;
            app.scheduler.scrollVMCommand(node, data.requestedOffset);
            widget.setOffset(data.requestedOffset);
            widget.lastSentOffset = data.requestedOffset;
          }

          data.lateEvent = null;
          data.requestedOffset = null;
        },
      };
    });
  });
