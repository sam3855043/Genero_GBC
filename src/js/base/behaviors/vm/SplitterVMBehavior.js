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

modulum('SplitterVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class SplitterVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.SplitterVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.SplitterVMBehavior.prototype */ {
        __name: "SplitterVMBehavior",

        watchedAttributes: {
          anchor: ['splitter']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.switchSplitters) {
            const activateSplitters = controller.getAnchorNode().attribute('splitter');
            const storedSettingsSplitterId = this._getIdentifier(controller);
            //Check if we force default Settings
            const forcedSettings = controller.getNodeBindings().parent.getStyleAttribute("forceDefaultSettings");
            widget.ignoreStoredSettings(forcedSettings === 1 || forcedSettings === "yes" || forcedSettings === "true");
            widget.switchSplitters(activateSplitters, storedSettingsSplitterId);
          }
        },

        /**
         * Get an unique id for a Hbox / Vbox node
         * @param controller
         * @returns {{formName:string, id:string}} identifier of the splitter (i.e: "Grid0_VBox0")
         * @private
         */
        _getIdentifier: function(controller) {
          const identifier = [];
          const bindings = controller.getNodeBindings();
          let anchor = bindings.anchor;
          let index = 0;
          let parentNode = anchor.getParentNode();
          let siblings = null;
          let formName = "";

          // Goes up in AUI tree to get position of each splitter in VBox, HBox and Grid
          while (parentNode !== null) {
            if (["VBox", "HBox", "Grid"].indexOf(anchor.getTag()) >= 0) {
              siblings = parentNode.getDescendants(anchor.getTag());
              //more than one sibling
              if (siblings.length > 1) {
                index = siblings.indexOf(anchor);
                identifier.push(anchor.getTag() + index);
              } else {
                //only one sibling
                identifier.push(anchor.getTag() + "0");
              }
            } else if (anchor.getTag() === "Form") {
              formName = anchor.attribute("name");
            }

            anchor = parentNode;
            parentNode = anchor.getParentNode();
          }
          return {
            formName: formName,
            id: identifier.reverse().join("_")
          };
        }

      };
    });
  });
