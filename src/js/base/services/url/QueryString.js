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

modulum('QueryString',
  function(context, cls) {

    /**
     *
     * @class QueryString
     * @memberOf classes
     */
    cls.QueryString = context.oo.Class(function() {
      return /** @lends classes.QueryString.prototype */ {
        $static: /** @lends classes.QueryString */ {
          deletedTokenValue: {}
        },
        _contents: null,
        constructor: function(raw) {
          this._contents = {};
          this.fromRaw(raw);
        },
        fromRaw: function(raw) {
          if (raw instanceof cls.QueryString) {
            this._contents = raw.copyContentsObject();
          } else {
            if (Object.isString(raw)) {
              const tokens = raw.split("&");
              for (const token of tokens) {
                if (token) {
                  const q = /([^=]+)=(.*)/.exec(token);
                  if (q) {
                    this.add(q[1], q[2]);
                  }
                }
              }
            }
          }
        },
        copyContentsObject: function() {
          const result = {};
          const contentKeys = Object.keys(this._contents);
          for (const key of contentKeys) {
            const values = this._contents[key];
            if (Array.isArray(values)) {
              result[key] = [];
              for (const value of values) {
                result[key].push(value);
              }
            } else {
              if (values !== cls.QueryString.deletedTokenValue) {
                result[key] = values;
              }
            }
          }
          return result;
        },
        toString: function() {
          const result = [];
          const contentKeys = Object.keys(this._contents);
          for (const key of contentKeys) {
            const values = this._contents[key];
            if (Array.isArray(values)) {
              for (const value of values) {
                result.push(key + (value === false || value === 0 || value === "" || value ? ("=" + value) : ""));
              }
            } else {
              if (values !== cls.QueryString.deletedTokenValue) {
                result.push(key + (values === false || values === 0 || values === "" || values ? ("=" + values) : ""));
              }
            }
          }
          return result.join("&");
        },
        add: function(key, value) {
          if (this._contents.hasOwnProperty(key)) {
            if (Array.isArray(this._contents[key])) {
              this._contents[key].push(value);
            } else {
              this._contents[key] = [this._contents[key], value];
            }
          } else {
            this._contents[key] = value;
          }
        },
        /**
         *
         * @param key
         * @param value
         */
        remove: function(key, value) {
          if (value === false || value === 0 || value === "" || value) {
            if (Array.isArray(this._contents[key])) {
              if (this._contents[key].contains(value)) {
                this._contents[key].remove(value);
              }
              if (this._contents[key].length === 1) {
                this._contents[key] = this._contents[key][0];
              } else if (!this._contents[key].length) {
                this._contents[key] = cls.QueryString.deletedTokenValue;
              }
            } else if (this._contents.hasOwnProperty(key) && this._contents[key] === value) {
              this._contents[key] = cls.QueryString.deletedTokenValue;
            }
          } else if (this._contents.hasOwnProperty(key)) {
            this._contents[key] = cls.QueryString.deletedTokenValue;
          }
        },
        isEmpty: function() {
          return !Object.keys(this._contents).length;
        }
      };
    });
  });
