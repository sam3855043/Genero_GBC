/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TabbedContainer4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class TabbedContainer4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.TabbedContainer4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.TabbedContainer4STBehavior.prototype */ {
        __name: "TabbedContainer4STBehavior",

        usedStyleAttributes: ["tabbedContainer"],
        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            app = node?.getApplication();

          if (app) {
            const isTabbedContainer = this.isSAYesLike(node.getStyleAttribute('tabbedContainer'));
            if (isTabbedContainer) {
              const widget = node.getController() && node.getController().getWidget();
              if (widget && !(widget.getModal && widget.getModal()) && node.getApplication().getNode(0).getChildren("StartMenu").length) {
                app.setTabbedContainerMode(isTabbedContainer, node);
                context.__wrapper.nativeCall(context.__wrapper.param({
                  name: "activateTabbedContainer"
                }, app));
              }
            }
          }
        }
      };
    });
  });
