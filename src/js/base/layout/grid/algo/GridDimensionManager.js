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

modulum('GridDimensionManager',
  function(context, cls) {
    /**
     *
     * slots:             [       ]   [           ]
     * elements (unit): |_|_|_|_|_|_|_|_|_|_|_|_|_|_|_|
     * @class GridDimensionManager
     * @memberOf classes
     */
    cls.GridDimensionManager = context.oo.Class(function() {
      return /** @lends classes.GridDimensionManager.prototype */ {
        __name: "GridDimensionManager",

        /**
         * handle registration for theme change
         * @type {HandleRegistration}
         */
        _themeWatcher: null,

        /**
         * dimension elements
         * @type {classes.GridDimensionElement[]}
         */
        dimensionElements: null,

        /**
         * gutter size (minimal space between elements)
         * @type {number}
         */
        _gutterSize: 0,

        /**
         * empty element size
         * @type {number}
         */
        _emptyElementSize: 0,

        /**
         * will force uniform distribution while stretching
         * true for X dimension (columns) false for Y dimension (rows)
         * @type {boolean}
         */
        _uniformDistribution: false,

        /**
         * slots
         * @type {classes.GridDimensionSlot[]}
         */
        slots: null,

        /**
         * dimension size
         * @type {number}
         */
        _size: 0,

        /**
         * is dimension meant to stretch
         * @type {boolean}
         */
        stretchable: false,

        /**
         * Managed dimension ('X' or 'Y')
         * @type {string}
         */
        _dimension: 'X',

        /**
         * @constructs
         * @param {?boolean} [uniformDistribution] will force uniform distribution while stretching
         * @param {string} dimension Specify the X or Y dimension managed
         */
        constructor: function(uniformDistribution, dimension = 'X') {
          this._dimension = dimension;
          this._uniformDistribution = Boolean(uniformDistribution);
          this._gutterSize = this._dimension === 'X' ?
            context.ThemeService.getGutterX() : context.ThemeService.getGutterY();
          this._themeWatcher = context.ThemeService.whenThemeChanged(function() {
            this._gutterSize = this._dimension === 'X' ?
              context.ThemeService.getGutterX() : context.ThemeService.getGutterY();
          }.bind(this));
          this.slots = [];
          this.dimensionElements = [];
        },

        /**
         * get the dimension size
         * @return {number} the dimension size
         */
        getSize: function() {
          return this._size;
        },

        /**
         * Get the computed preferred size
         * @param {number} [from] from position (or start)
         * @param {number} [to] to position (or end)
         * @param {boolean} [includeFirstBeforeGap] true to include first before gap
         * @param {boolean} [includeLastAfterGap] true to include last after gap
         * @return {number} the computed preferred size
         */
        getHintSize: function(from, to, includeFirstBeforeGap, includeLastAfterGap) {
          from = Object.isNumber(from) ? from : 0;
          to = Object.isNumber(to) ? to : this._size - 1;
          includeFirstBeforeGap = includeFirstBeforeGap !== false;
          includeLastAfterGap = includeLastAfterGap !== false;

          let total = 0;
          let totalGaps = 0;
          for (let i = from; i <= to; i++) {
            total += this.dimensionElements[i].hintSize;
            totalGaps +=
              ((i !== from || includeFirstBeforeGap) ? this.dimensionElements[i].getBeforeGap() : 0) +
              ((i !== to || includeLastAfterGap) ? this.dimensionElements[i].getAfterGap() : 0);
          }
          if (!total) {
            if (this.getMaxSize() === cls.Size.maximal) {
              total = totalGaps;
            }
          } else {
            total += totalGaps;
          }
          if (includeLastAfterGap && from === 0 && to === (this._size - 1) && total > this._gutterSize) {
            total -= this._gutterSize;
          }
          return total;
        },

        /**
         * Get the computed maximum size
         * @param {number} [from] from position (or start)
         * @param {number} [to] to position (or end)
         * @param {boolean} [includeFirstBeforeGap] true to include first before gap
         * @param {boolean} [includeLastAfterGap] true to include last after gap
         * @return {number} the computed maximum size
         */
        getMaxSize: function(from, to, includeFirstBeforeGap, includeLastAfterGap) {
          from = Object.isNumber(from) ? from : 0;
          to = Object.isNumber(to) ? to : this._size - 1;
          includeFirstBeforeGap = includeFirstBeforeGap !== false;
          includeLastAfterGap = includeLastAfterGap !== false;

          let total = 0;
          for (let i = from; i <= to; i++) {
            total += this.dimensionElements[i].maxSize +
              ((i !== from || includeFirstBeforeGap) ? this.dimensionElements[i].getBeforeGap() : 0) +
              ((i !== to || includeLastAfterGap) ? this.dimensionElements[i].getAfterGap() : 0);
          }
          if (includeLastAfterGap && from === 0 && to === (this._size - 1) && total > this._gutterSize) {
            total -= this._gutterSize;
          }
          return total;
        },

        /**
         * Get the computed minimum size
         * @param {number} [from] from position (or start)
         * @param {number} [to] to position (or end)
         * @param {boolean} [includeFirstBeforeGap] true to include first before gap
         * @param {boolean} [includeLastAfterGap] true to include last after gap
         * @return {number} the computed minimum size
         */
        getMinSize: function(from, to, includeFirstBeforeGap, includeLastAfterGap) {
          from = Object.isNumber(from) ? from : 0;
          to = Object.isNumber(to) ? to : this._size - 1;
          includeFirstBeforeGap = includeFirstBeforeGap !== false;
          includeLastAfterGap = includeLastAfterGap !== false;

          let total = 0;
          for (let i = from; i <= to; i++) {
            total += this.dimensionElements[i].minSize +
              ((i !== from || includeFirstBeforeGap) ? this.dimensionElements[i].getBeforeGap() : 0) +
              ((i !== to || includeLastAfterGap) ? this.dimensionElements[i].getAfterGap() : 0);
          }
          if (includeLastAfterGap && from === 0 && to === (this._size - 1) && total > this._gutterSize) {
            total -= this._gutterSize;
          }
          return Number.isNaN(total) ? 0 : total;
        },
        /**
         * Get the computed size
         * @param {number} [from] from position (or start)
         * @param {number} [to] to position (or end)
         * @param {boolean} [includeFirstBeforeGap] true to include first before gap
         * @param {boolean} [includeLastAfterGap] true to include last after gap
         * @return {number} the computed size
         */
        getCalculatedSize: function(from, to, includeFirstBeforeGap, includeLastAfterGap) {
          from = Object.isNumber(from) ? from : 0;
          to = Object.isNumber(to) ? to : this._size - 1;
          includeFirstBeforeGap = includeFirstBeforeGap !== false;
          includeLastAfterGap = includeLastAfterGap !== false;

          let total = 0;
          for (let i = from; i <= to; i++) {
            total +=
              ((i !== from || includeFirstBeforeGap) ? this.dimensionElements[i].getBeforeGap() : 0) +
              ((this.dimensionElements[i].intrinsicSize + this.dimensionElements[i].bonusSize) || this._emptyElementSize) +
              ((i !== to || includeLastAfterGap) ? this.dimensionElements[i].getAfterGap() : 0);
          }
          if (includeLastAfterGap && from === 0 && to === (this._size - 1) && total > this._gutterSize) {
            total -= this._gutterSize;
          }
          return total;
        },

        /**
         * set a new dimension size
         * @param {number} newSize the new size
         * @param {boolean} [destroyDimensionElements] destroy current dimension elements
         */
        setSize: function(newSize, destroyDimensionElements) {
          const size = this._size;
          if (newSize > size) {
            for (let addingIndex = this.dimensionElements.length; addingIndex < newSize; addingIndex++) {
              this.dimensionElements[addingIndex] = new cls.GridDimensionElement(addingIndex);
            }
          }
          if (destroyDimensionElements) {
            for (let i = newSize; i < this.dimensionElements.length; i++) {
              this.dimensionElements[i].destroy();
            }
            this.dimensionElements.length = newSize;
          }
          this._size = newSize;
        },

        /**
         * Ensure given size
         * @param {number} size the size to ensure
         */
        ensureSize: function(size) {
          if (this.getSize() < size) {
            this.setSize(size);
          }
        },

        /**
         * Set the dimension as stretchable
         * @param stretchable the stretchable state
         */
        setStretchable: function(stretchable) {
          this.stretchable = stretchable;
        },

        /**
         * reset elements
         * @param {boolean} [swipeGaps] true to swipe gaps
         * @param {boolean} [resetIntrinsicSizes] true to reset intrinsic sizes
         */
        resetDimensionSizes: function(swipeGaps, resetIntrinsicSizes) {
          const size = this.getSize();
          for (let i = 0; i < size; i++) {
            this.dimensionElements[i].resetSize(swipeGaps, resetIntrinsicSizes);
          }
        },

        /**
         * update MaxSize of all elements
         */
        updateMaxSizes: function() {
          let size = this.getSize();
          for (let i = 0; i < size; i++) {
            this.dimensionElements[i].maxSize = 0;
          }
          size = this.slots.length;
          for (let i = 0; i < size; i++) {
            const slot = this.slots[i];
            const slotSize = slot.getSize();
            const pos = slot.getPosition();
            const lastPos = slot.getLastPosition();
            if (slot.displayed) {
              const elementMaxSize = slot.maxSize / slotSize;
              for (let position = pos; position <= lastPos; position++) {
                const dimensionElement = this.dimensionElements[position];
                dimensionElement.adjustMaxSize(elementMaxSize);
              }
            }
          }
        },

        /**
         * Add slot usage on the dimension
         * @param {classes.GridDimensionSlot} slot
         */
        addSlot: function(slot) {
          this.ensureSize(slot.getLastPosition() + 1);
          let insertIndex = 0;
          const size = this.slots.length;
          for (; insertIndex < size && this.slots[insertIndex].getPosition() < slot.getPosition();) {
            insertIndex++;
          }
          for (; insertIndex < size && this.slots[insertIndex].getSize() < slot.getSize();) {
            insertIndex++;
          }
          this.slots.add(slot, insertIndex);
          slot.attach(this);
          for (let i = slot.getPosition(); i <= slot.getLastPosition(); i++) {
            this.dimensionElements[i].attach(slot);
          }
        },
        /**
         * Remove slot usage on the dimension
         * @param {classes.GridDimensionSlot} slot
         */
        removeSlot: function(slot) {
          for (let i = slot.getPosition(); i <= slot.getLastPosition(); i++) {
            this.dimensionElements[i].detach(slot);
          }
          slot.detach();
          const index = this.slots.indexOf(slot);
          if (index >= 0) {
            this.slots.splice(index, 1);
          }
          return slot;
        },

        /**
         * update gaps of all elements
         */
        updateGaps: function() {
          const size = this.getSize();
          for (let i = 0; i < size; i++) {
            this.dimensionElements[i].updateGaps();
          }
        },
        /**
         * compute intrinsic sizes (natural measured sizes)
         */
        updateIntrinsicSizes: function() {
          this.resetDimensionSizes(true, true);

          const size = this.slots.length;
          for (let i = 0; i < size; i++) {
            const slot = this.slots[i];
            const slotSize = slot.getSize();
            const pos = slot.getPosition();
            const lastPos = slot.getLastPosition();
            if (slot.displayed) {
              const totalGapSizes = this.getGapSizing(pos, lastPos);
              const elementMaxSize = slot.maxSize / slotSize;
              const elementMinSize = slot.minSize / slotSize;

              const lambdaUnitSize = Math.max((slot.desiredMinimalSize - totalGapSizes) / slotSize, elementMinSize);

              for (let position = pos; position <= lastPos; position++) {
                const dimensionElement = this.dimensionElements[position];
                dimensionElement.adjustMinSize(elementMinSize);
                dimensionElement.adjustMaxSize(elementMaxSize);
                dimensionElement.adjustIntrinsicSize(lambdaUnitSize);
              }
            }
          }
        },
        /**
         * adjust elements stretchability and preferred sizes
         */
        updateStretchability: function() {
          const size = this.slots.length;
          for (let i = 0; i < size; i++) {
            const slot = this.slots[i];
            const slotSize = slot.getSize();
            const pos = slot.getPosition();
            const lastPos = slot.getLastPosition();

            if (slot.displayed) {
              const totalGapSizes = this.getGapSizing(pos, lastPos);
              const slotHint = (slot.hintSize - totalGapSizes) / slotSize;
              for (let position = pos; position <= lastPos; position++) {
                const dimensionElement = this.dimensionElements[position];
                if (slot.stretchable) {
                  dimensionElement.adjustHintSize(slotHint);
                  dimensionElement.stretchable = true;
                } else {
                  if (!slot.opportunisticStretchable) {
                    dimensionElement.unstretchable++;
                  }
                }
              }
            }
          }
        },

        /**
         * Not uniform distribution used for Y dimension (rows)
         * TODO Explain what is the meaning of "not uniform distribution"
         * @param {number} sizeToDistribute - the total difference to add
         * @param {number} totalWeights - total weight that determines how to distribute space
         * @returns {boolean}
         * @private
         */
        _updateBonusSizeNotUniformDistribution: function(sizeToDistribute, totalWeights) {
          let result = false;
          const unstretchable = this._searchMinUnstretchableInAllElements();
          const stretchableElements = [];

          // - get all stretchable elements
          // - compute maxBonus size for each element
          for (let i = 0; i < this._size; i++) {
            const dimensionElement = this.dimensionElements[i];
            if (dimensionElement.stretchable && (dimensionElement.unstretchable ===
                unstretchable)) {
              stretchableElements.push(dimensionElement);
              dimensionElement.maxBonus = dimensionElement.maxSize - dimensionElement.intrinsicSize;
            }
          }

          // Compute bonusSize for each element
          const len = stretchableElements.length;
          for (let i = 0; i < len; i++) {
            const dimensionElement = stretchableElements[i];
            const weight = dimensionElement.intrinsicSize / totalWeights;
            dimensionElement.bonusSize = weight * sizeToDistribute;
            result = true;
          }

          return result;
        },

        /**
         * Distribute space to add to elements (when grid needs to stretch)
         * Space is first distribute only on minimum size elements which new size that can not be greater than other elements.
         * If there is still some space to distribute we redo again the distribution on the minimum size elements
         * and again until there is no space to distribute.
         * @param {number} sizeToDistribute the total difference to add
         * @return {boolean}
         */
        _updateBonusSizeUniformDistribution: function(sizeToDistribute) {
          let result = false;
          const stretchableElements = [];
          let localSizeToDistribute = sizeToDistribute;

          // loop until there will be no more space to distribute
          // if there is 1 pixel or less no need to distribute
          while (localSizeToDistribute > 1) {

            // check if we have already computed the array of stretchable elements
            const stretchableElementAlreadyComputed = stretchableElements.length > 0;
            const elements = stretchableElementAlreadyComputed ? stretchableElements : this.dimensionElements;

            // minimum size of stretchable elements
            let minElementsSize = Number.POSITIVE_INFINITY;
            // number of elements with a minimum size
            let nbMinElementSize = 0;
            // minimum size 2 is the minimum immediately greater than minElementsSize
            let min2ElementsSize = Number.POSITIVE_INFINITY;

            // go through all stretchable elements
            const elementsSize = elements.length;
            for (let i = 0; i < elementsSize; i++) {
              const dimensionElement = elements[i];
              if (dimensionElement.stretchable) {
                const elementRealSize = dimensionElement.intrinsicSize + dimensionElement.bonusSize;
                if (elementRealSize === minElementsSize) {
                  nbMinElementSize++;
                } else if (elementRealSize < minElementsSize) {
                  min2ElementsSize = minElementsSize;
                  minElementsSize = elementRealSize;
                  nbMinElementSize = 1;

                } else if (elementRealSize < min2ElementsSize) {
                  min2ElementsSize = elementRealSize;
                }
                if (!stretchableElementAlreadyComputed) {
                  stretchableElements.push(dimensionElement);

                  // TODO what is the purpose of maxBonus variable
                  dimensionElement.maxBonus = dimensionElement.maxSize - dimensionElement.intrinsicSize;
                }
              }
            }

            // maximum size that we can add to min elements to reach the size of min elements 2
            const maxBonusForMinElements = min2ElementsSize === minElementsSize ? Number.POSITIVE_INFINITY : (min2ElementsSize -
              minElementsSize);

            // bonusSize will be the space that will be distributed on all min elements
            const bonusSize = Math.min(localSizeToDistribute / nbMinElementSize, maxBonusForMinElements);

            // Update bonusSize for each min element
            const len = stretchableElements.length;
            for (let i = 0; i < len; i++) {
              const dimensionElement = stretchableElements[i];
              const elementRealSize = dimensionElement.intrinsicSize + dimensionElement.bonusSize;
              if (elementRealSize === minElementsSize) { // if it's a min elements, add bonusSize
                dimensionElement.bonusSize += bonusSize;
                // update sizeToDistribute
                localSizeToDistribute -= bonusSize;
                result = true;
              }
            }
          }

          return result;
        },

        /**
         * Distribute space to add to elements (when grid needs to stretch)
         * @param {number} sizeToDistribute the total difference to add
         * @return {boolean}
         */
        updateBonusSize: function(sizeToDistribute) {
          let result = false;
          const totalWeights = this._getTotalWeights();
          if (totalWeights > 0) {

            if (this._uniformDistribution) {
              // uniform distribution used for X dimension (columns)
              result = this._updateBonusSizeUniformDistribution(sizeToDistribute);
            } else {
              // not uniform distribution used for Y dimension (rows)
              result = this._updateBonusSizeNotUniformDistribution(sizeToDistribute, totalWeights);
            }

          } else {
            // Grid is stretchable, but totalWeights === 0 means there is no stretchable elements in the grid
            if (this.stretchable && this._size > 0) {

              const indexOfFirstNotEmptyElement = this.dimensionElements.findIndex(dim => dim.slots.length > 0);

              // Dispatch the sizeToDistribute equally to all elements (except for empty elements leading)
              for (let i = indexOfFirstNotEmptyElement; i < this._size; i++) {
                const dimensionElement = this.dimensionElements[i];
                dimensionElement.bonusSize = sizeToDistribute / (this._size - indexOfFirstNotEmptyElement);
                result = true;
              }
            }
          }
          return result;
        },

        /**
         * Distribute space to remove to elements (when grid needs to shrink)
         * Distribution is proportional to intrinsicSize of each element
         * It means an element with a bigger intrinsicSize get more malusSize than a smaller element
         * @param sizeToDistribute the total difference to remove
         * @return {boolean}
         */
        updateMalusSize: function(sizeToDistribute) {
          let result = false;
          const totalWeights = this._getTotalWeights();
          if (totalWeights > 0) {
            const unstretchable = this._uniformDistribution ? Number.POSITIVE_INFINITY : this._searchMinUnstretchableInAllElements();

            // - get all stretchable elements
            // - compute maxMalus size for each element
            // - compute totalLocalWeights
            let totalLocalWeights = 0;
            const stretchableElements = [];
            let i;
            for (i = 0; i < this._size; i++) {
              const dimensionElement = this.dimensionElements[i];
              if (dimensionElement.stretchable && (this._uniformDistribution || (dimensionElement.unstretchable ===
                  unstretchable))) {
                stretchableElements.push(dimensionElement);
                totalLocalWeights += dimensionElement.intrinsicSize;
                dimensionElement.maxMalus = dimensionElement.intrinsicSize - dimensionElement.minSize;
              }
            }
            stretchableElements.sort(function(a, b) {
              return a.maxMalus < b.maxMalus ? -1 : (a.maxMalus > b.maxMalus ? 1 : 0);
            });

            // Compute malusSize for each element
            const len = stretchableElements.length;
            for (i = 0; i < len; i++) {
              const dimensionElement = stretchableElements[i];
              const delta = -sizeToDistribute * (dimensionElement.intrinsicSize / totalLocalWeights);
              if (dimensionElement.maxMalus > delta) {
                dimensionElement.bonusSize = -delta;
                sizeToDistribute += delta;
                totalLocalWeights -= dimensionElement.intrinsicSize;
              } else {
                dimensionElement.bonusSize = -dimensionElement.maxMalus;
                sizeToDistribute += dimensionElement.maxMalus;
                totalLocalWeights -= dimensionElement.intrinsicSize;
              }
              result = true;
            }
          } else {
            let maxMalus;
            if (this.stretchable && this._size > 0) {
              for (let e = 0; e < this._size; e++) {
                const dimensionElement = this.dimensionElements[e];
                dimensionElement.bonusSize = sizeToDistribute / this._size;
                maxMalus = dimensionElement.intrinsicSize - dimensionElement.minSize;
                if ((-dimensionElement.bonusSize) > maxMalus) {
                  dimensionElement.bonusSize = -maxMalus;
                }
                result = true;
              }
            }
          }
          return result;
        },

        /**
         * compute all slots positions and sizes to apply to css
         * @return {{regularPositions: Array, regular: {}}}
         */
        render: function() {
          const result = {
            regularPositions: [],
            regular: {}
          };
          for (const slot of this.slots) {
            if (!result.regular[slot.getPosition()]) {
              result.regularPositions.push(slot.getPosition());
              result.regular[slot.getPosition()] = {
                position: this.getCalculatedSize(0, slot.getPosition() - 1, true, true),
                beforeGap: this.dimensionElements[slot.getPosition()].beforeGap,
                regularLengths: [],
                lengths: {},
                lengthsWithGaps: {}
              };
            }
            if (!Object.isNumber(result.regular[slot.getPosition()].lengths[slot.getSize()])) {
              result.regular[slot.getPosition()].regularLengths.push(slot.getSize());
              result.regular[slot.getPosition()].lengths[slot.getSize()] = this.getCalculatedSize(slot.getPosition(), slot
                .getLastPosition(),
                false, false);
              result.regular[slot.getPosition()].lengthsWithGaps[slot.getSize()] = this.getCalculatedSize(slot.getPosition(),
                slot.getLastPosition(),
                true, true);
            }
          }
          return result;
        },

        /**
         * get the total weight that determines how to distribute space
         * @return {number} the total weight in the dimension
         * @private
         */
        _getTotalWeights: function() {
          let result = 0;
          const unstretchable = this._uniformDistribution ? Number.POSITIVE_INFINITY : this._searchMinUnstretchableInAllElements();

          for (let i = 0; i < this._size; i++) {
            const dimensionElement = this.dimensionElements[i];
            if (dimensionElement.stretchable && (this._uniformDistribution || (dimensionElement.unstretchable === unstretchable))) {
              result += dimensionElement.intrinsicSize;
            }
          }
          return result;
        },

        /**
         * Search the min unstretchable value for all elements
         * @returns {number} min unstretchable
         * @private
         */
        _searchMinUnstretchableInAllElements: function() {
          let unstretchable = Number.POSITIVE_INFINITY;
          for (let i = 0; i < this._size; i++) {
            const dimensionElement = this.dimensionElements[i];
            if (dimensionElement.stretchable) {
              unstretchable = Math.min(unstretchable, dimensionElement.unstretchable);
            }
          }
          return unstretchable;
        },

        /**
         * Get the computed total gap size
         * @param {number} [from] from position (or start)
         * @param {number} [to] to position (or end)
         * @param {boolean} [includeFirstBeforeGap] true to include first before gap
         * @param {boolean} [includeLastAfterGap] true to include last after gap
         * @return {number} the computed total gap size
         */
        getGapSizing: function(from, to, includeFirstBeforeGap, includeLastAfterGap) {
          let total = 0;
          for (let i = from; i <= to; i++) {
            total +=
              ((i !== from || includeFirstBeforeGap) ? this.dimensionElements[i].getBeforeGap() : 0) +
              ((i !== to || includeLastAfterGap) ? this.dimensionElements[i].getAfterGap() : 0);
          }
          return total;
        },

        /**
         * destroy
         */
        destroy: function() {
          if (this._themeWatcher) {
            this._themeWatcher();
            this._themeWatcher = null;
          }
          this.setSize(0, true);
        }
      };
    });
  });
