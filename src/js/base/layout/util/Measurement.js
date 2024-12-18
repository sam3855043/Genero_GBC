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

(
  function(context, cls) {
    const _cache = {};

    const getCacheFor = function(fontFamily, fontSize) {
      _cache[fontFamily] = _cache[fontFamily] || {};
      return (_cache[fontFamily][fontSize] = _cache[fontFamily][fontSize] || {
        width: [],
        height: null
      });
    };

    const measureElement = document.createElement("div");
    measureElement.classList.add("measureTool");
    document.body.appendChild(measureElement);

    const measurementHost = document.createElement("div");
    measurementHost.classList.add("measurementHost");
    document.body.appendChild(measurementHost);

    const measureWidth = function(fontFamily, fontSize, size) {
      const cache = getCacheFor(fontFamily, fontSize);
      if (Object.isNumber(cache.width[size])) {
        return cache.width[size];
      } else {
        measureElement.style.fontFamily = fontFamily;
        measureElement.style.fontSize = fontSize;
        measureElement.textContent = cls.Measurement.getTextSample(size, 1);
        // TODO : look further for this add
        // add 7 pixels: to match the width needed for an input with just a 'W' character
        return (cache.width[size] = (measureElement.getBoundingClientRect().width + 7));
      }
    };

    const measureHeight = function(fontFamily, fontSize, size) {
      const cache = getCacheFor(fontFamily, fontSize);
      if (Object.isNumber(cache.height)) {
        return cache.height;
      } else {
        measureElement.style.fontFamily = fontFamily;
        measureElement.style.fontSize = fontSize;
        measureElement.textContent = "X";
        // TODO : look further for this add
        // add 4 pixels: to match the height needed for an input with borders and paddings
        return (cache.height = (Math.max(20, measureElement.getBoundingClientRect().height * size + 4)));
      }
    };

    /**
     * Tool for rendered size measurement
     * Caches measurements for perfs.
     * @namespace classes.Measurement
     */
    cls.Measurement = context.oo.StaticClass(function() {
      return /** @lends classes.Measurement */ {
        __name: "Measurement",
        _samples: {},
        /**
         *
         * @param element
         */
        fontInfo: function(element) {
          const style = window.getComputedStyle(element);
          const fontFamilly = style.fontFamily === null || style.fontFamily === undefined ? style.fontFamily :
            style.fontFamily.escapeFontFamily();

          return {
            "font-family": fontFamilly,
            "font-size": style.fontSize,
            "font-weight": style.fontWeight
          };
        },
        measuredWidth: function(fontFamily, fontSize, size) {
          return measureWidth(fontFamily, fontSize, size);
        },
        measuredHeight: function(fontFamily, fontSize, size) {
          return measureHeight(fontFamily, fontSize, size);
        },

        getTextSample: function(width, height) {
          let result = this._samples["" + width + "x" + height];
          if (result) {
            return result;
          }
          let i;
          const M = Math.min(6, width),
            O = Math.max(0, (width - 6)),
            H = Math.max(height - 1, 0);
          result = [];
          for (i = 0; i < M; i++) {
            result.push("M");
          }
          for (i = 0; i < O; i++) {
            result.push("0");
          }
          for (i = 0; i < H; i++) {
            result.push("\nM");
          }
          result = this._samples["" + width + "x" + height] = result.join("");
          return result;
        }
      };
    });
  })(gbc, gbc.classes);
