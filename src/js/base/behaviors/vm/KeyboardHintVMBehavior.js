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

modulum('KeyboardHintVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class KeyboardHintVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.KeyboardHintVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.KeyboardHintVMBehavior.prototype */ {
        __name: "KeyboardHintVMBehavior",

        watchedAttributes: {
          container: ['varType'],
          decorator: ['keyboardHint']
        },

        usedStyleAttributes: ["dataTypeHint"],

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setType) {
            const bindings = controller.getNodeBindings();
            let keyboardHint = null;
            const keyboardVal = bindings.decorator.attribute('keyboardHint');
            if (keyboardVal) {
              keyboardHint = keyboardVal.toLowerCase();
            }

            let varType = bindings.container.attribute('varType');

            if (varType) {
              varType = varType.toLowerCase();
            } else {
              varType = "";
            }

            if (widget.setDataTypeWithNoScroll) {
              if (varType.startsWith("varchar") || varType.startsWith("char") ||
                varType.startsWith("string") || varType.startsWith("text")) {
                widget.setDataTypeWithNoScroll(false);
              } else {
                widget.setDataTypeWithNoScroll(true);
              }
            }

            widget.setInputMode("");

            switch (keyboardHint) {
              case "email":
                widget.setType("email");
                break;
              case "number":
              case "decimal":
                widget.setType("text");
                widget.setInputMode("decimal");
                break;
              case "numeric":
                widget.setType("text");
                widget.setInputMode("numeric");
                break;
              case "phone":
                widget.setType("tel");
                break;
              case "url":
                widget.setType("url");
                break;
              case "text":
                widget.setType("text");
                break;
              case "none":
                widget.setType("text");
                widget.setInputMode("none");
                break;
              case "search":
                widget.setType("text");
                widget.setInputMode("search");
                break;
              case "default":
              default:
                widget.setType("text");

                if (varType.startsWith("integer") || varType.startsWith("boolean") ||
                  varType.startsWith("bigint") || varType.startsWith("smallint") ||
                  varType.startsWith("tinyint")) {
                  widget.setInputMode("numeric");
                } else if (varType.startsWith("decimal") || varType.startsWith("float") ||
                  varType.startsWith("money") || varType.startsWith("smallfloat")) {
                  widget.setInputMode("decimal");
                }
            }
          }
        }
      };
    });
  });
