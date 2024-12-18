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

modulum('ComponentTypeVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class ComponentTypeVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.ComponentTypeVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.ComponentTypeVMBehavior.prototype */ {
        __name: "ComponentTypeVMBehavior",

        watchedAttributes: {
          decorator: ['componentType']
        },

        /**
         *
         */
        _apply: function(controller, data) {
          const decoratorNode = controller.getNodeBindings().decorator;
          const app = decoratorNode.getApplication();
          const widget = controller.getWidget();
          if (widget?.setWebComponentType) {
            const componentType = decoratorNode.attribute('componentType');
            const isApi = Boolean(componentType);
            widget.setWebComponentType(componentType ? "api" : "url");
            if (isApi) {
              // if application info has webComponent prefix, use it
              const componentUrlPart = app.info().webComponent ?
                (app.info().webComponent + "/" + componentType + "/" + componentType + ".html") :
                (componentType + "/" + componentType + ".html"),
                webcompUrl = app.wrapResourcePath(
                  componentUrlPart,
                  "webcomponents",
                  app.info().webComponent);
              widget.setUrl(webcompUrl);
            }
          }
        }
      };
    });
  });
