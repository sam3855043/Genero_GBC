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

modulum('ComboBoxLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {
    /**
     * @class ComboBoxLayoutEngine
     * @memberOf classes
     * @extends classes.LeafLayoutEngine
     */
    cls.ComboBoxLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.ComboBoxLayoutEngine.prototype */ {
        __name: "ComboBoxLayoutEngine",
        /**
         * The number of strings that are in the dom
         * @type number
         */
        _dataMeasureStringCount: 0,
        /**
         * The number of strings we keep for dom measurement
         * @type number
         */
        _dataMeasureStringCountLimit: 10,

        /**
         * @type string
         */
        _oneText: '',

        /**
         * @inheritDoc
         */
        prepareDynamicMeasure: function() {
          this._dataMeasureStringCount = 0;
          if (this._dataContentMeasure) {
            if (!this._widget.getLayoutInformation().getCurrentSizePolicy().isFixed()) {
              this._oneText = this._dataContentMeasure.innerText;

              const children = this._widget.getItems().map(function(item) {
                return item.text;
              });
              if (this._textSample.length > 0) {
                children.push(this._textSample);
              }

              children.sort(function(e1, e2) {
                return e2.length - e1.length;
              });
              let html = '';

              //We keep the <_dataMeasureStringCountLimit> longest values
              for (let i = 0; i < children.length && this._dataMeasureStringCount <= this._dataMeasureStringCountLimit; i++) {
                const value = children[i];
                if (value) {
                  html += value + "<br>";
                  this._dataMeasureStringCount++;
                  this._oneText = value;
                }
              }
              this._dataContentMeasure.innerHTML = html;
            }
          }
        },

        /**
         * @inheritDoc
         */
        DOMMeasure: function() {
          const layoutInfo = this._widget.getLayoutInformation(),
            element = this._widget.getElement();
          let elemRects = element.getBoundingClientRect();
          const dataCount = this._dataMeasureStringCount === 0 ? 1 : this._dataMeasureStringCount;
          // Measure the checkbox icon in Construct
          const isConstruct = this._widget.getDialogType() === 'Construct';
          const checkBoxElem = element.querySelector(".zmdi"),
            checkBoxWidth = checkBoxElem && isConstruct ? checkBoxElem.clientWidth : 0;

          let width = elemRects.width + checkBoxWidth; // add box icon to the measure in construct
          let height = elemRects.height;

          //when we have dataCount > 1 the widget height is not elemRects.height/dataCount (maybe some marge, padding, etc...)
          if (dataCount > 1) {
            this._dataContentMeasure.innerHTML = this._oneText;
            elemRects = element.getBoundingClientRect();
            height = elemRects.height;
          }

          layoutInfo.setRawMeasure(width, height);
        },
      };
    });
  });
