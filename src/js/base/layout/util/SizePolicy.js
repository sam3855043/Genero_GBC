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

modulum("SizePolicy",
  function(context, cls) {
    /**
     * Size Policy
     * @class SizePolicy
     * @memberOf classes
     */
    cls.SizePolicy = context.oo.Class(function() {
      return /** @lends classes.SizePolicy.prototype */ {
        __name: "SizePolicy",
        $static: /** @lends classes.SizePolicy */ {
          /**
           * @returns {classes.SizePolicy}
           */
          Fixed: function() {
            const result = new cls.SizePolicy();
            result._fixed = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          Initial: function() {
            const result = new cls.SizePolicy();
            result._growable = true;
            result._shrinkable = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          InitialGrow: function() {
            const result = new cls.SizePolicy();
            result._growable = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          InitialShrink: function() {
            const result = new cls.SizePolicy();
            result._shrinkable = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          Dynamic: function() {
            const result = new cls.SizePolicy();
            result._growable = true;
            result._shrinkable = true;
            result._dynamic = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          DynamicGrow: function() {
            const result = new cls.SizePolicy();
            result._growable = true;
            result._dynamic = true;
            return result;
          },
          /**
           * @returns {classes.SizePolicy}
           */
          DynamicShrink: function() {
            const result = new cls.SizePolicy();
            result._shrinkable = true;
            result._dynamic = true;
            return result;
          }
        },
        /**
         * @type {boolean}
         */
        _growable: false,
        /**
         * @type {boolean}
         */
        _dynamic: false,
        /**
         * @type {boolean}
         */
        _shrinkable: false,
        /**
         * @type {boolean}
         */
        _fixed: false,

        /**
         *
         * @returns {boolean}
         */
        canGrow: function() {
          return this._growable;
        },
        /**
         *
         * @returns {boolean}
         */
        canShrink: function() {
          return this._shrinkable;
        },
        setShrinkable: function(canShrink) {
          this._shrinkable = canShrink;
        },
        setGrowable: function(canGrow) {
          this._growable = canGrow;
        },
        isFixed: function() {
          return this._fixed;
        },
        isDynamic: function() {
          return this._dynamic;
        }
      };
    });
  });
