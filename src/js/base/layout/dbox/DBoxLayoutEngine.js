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

modulum('DBoxLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {
    /**
     * Base laxout engine clarr for HBoxLayoutEngine and VBoxLayoutEngine
     * @class DBoxLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.DBoxLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.DBoxLayoutEngine.prototype */ {
        __name: "DBoxLayoutEngine",
        /**
         * main measure size getter name
         * @type {?string}
         * @protected
         */
        _mainSizeGetter: null,
        /**
         * main measure size setter name
         * @type {?string}
         * @protected
         */
        _mainSizeSetter: null,
        /**
         * main has measure size getter name
         * @type {?string}
         * @protected
         */
        _mainHasSizeGetter: null,
        /**
         * main stretch info getter name
         * @type {?string}
         * @protected
         */
        _mainStretch: null,
        /**
         * opposite measure size getter name
         * @type {?string}
         * @protected
         */
        _oppositeSizeGetter: null,
        /**
         * opposite measure size setter name
         * @type {?string}
         * @protected
         */
        _oppositeSizeSetter: null,
        /**
         * opposite has measure size getter name
         * @type {?string}
         * @protected
         */
        _oppositeHasSizeGetter: null,
        /**
         * opposite stretch info getter name
         * @type {?string}
         * @protected
         */
        _oppositeStretch: null,
        /**
         * calculated split hints
         * @type {Array<number>}
         */
        _splitHints: null,
        /**
         * reference split hints
         * @type {Array<number>}
         * @protected
         */
        _referenceSplitHints: null,
        /**
         * currenty splitter index
         * @type {?number}
         * @protected
         */
        _currentlySplitting: -1,
        /**
         * Flag indicating whether it contains spacers or not
         * @type {boolean}
         * @protected
         */
        _hasSpacer: false,
        /**
         * registered children widgets
         * @type {classes.WidgetBase[]}
         * @protected
         */
        _registeredWidgets: null,
        /**
         * stylesheet id
         * @protected
         */
        _styleSheetId: null,

        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._styleSheetId = "boxLayout_" + widget.getUniqueIdentifier();
          this._splitHints = [];
          this._registeredWidgets = [];
          this._referenceSplitHints = [];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          for (let i = this._registeredWidgets.length - 1; i > -1; i--) {
            const wi = this._registeredWidgets[i];
            wi.destroy();
            this.unregisterChild(wi);
          }
          this._splitHints = null;
          this._registeredWidgets.length = 0;
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        reset: function(recursive) {
          $super.reset.call(this, recursive);
          this._setSplitHints(this._getReferenceSplitHints().slice());
        },

        /**
         * Initialize split Hints
         * @param {Array?} initial - if given, use this array as reference
         */
        initSplitHints: function(initial) {
          this._setReferenceSplitHints((initial || []).map(function(item) {
            return isNaN(item) ? 0 : item;
          }));
        },

        /**
         * Handle Splitting - start (on drag start)
         * @param {Number} splitterIndex - index of splitter to handle
         */
        startSplitting: function(splitterIndex) {
          this._currentlySplitting = splitterIndex;
          this._setReferenceSplitHints([]);
          for (let i = 0; i < this._registeredWidgets.length; i++) {
            const widget = this._registeredWidgets[i];
            if (!(widget instanceof cls.SplitterWidget)) {
              const idx = i / 2;
              this._setReferenceSplitHints(idx, Math.round(this._getAvailableSize(widget, true)));
            }
          }
          this._setSplitHints(this._getReferenceSplitHints().slice());
        },

        /**
         * Handle Splitting - stop (on drag end)
         */
        stopSplitting: function() {
          this._setReferenceSplitHints(this._getSplitHints());
          this._currentlySplitting = -1;
        },

        /**
         * Handler while moving splitter
         * @param {Number} delta - moving delta
         */
        splitting: function(delta) {
          const widget1 = this._registeredWidgets[this._currentlySplitting * 2],
            widget2 = this._registeredWidgets[(this._currentlySplitting + 1) * 2],
            min1 = this._getMinimalSize(widget1, true) || 1,
            min2 = this._getMinimalSize(widget2, true) || 1,
            splitIndex = this._currentlySplitting,
            splitNextIndex = this._currentlySplitting + 1;

          for (let i = 0; i < this._registeredWidgets.length; i++) {
            const widget = this._registeredWidgets[i];
            if (!(widget instanceof cls.SplitterWidget)) {
              const idx = i / 2;
              this._setSplitHints(idx, this._getReferenceSplitHints(idx));
            }
          }
          let extra = 0;
          const size1 = this._getSplitHints(splitIndex),
            size2 = this._getSplitHints(splitNextIndex);
          if ((size1 + delta) < min1) {
            extra = delta;
            delta = min1 - size1;
            extra -= delta;
          }
          if ((size2 - delta) < min2) {
            extra = delta;
            delta = size2 - min2;
            extra -= delta;
          }

          // Add delta to currentSplitting
          this._setSplitHints(splitIndex, this._getSplitHints(splitIndex) + delta);
          // Remove delta to next splitHint
          this._setSplitHints(splitNextIndex, this._getSplitHints(splitNextIndex) - delta);

          if (extra) {
            let currentIndex, currentMin, currentSize, canReduce;
            if (extra < 0) {
              currentIndex = splitIndex - 1;
              while (extra && (currentIndex >= 0)) {
                currentMin = this._getMinimalSize(this._registeredWidgets[currentIndex * 2], true) || 1;
                currentSize = this._getSplitHints(currentIndex);
                canReduce = currentSize - currentMin;
                if (canReduce > 0) {
                  if (-extra < canReduce) {
                    // Add extra to currentSplitting
                    this._setSplitHints(currentIndex, this._getSplitHints(currentIndex) + extra);
                    // Remove extra to next splitHint
                    this._setSplitHints(splitNextIndex, this._getSplitHints(splitNextIndex) - extra);
                    extra = 0;
                  } else {
                    extra += canReduce;
                    // Add canReduce to currentSplitting
                    this._setSplitHints(currentIndex, this._getSplitHints(currentIndex) - canReduce);
                    // Remove canReduce to next splitHint
                    this._setSplitHints(splitNextIndex, this._getSplitHints(splitNextIndex) + canReduce);
                  }
                }
                currentIndex--;
              }
            } else {
              currentIndex = splitIndex + 2;
              while (extra && (currentIndex < this._getSplitHints().length)) {
                currentMin = this._getMinimalSize(this._registeredWidgets[currentIndex * 2], true) || 1;
                currentSize = this._getSplitHints(currentIndex);
                canReduce = currentSize - currentMin;
                if (canReduce > 0) {
                  if (extra < canReduce) {
                    // Add extra to currentSplitting
                    this._setSplitHints(currentIndex, this._getSplitHints(currentIndex) - extra);
                    // Remove extra to next splitHint
                    this._setSplitHints(splitIndex, this._getSplitHints(splitIndex) + extra);
                    extra = 0;
                  } else {
                    extra -= canReduce;
                    // Add canReduce to currentSplitting
                    this._setSplitHints(currentIndex, this._getSplitHints(currentIndex) - canReduce);
                    // Remove canReduce to next splitHint
                    this._setSplitHints(splitIndex, this._getSplitHints(splitIndex) + canReduce);
                  }
                }
                currentIndex++;
              }
            }
          }
        },

        /**
         * @inheritDoc
         * @param {classes.WidgetBase} widget child widget
         * @param {number} position the wanted position
         */
        registerChild: function(widget, position) {
          if (this._registeredWidgets.indexOf(widget) < 0) {
            this._registeredWidgets.splice(position, 0, widget);
          }
        },

        /**
         * @inheritDoc
         */
        unregisterChild: function(widget) {
          this._registeredWidgets.remove(widget);
        },

        /**
         * @inheritDoc
         */
        prepareAdjustments: function() {
          const widgets = this._registeredWidgets;
          let lastSplitterVisible = null;
          for (let j = 0; j <= widgets.length - 1; j += 2) {
            const widget = widgets[j];
            const widget2 = widgets[j + 2];
            const isSpacer1 = widget instanceof cls.SpacerItemWidget;
            const isSpacer2 = !widget2 || widget2 instanceof cls.SpacerItemWidget;
            if (widget.isVisible()) {
              lastSplitterVisible = widgets[j + 1];
              if (lastSplitterVisible) {
                lastSplitterVisible.setHidden(isSpacer1 || isSpacer2);
              }
            } else {
              // if last widget no splitter to hide, but we may have to hide previous visible splitter
              if (j === widgets.length - 1) {
                if (lastSplitterVisible) {
                  lastSplitterVisible.setHidden(true);
                  lastSplitterVisible = null;
                }
              } else {
                widgets[j + 1].setHidden(true);
              }
            }
          }
        },

        /**
         * @inheritDoc
         */
        adjustMeasure: function() {
          const widgets = this._registeredWidgets;
          this._hasSpacer = false;
          this._getLayoutInfo().setPreferred(0, 0);
          const layoutInfo = this._getLayoutInfo();
          let position = 0,
            minimal = 0,
            minOppositeSize = 0,
            oppositeSize = 0,
            maxSize = 0,
            maxOppositeSize = 0;
          for (const element of widgets) {
            const widget = element;
            if (!widget.isVisible()) {
              continue;
            }
            const hasMaxSize = this._hasMaximalSize(widget),
              hasOppositeMaxSize = this._hasOppositeMaximalSize(widget),
              isSpacer = widget instanceof cls.SpacerItemWidget;
            if (isSpacer) {
              this._hasSpacer = true;
            }

            if (hasMaxSize || isSpacer) {
              maxSize += this._getMaximalSize(widget, true);
            } else {
              maxSize = cls.Size.maximal;
              this._setPreferredSize(this._widget,
                this._getPreferredSize(this._widget, true) +
                this._getPreferredSize(widget, true)
              );
            }
            if (hasOppositeMaxSize) {
              if (maxOppositeSize !== cls.Size.maximal) {
                maxOppositeSize = Math.max(maxOppositeSize, this._getOppositeMaximalSize(widget, true));
              }
            } else {
              maxOppositeSize = cls.Size.maximal;
            }
            const size = this._getMeasuredSize(widget, true),
              minimalSize = this._getMinimalSize(widget, true),
              opposite = this._getOppositeMeasuredSize(widget, true),
              minOpposite = this._getOppositeMinimalSize(widget, true);
            oppositeSize = Math.max(oppositeSize, opposite);
            minOppositeSize = Math.max(minOppositeSize, minOpposite);
            position += Math.max(minimalSize, size);
            minimal += minimalSize;
          }
          this._applyMeasure(position, oppositeSize);
          layoutInfo.getMinimal()[this._mainSizeSetter](minimal);
          layoutInfo.getMinimal()[this._oppositeSizeSetter](minOppositeSize);

          this._setMaximalSize(this._widget, maxSize);
          this._setOppositeMaximalSize(this._widget, maxOppositeSize);
        },

        /**
         * @inheritDoc
         */
        adjustStretchability: function() {
          const layoutInfo = this._getLayoutInfo();
          let oppositeStretch = 0;
          for (const element of this._registeredWidgets) {
            const widget = element,
              widgetInfo = widget.getLayoutInformation();
            if (!widget.isVisible()) {
              continue;
            }
            const hasOppositeMaxSize = this._hasOppositeMaximalSize(widget);
            if (widgetInfo.isXStretched() || widgetInfo.isChildrenXStretched()) {
              layoutInfo.addChildrenStretchX(widgetInfo);
            }
            if (widgetInfo.isYStretched() || widgetInfo.isChildrenYStretched()) {
              layoutInfo.addChildrenStretchY(widgetInfo);
            }

            if (!hasOppositeMaxSize) {
              if (oppositeStretch < this._getOppositePreferredSize(widget)) {
                oppositeStretch = this._getOppositePreferredSize(widget);
              }
            }
          }

          if (this._getOppositeMaximalSize() === cls.Size.maximal && oppositeStretch === 0) {
            oppositeStretch = 1;
          }
          if (oppositeStretch > 0) {
            this._setOppositePreferredSize(this._widget, oppositeStretch);
          }

        },

        _prepareApplyWhenSplitting: function(widgets) {
          for (const element of widgets) {
            const widget = element;
            if (widget.isVisible()) {
              if (!(widget instanceof cls.SplitterWidget)) {
                this._setAvailableSize(widget, this._getSplitHints(this._widget.getIndexOfChild(widget)));
              }
            }
          }
        },

        _prepareApplyWithStretch: function(widgets) {
          let availableSize = this._getAvailableSize(),
            initialFullRatio = 0,
            fullRatio = 0,
            initialStretched = 0,
            stretched = 0;
          const ratios = new Map();
          let i, widget, preferred, msize;

          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              this._setOppositeAvailableSize(widget, this._getOppositeAvailableSize());
              msize = this._getMinimalSize(widget, true);
              preferred = this._getPreferredSize(widget, true);
              if (this._isStretched(widget) && !widget.isInstanceOf(cls.SplitterWidget)) {
                ratios.set(widget, {
                  widget: widget,
                  preferred: preferred,
                  minimal: msize
                });
                initialFullRatio += preferred;
                fullRatio += preferred;
                initialStretched++;
                stretched++;
              } else {
                // if not stretchable, apply minimal size
                this._setAvailableSize(widget, msize);
                availableSize -= msize;
              }
            }
          }
          let sizableCount = 0;
          const reducer = function(ratio, widget, map) {
            ratio.part = initialFullRatio ? (ratio.preferred || 0) / initialFullRatio : initialStretched ? (1 /
                initialStretched) :
              0;
            ratio.initialDistribution = availableSize * ratio.part;
            if (ratio.initialDistribution <= ratio.minimal) {
              this._setAvailableSize(widget, ratio.minimal);
              availableSize -= ratio.minimal;
              fullRatio -= ratio.preferred;
              stretched--;
              map.delete(widget);
            } else {
              sizableCount++;
            }
          }.bind(this);

          // seeking all stretchables that should strecch smaller than their minimal size
          while (ratios.size !== sizableCount) {
            sizableCount = 0;
            ratios.forEach(reducer);
            initialFullRatio = fullRatio;
            initialStretched = stretched;
          }

          ratios.forEach(function(ratio, widget, map) {
            const part = fullRatio ? (ratio.preferred || 0) / fullRatio : stretched ? (1 / stretched) : 0;
            this._setAvailableSize(widget, availableSize * part);
            map.delete(widget);
          }.bind(this));
        },

        _prepareApplyWithoutStretch: function(widgets) {
          let i;
          const items = [],
            distributedSize = {};
          let available = this._getAvailableSize(),
            accumulated = 0,
            currentLevel = 0,
            distibutableLevel = -1;
          let widgetMeasured = 0;

          // loop on each child of the hbox/vbox and add them in list if they aren't splitter and visible
          for (const w of widgets) {
            if (!w.isHidden()) {
              if ((this._hasSpacer && (w instanceof cls.SpacerItemWidget)) ||
                (!this._hasSpacer && !(w instanceof cls.SplitterWidget))) {
                if (this._widget
                  .isPacked()
                ) { // if packed, we only add the last child in the list, ignore other to not count them in the distribution model
                  if (widgets.last() === w) {
                    items.push(w);
                  } else {
                    // subtract widget size from remaining available size to distribute later on
                    widgetMeasured = this._getMeasuredSize(w, true);
                    available -= widgetMeasured;
                    // set widget measured size as available size to let splitter works properly on need
                    this._setAvailableSize(w, widgetMeasured);
                  }
                } else { // if not packed, add all child in distribution model
                  items.push(w);
                }
              } else { // subtract splitter size from remaining available size to distribute later on
                available -= this._getMeasuredSize(w, true);
              }
            }
          }

          const count = items.length;

          // sort child widget by minimal size (TODO explain why)
          items.sort(this._sortItems.bind(this));

          // while we have remaining available size to distribute
          while (distibutableLevel === -1 && currentLevel < count) {
            const minimalCurrent = this._getMinimalSize(items[currentLevel], true);
            if (available >= (accumulated + minimalCurrent * (count - currentLevel))) {
              distibutableLevel = currentLevel;
            } else {
              accumulated += minimalCurrent;
              distributedSize[items[currentLevel].getUniqueIdentifier()] = minimalCurrent;
              currentLevel++;
            }
          }
          if (distibutableLevel >= 0) {
            // divide remaining available size by number of child widgets and save this bonus size to allocate to the distributedSize list
            const distributablePart = (available - accumulated) / (count - distibutableLevel);
            for (i = distibutableLevel; i < count; i++) {
              distributedSize[items[i].getUniqueIdentifier()] = distributablePart;
            }
          }
          // loop on all child widgets (splitter included)
          for (i = 0; i < widgets.length; i++) {
            const widget = widgets[i];
            if (widget.isVisible()) {
              // set bonus available size to the widget
              if (distributedSize.hasOwnProperty(widget.getUniqueIdentifier())) {
                this._setAvailableSize(widget, distributedSize[widget.getUniqueIdentifier()]);
              }
              this._setOppositeAvailableSize(widget, this._getOppositeAvailableSize());
            } else {
              this._setAvailableSize(widget, 0);
              this._setOppositeAvailableSize(widget, 0);
            }
          }
        },

        /**
         * Get hints
         * @param {Number?} idx - index of the split part to get
         * @return {*} either a specific splitHints if idx given, or all Array
         * @private
         */
        _getSplitHints(idx) {
          if (typeof idx === "undefined") {
            return this._splitHints;
          } else {
            return this._splitHints[idx];
          }
        },

        /**
         * Set hints
         * @param {Number?} idx - index of the split part to get
         * @param {*} value - either an array or a specific value
         * @private
         */
        _setSplitHints(idx, value) {
          if (typeof value === "undefined") {
            this._splitHints = idx;
          } else {
            this._splitHints[idx] = value;
          }
        },

        /**
         * Get reference hints
         * @param {Number?} idx - index of the split part to get
         * @return {*} either a specific refSplitHints if idx given, or all Array
         * @private
         */
        _getReferenceSplitHints(idx) {
          if (typeof idx === "undefined") {
            return this._referenceSplitHints;
          } else {
            return this._referenceSplitHints[idx];
          }
        },

        /**
         * Set reference hints
         * @param {Number?} idx - index of the split part to get
         * @param {*} value - either an array or a specific value
         * @private
         */
        _setReferenceSplitHints(idx, value) {
          if (typeof value === "undefined") {
            this._referenceSplitHints = idx;
          } else {
            this._referenceSplitHints[idx] = value;
          }
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          const widgets = this._registeredWidgets;
          let i, widget, wSize, oppositeWSize,
            position = 0,
            reallyAllocatedSpace = 0,
            stretchablesOnNeed = 0,
            extraSpace = 0;
          if (this._currentlySplitting >= 0) {
            // user is currently splitting
            this._prepareApplyWhenSplitting(widgets);
          } else if ( // box has been previously split, keep ratios
            this._getReferenceSplitHints().length &&
            (this._getReferenceSplitHints().length === ((widgets.length + 1) / 2))) {
            this._redistributeSplittedSpace(widgets);
          } else if (this._isStretched(this._widget)) {
            // some elements are stretchable
            this._prepareApplyWithStretch(widgets);
          } else {
            // no elements are stretchable
            // calculate remaining not allocated available space and add it evenly between each child (if 4ST packed = false)
            this._prepareApplyWithoutStretch(widgets);
          }

          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              wSize = Math.max(this._getAvailableSize(widget, true), this._getMinimalSize(widget, true));
              reallyAllocatedSpace += wSize;
              if (!wSize) {
                stretchablesOnNeed++;
              }
            }
          }
          if (stretchablesOnNeed) {
            extraSpace =
              Math.max((Math.max(this._getAvailableSize(null, true), this._getMinimalSize(null, true)) - reallyAllocatedSpace) /
                stretchablesOnNeed, 0); // ignore negative values (may occur if available size < measured one)
          }
          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              wSize = Math.max(this._getAvailableSize(widget, true), this._getMinimalSize(widget, true));
              if (!wSize) {
                wSize = extraSpace;
              }
              this._setAllocatedSize(widget, wSize);
              oppositeWSize = this._getOppositeAvailableSize();
              if (!this._getOppositeStretched() || this._getLayoutInfo().willOverflowContainerIfNeeded()) {
                oppositeWSize = Math.max(oppositeWSize, this._getOppositeMinimalSize());
              }
              this._setOppositeAllocatedSize(widget, oppositeWSize);
              this._setOppositeAvailableSize(widget, oppositeWSize);
              this._setItemClass(i, position, wSize);
              position += wSize;
            } else {
              this._setOppositeAllocatedSize(widget, 0);
              this._setOppositeAvailableSize(widget, 0);
              this._setItemClass(i, position, 0);
            }
          }

          const width = Math.max(this._getLayoutInfo().getAvailable().getWidth(true), this._getLayoutInfo().getMinimal().getWidth(
            true));
          const height = Math.max(this._getLayoutInfo().getAvailable().getHeight(true), this._getLayoutInfo().getMinimal().getHeight(
            true));
          this._getLayoutInfo().setAllocated(width, height);

          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              this._setItemOppositeClass(i);
              this._setOppositeAllocatedSize(widget, this._getOppositeAllocatedSize());
            } else {
              this._setItemOppositeClass(i);
              this._setOppositeAllocatedSize(widget, 0);
            }
          }
          this._styleRules[".g_measured #w_" + this._widget.getUniqueIdentifier() + ".g_measureable"] = {
            width: this._getLayoutInfo().getAllocated().getWidth() + "px",
            height: this._getLayoutInfo().getAllocated().getHeight() + "px"
          };
        },

        _redistributeSplittedSpace: function(widgets) {
          let i, widget, total = this._getAvailableSize(),
            totalSplitters = 0;
          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              if (widget instanceof cls.SplitterWidget) {
                const s = this._getMeasuredSize(widget);
                total -= s;
                totalSplitters += s;
              }
            }
          }
          if (this._getMinimalSize() < (total + totalSplitters)) {
            const sum = this._getReferenceSplitHints().reduce(function(acc, b, idx) {
              if (idx === 1 && !widgets[0].isVisible()) {
                acc = 0;
              }
              if (!widgets[idx * 2].isVisible()) {
                b = 0;
              }
              return acc + b;
            }.bind(this));
            let availableWeight = sum;
            const ratioed = this._getReferenceSplitHints().map(function(a, idx) {
              const relative = total * a / sum,
                min = this._getMinimalSize(widgets[idx * 2]),
                delta = relative - min;
              return {
                weight: a,
                min: min,
                size: min,
                relative: relative,
                delta: delta,
                index: idx
              };
            }, this).sort(function(a, b) {
              return a.delta < b.delta ? -1 : a.delta > b.delta ? 1 : 0;
            });
            let pos = 0,
              debt = 0;
            while (pos < ratioed.length) {
              if (ratioed[pos].delta < 0) {
                debt -= ratioed[pos].delta;
                availableWeight -= ratioed[pos].weight;
                pos++;
              } else {
                const weightDebt = debt * ratioed[pos].weight / availableWeight;
                if (weightDebt > ratioed[pos].delta) {
                  ratioed[pos].delta -= weightDebt;
                  debt -= weightDebt;
                } else {
                  debt -= weightDebt;
                  ratioed[pos].delta -= weightDebt;
                  ratioed[pos].size = ratioed[pos].min + ratioed[pos].delta;
                  availableWeight -= ratioed[pos].weight;
                  pos++;
                }
              }
            }
            for (i = 0; i < ratioed.length; i++) {
              widget = widgets[ratioed[i].index * 2];
              if (widget.isVisible()) {
                if (!(widget instanceof cls.SplitterWidget)) {
                  this._setAvailableSize(widget, ratioed[i].size);
                }
              }
            }
          } else {
            for (i = 0; i < widgets.length; i++) {
              widget = widgets[i];
              if (widget.isVisible()) {
                if (!(widget instanceof cls.SplitterWidget)) {
                  this._setAvailableSize(widget, this._getMinimalSize(widget));
                }
              }
            }
          }
          for (i = 0; i < widgets.length; i++) {
            widget = widgets[i];
            if (widget.isVisible()) {
              this._setOppositeAvailableSize(widget, this._getOppositeAvailableSize());
            }
          }
        },
        /**
         * @inheritDoc
         */
        applyLayout: function() {
          context.styler.appendStyleSheet(this._styleRules, this._styleSheetId, true,
            this.getLayoutSheetId());
        },

        /**
         * get main hint size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getPreferredSize: function(widget, useFallback) {
          const idx = this._widget.getIndexOfChild(widget);
          if (idx >= 0 && this._getSplitHints(idx)) {
            return this._getSplitHints(idx);
          }
          return this._getLayoutInfo(widget).getPreferred()[this._mainSizeGetter](useFallback);
        },
        /**
         * get opposite hint size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositePreferredSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getPreferred()[this._oppositeSizeGetter](useFallback);
        },

        _setPreferredSize: function(widget, size) {
          return this._getLayoutInfo(widget).getPreferred()[this._mainSizeSetter](size);
        },

        _setOppositePreferredSize: function(widget, size) {
          return this._getLayoutInfo(widget).getPreferred()[this._oppositeSizeSetter](size);
        },

        /**
         * get main allocated size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getAllocatedSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getAllocated()[this._mainSizeGetter](useFallback);

        },

        /**
         * set main allocated size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setAllocatedSize: function(widget, size) {
          return this._getLayoutInfo(widget).getAllocated()[this._mainSizeSetter](size);
        },
        /**
         * set main maximal size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setMaximalSize: function(widget, size) {
          return this._getLayoutInfo(widget).getMaximal()[this._mainSizeSetter](size);
        },
        /**
         * set opposite maximal size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setOppositeMaximalSize: function(widget, size) {
          return this._getLayoutInfo(widget).getMaximal()[this._oppositeSizeSetter](size);
        },
        /**
         * get main measured size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getMeasuredSize: function(widget, useFallback) {
          if (!(widget instanceof cls.SplitterWidget)) {
            const idx = this._widget.getIndexOfChild(widget);
            if (idx >= 0 && this._getSplitHints(idx)) {
              return this._getSplitHints(idx);
            }
          }
          return this._getLayoutInfo(widget).getMeasured()[this._mainSizeGetter](useFallback);
        },
        /**
         * get opposite measured size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositeMeasuredSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getMeasured()[this._oppositeSizeGetter](Boolean(useFallback));
        },
        /**
         * get main minimal size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getMinimalSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getMinimal()[this._mainSizeGetter](Boolean(useFallback));
        },
        /**
         * get opposite minimal size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositeMinimalSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getMinimal()[this._oppositeSizeGetter](Boolean(useFallback));
        },
        /**
         * get main maximal size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getMaximalSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getMaximal()[this._mainSizeGetter](useFallback);
        },
        /**
         * get opposite maximal size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositeMaximalSize: function(widget, useFallback) {
          return this._getLayoutInfo(widget).getMaximal()[this._oppositeSizeGetter](useFallback);
        },
        /**
         * test if given widget or owner if none has main maximal size
         * @param {classes.WidgetBase} [widget] the widget
         * @returns {number} the size
         * @protected
         */
        _hasMaximalSize: function(widget) {
          return this._getLayoutInfo(widget).getMaximal()[this._mainHasSizeGetter](true);
        },
        /**
         * test if given widget or owner if none has opposite maximal size
         * @param {classes.WidgetBase} [widget] the widget
         * @returns {number} the size
         * @protected
         */
        _hasOppositeMaximalSize: function(widget) {
          return this._getLayoutInfo(widget).getMaximal()[this._oppositeHasSizeGetter](true);
        },
        /**
         * get main available size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getAvailableSize: function(widget, useFallback) {
          const availableSize = this._getLayoutInfo(widget).getAvailable();
          return availableSize[this._mainSizeGetter](useFallback);
        },
        /**
         * set main available size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setAvailableSize: function(widget, size) {
          const availableSize = this._getLayoutInfo(widget).getAvailable();
          availableSize[this._mainSizeSetter](size);
        },
        /**
         * get opposite available size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositeAvailableSize: function(widget, useFallback) {
          const availableSize = this._getLayoutInfo(widget).getAvailable();
          return availableSize[this._oppositeSizeGetter](useFallback);
        },
        /**
         * set opposite available size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setOppositeAvailableSize: function(widget, size) {
          const availableSize = this._getLayoutInfo(widget).getAvailable();
          availableSize[this._oppositeSizeSetter](size);
        },
        /**
         * get opposite allocated size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @param {boolean} [useFallback] true to get fallback value if needed
         * @returns {number} the size
         * @protected
         */
        _getOppositeAllocatedSize: function(widget, useFallback) {
          const allocatedSize = this._getLayoutInfo(widget).getAllocated();
          return allocatedSize[this._oppositeSizeGetter](useFallback);
        },
        /**
         * set opposite allocated size of given widget or owner if none
         * @param {classes.WidgetBase} widget the widget
         * @param {number} size the size
         * @protected
         */
        _setOppositeAllocatedSize: function(widget, size) {
          const allocatedSize = this._getLayoutInfo(widget).getAllocated();
          allocatedSize[this._oppositeSizeSetter](size);
        },
        /**
         * set item css rules for main size
         * @param {number} position child widget position in children list
         * @param {number} start render start position
         * @param {number} size render size
         * @protected
         */
        _setItemClass: function(position, start, size) {

        },
        /**
         * set item css rules for opposite size
         * @param {number} position child widget position in children list
         * @protected
         */
        _setItemOppositeClass: function(position) {

        },
        /**
         * apply css rules
         * @param {number} mainSize owner main size
         * @param {number} oppositeSize owner opposite size
         * @protected
         */
        _applyMeasure: function(mainSize, oppositeSize) {

        },
        /**
         * get main stretchability from size of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @returns {boolean} the stretchability info
         * @protected
         */
        _isStretched: function(widget) {
          return false;
        },
        /**
         * get main stretch info of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @returns {boolean} the stretch info
         * @protected
         */
        _getMainStretched: function(widget) {
          const mainStretched = this._getLayoutInfo(widget).getStretched();
          return mainStretched["get" + this._mainStretch]();
        },
        /**
         * get opposite stretch info of given widget or owner if none
         * @param {classes.WidgetBase} [widget] the widget
         * @returns {boolean} the stretch info
         * @protected
         */
        _getOppositeStretched: function(widget) {
          const oppositeStretched = this._getLayoutInfo(widget).getStretched();
          return oppositeStretched["get" + this._oppositeStretch]();
        },
        /**
         * sort function for children widget by their main minimal size
         * @param {classes.WidgetBase} a the first widget
         * @param {classes.WidgetBase} b the second widget
         * @return {number} sort value
         * @private
         */
        _sortItems: function(a, b) {
          return this._getMinimalSize(b) - this._getMinimalSize(a);
        }
      };
    });
  });
