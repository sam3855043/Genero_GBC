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

modulum('SplitterWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Splitter widget.
     * @class SplitterWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.SplitterWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.SplitterWidget.prototype */ {
        __name: "SplitterWidget",

        _canHaveSplitter: false,
        _pagePosition: 0,
        _resizerDragPosition: 0,
        _isDragging: false,
        _splitInfo: null,
        _dragHandle: null,
        _forcedDefault: false,
        _selectedSplitter: null,
        /**
         * the split holder
         * @type HTMLElement
         */
        _splitHolder: null,

        _initLayout: function() {
          this._layoutInformation = new cls.LayoutInformation(this);
          this._layoutEngine = new cls.LeafLayoutEngine(this);
          this._layoutEngine._shouldFillHeight = true;
          this._layoutInformation.setMaximal(8, 8);
          this._layoutInformation.setMinimal(8, 8);
          this._layoutInformation.setMeasured(8, 8);
        },

        _initElement: function() {
          $super._initElement.call(this);
          this._dragHandle = this._element.getElementsByClassName("firefox_placekeeper")[0];
          this._element.setAttribute("draggable", "true");
          this._element.on("dragstart.SplitterWidget", this._onDragStart.bind(this));
          this._element.on("dragend.SplitterWidget", this._onDragEnd.bind(this));
          this._element.on("drag.SplitterWidget", this._onDrag.bind(this));

          //handle touch events
          this._element.on("touchstart.SplitterWidget", this._onTouchStart.bind(this));
          this._element.on('touchend.SplitterWidget', this._onTouchEnd.bind(this));
          this._element.on('touchmove.SplitterWidget', this._onTouchMove.bind(this));

          this._splitHolder = document.createElement("div");
          this._splitHolder.className = "gbc_SplitterWidget_splitholder";
        },
        destroy: function() {
          this._element.off("dragstart.SplitterWidget");
          this._element.off("dragend.SplitterWidget");
          this._element.off("drag.SplitterWidget");
          this._selectedSplitter = null;
          $super.destroy.call(this);

        },
        _onDragOver: function(evt) {
          evt.preventCancelableDefault();
        },
        _onDragStart: function(evt) {
          if (this._canHaveSplitter) {
            this._selectedSplitter = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_SplitterWidget");
            this._selectedSplitter.addClass('splitterMoving');
            this._element.parentNode.style.zIndex = 99999;
            this._splitHolder.style.zIndex = 99998;
            this._splitHolder.style.display = "block";
            this.getParentWidget().getElement().on("dragover.SplitterWidget", this._onDragOver.bind(this));
            this._splitHolder.on("dragover.SplitterWidget", this._onDragOver.bind(this));
            this._isDragging = true;
            let image = new Image();
            image.src =
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAQAAAAD+Fb1AAAADklEQVR42mNkgAJG3AwAAH4ABWjFc8IAAAAASUVORK5CYII=';

            if (window.browserInfo.isFirefox) {
              evt.dataTransfer.setData('text', ''); // for Firefox compatibility
              image = this._dragHandle;
            }

            if (evt.dataTransfer.setDragImage) {
              evt.dataTransfer.setDragImage(image, 0, -10000);
            }
            evt.dataTransfer.effectAllowed = "move";
            this._updateResizerDrag(evt);
            this.emit(context.constants.widgetEvents.splitterStart);
          } else {
            evt.preventCancelableDefault();
          }
          return false;
        },
        _updateResizerDrag: function(evt) {

        },
        _onDragEnd: function(evt) {
          this._selectedSplitter.removeClass('splitterMoving');
          this._selectedSplitter = null;
          this._element.style.zIndex = "";
          this._splitHolder.style.zIndex = "";
          this._splitHolder.style.display = "";
          this._splitHolder.off("dragover.SplitterWidget");
          this.getParentWidget().getElement().off("dragover.SplitterWidget");
          this._isDragging = false;
          this.emit(context.constants.widgetEvents.splitterEnd);
        },
        _onDrag: function(evt) {
          if (this._isDragging) {
            const delta = this._pagePosition - this._resizerDragPosition;
            this.updateSplits(delta);
          }
        },

        _onTouchStart: function(evt) {
          if (this._canHaveSplitter) {
            if (!this._selectedSplitter) {
              this._selectedSplitter = gbc.WidgetService.getWidgetFromElement(evt.target, "gbc_SplitterWidget");
              this._selectedSplitter.addClass('splitterMoving');
            }
            this._element.parentNode.style.zIndex = 99999;
            this._splitHolder.style.zIndex = 99998;
            this._splitHolder.style.display = "block";
            this._isDragging = true;
            this._updateResizerDrag(evt);
            this.emit(context.constants.widgetEvents.splitterStart);
          } else {
            evt.preventCancelableDefault();
          }
          return false;
        },

        _onTouchEnd: function() {
          if (this._selectedSplitter) {
            this._selectedSplitter.removeClass('splitterMoving');
            this._selectedSplitter = null;
          }
          this._element.style.zIndex = "";
          this._splitHolder.style.zIndex = "";
          this._splitHolder.style.display = "";
          this._isDragging = false;
          this.emit(context.constants.widgetEvents.splitterEnd);
        },

        _onTouchMove: function(evt) {
          if (this._isDragging) {
            const delta = this._pagePosition - this._splitStartPos;
            this.updateSplits(delta);
          }
        },

        _setDOMAttachedOrDetached: function() {
          if (this._element.parentNode) {
            this._element.parentNode.parentNode.appendChild(this._splitHolder);
          } else {
            this._splitHolder.remove();
          }
        },
        activateSplitter: function(canSplit) {
          this._canHaveSplitter = Boolean(canSplit);
          this._element.toggleClass("canSplit", Boolean(canSplit));
        },
        isReversed: function() {
          return this._parentWidget.isReversed();
        },
        updateSplits: function(delta) {
          if (!Number.isNaN(delta)) {
            this.emit(context.constants.widgetEvents.splitter, delta);
          }
        }
      };
    });
    cls.WidgetFactory.registerBuilder('Splitter', cls.SplitterWidget);
  });
