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

modulum("AuiProtocolWriter",
  function(context, cls) {
    const auiTreeCode = "\x01";
    const escapeSpecials = function(text) {
      if (Object.isString(text)) {
        return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/"/g, "\\\"");
      } else {
        return text;
      }
    };
    /** @ignore */
    const stringifiers = {
      /** @ignore */
      om: function(obj, application) {
        const result = [];
        if (application.info().wrapper) {
          result.push(cls.AuiProtocolWriter.translate(obj.orders, application));
        } else {
          result.push("event _om ", obj.order, "{}{", cls.AuiProtocolWriter.translate(obj.orders, application), "}\n");
        }
        //noinspection JSDeprecatedSymbols
        const sendString = result.join("");
        let finalString = sendString;
        if (application.encapsulation) {
          const size = sendString.getBytesCount();
          const encodedSize = Number.encodeInteger(size);
          finalString = encodedSize + encodedSize + auiTreeCode + sendString;
        }
        return finalString;
      },
      /** @ignore */
      meta: function(obj) {
        const result = [];
        result.push("meta ", obj.verb, "{", stringifiers.attributes(obj.attributes), "}\n");
        return result.join("");
      },
      /** @ignore */
      functionCallEvent: function(obj) {
        const result = [];
        const datatypes = {
          "string": "STRING",
          "object": "RECORD",
          "array": "ARRAY"
        };
        result.push("{FunctionCallEvent 0{{result \"", obj.status, "\"}");
        if (obj.message) {
          result.push("{errorMessage \"" + escapeSpecials(obj.message) + "\"}");
        }
        result.push("}");
        if (Array.isArray(obj.values)) {
          result.push("{");
          for (let i = 0; i < obj.values.length; i++) {
            const value = obj.values[i];
            result.push("{FunctionCallReturn " + i + "{");
            const valtype = Object.prototype.toString.call(value) === '[object Array]' ? "array" : typeof value;
            if (datatypes[valtype]) {
              result.push("{dataType \"" + datatypes[typeof value] + "\"}");
            }
            if (value === null || value === undefined || value.length <= 0) {
              result.push("{isNull \"1\"}{value \"0\"}");
            } else if (Object.isBoolean(value)) {
              result.push("{isNull \"0\"}{value \"" + (value ? "1" : "0") + "\"}");
            } else {
              result.push("{isNull \"0\"}{value \"" + escapeSpecials(value.toString()) + "\"}");
            }
            result.push("}{}}");
          }
          result.push("}");
        }
        result.push("}");
        return result.join("");
      },
      /** @ignore */
      configureEvent: function(obj) {
        const result = [];
        result.push("{ConfigureEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      keyEvent: function(obj) {
        const result = [];
        result.push("{KeyEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      actionEvent: function(obj) {
        const result = [];
        result.push("{ActionEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      rowSelectionEvent: function(obj) {
        const result = [];
        result.push("{RowSelectionEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      dragDropEvent: function(obj) {
        const result = [];
        result.push("{DragDropEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      attributes: function(attributeList) {
        const string = [];
        const keys = Object.keys(attributeList);
        for (let i = 0; i < keys.length; i++) {
          string.push("{", keys[i], " \"", escapeSpecials(attributeList[keys[i]]), "\"", "}");
        }
        return string.join("");
      },
      /** @ignore */
      destroyEvent: function(obj) {
        const result = [];
        result.push("{DestroyEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },
      /** @ignore */
      logEvent: function(obj) {
        const result = [];
        result.push("{LogEvent 0{", stringifiers.attributes(obj.attributes), "}}");
        return result.join("");
      },

      /** @ignore */
      _default: function(obj) {
        context.LogService.info("no aui protocol implementation for " + obj.type, obj);
        return "";
      }
    };
    /**
     * @namespace classes.AuiProtocolWriter
     */
    cls.AuiProtocolWriter = context.oo.StaticClass(
      /** @lends classes.AuiProtocolWriter */
      {
        __name: "AuiProtocolWriter",
        /**
         *
         * @param obj
         * @param application
         * @return {string}
         */
        translate: function(obj, application) {
          return (Array.isArray(obj) ? obj : [obj]).map(function(item) {
            return (stringifiers[item.type] || stringifiers._default)(item, application);
          }).join("");

        }
      });
  });
