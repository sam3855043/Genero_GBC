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

modulum('TableHeader4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class TableHeader4STBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableHeader4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.TableHeader4STBehavior.prototype */ {
        __name: "TableHeader4STBehavior",

        usedStyleAttributes: ["headerHidden", "headerAlignment"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          let widget = controller.getWidget();
          if (widget) {
            let tableNode = controller.getAnchorNode();
            let headerHidden = tableNode.getStyleAttribute("headerHidden");
            let headerAlignment = tableNode.getStyleAttribute("headerAlignment");
            if (widget.setHeaderHidden && headerHidden) {
              widget.setHeaderHidden(this.isSAYesLike(headerHidden));
            }
            if (widget.setHeaderAlignment && headerAlignment) {
              if (headerAlignment === "default") {
                headerAlignment = "left"; // default is left
              }
              widget.setHeaderAlignment(headerAlignment);
            }
          }
        }
      };
    });
  });
