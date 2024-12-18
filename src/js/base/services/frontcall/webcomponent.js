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

modulum('FrontCallService.modules.webcomponent', ['FrontCallService'],
  function(context, cls) {
    /**
     * Service to handle Webcomponent's FrontCalls
     * @instance webcomponent
     * @memberOf gbc.FrontCallService.modules
     */
    context.FrontCallService.modules.webcomponent = /** @lends gbc.FrontCallService.modules.webcomponent */ {

      /**
       * Call a method inside the webcomponent
       */
      call: function() {
        if (arguments.length > 1) {
          const webComponentTarget = arguments[0];
          const functionName = arguments[1];

          const parameters = new Array(arguments.length - 2);
          for (let i = 2; i < arguments.length; ++i) {
            parameters[i - 2] = arguments[i];
          }

          // Once we've managed Orders
          const orderManagedHandle = this.getAnchorNode().getApplication().dvm.onOrdersManaged(function() {
            orderManagedHandle();
            const app = this.getAnchorNode().getApplication();

            //search for the target Node
            const currentWindow = app.getNode(app.uiNode().attribute('currentWindow'));
            const forms = currentWindow.getChildren('Form');
            let currentForm;
            for (let i = forms.length - 1; i >= 0; --i) {
              const form = forms[i];
              if (!form.attribute('hidden')) {
                currentForm = form;
                break;
              }
            }
            if (!currentForm) {
              const componentName = this.getAnchorNode().getChildren()[0].attribute("value");
              this.runtimeError('Can\'t find component: ' + componentName, cls.VMFunctionCallEvent.functionError);
              return;
            }
            const targetNode = currentForm.findNodeWithAttribute('FormField', 'name', webComponentTarget);

            const widget = targetNode.getController().getWidget();

            const process = function(widget, functionName, parameters) {
              let ret = '';
              try {
                const fct = widget._iframeElement.contentWindow[functionName];
                if (typeof(fct) === 'function') {
                  ret = fct.apply(null, parameters);
                } else {
                  this.runtimeError('No function [' + functionName + '] defined in this webcomponent.', cls.VMFunctionCallEvent
                    .unknownFunction);
                  return;
                }
              } catch (e) {
                this.runtimeError(e.message);
                return;
              }
              this.setReturnValues([ret]);
            }.bind(this);

            // If the webcomponent is ready
            if (widget._isReady) {
              process(widget, functionName, parameters);
            } else {
              // Otherwise, we wait that it becomes ready
              const readyHandle = widget.when(context.constants.widgetEvents.ready, function() {
                readyHandle();
                process(widget, functionName, parameters);
              }.bind(this));
            }
          }.bind(this));
        } else {
          this.runtimeError('No webcomponent or function name provided');
        }
      },

      /**
       * Get the frontcall Api version
       * @returns {string[]}
       */
      frontCallAPIVersion: function() {
        return [cls.WebComponentWidget.gICAPIVersion];
      },

      /**
       * Get the window title of the webcomponent
       * @param webComponentTarget
       * @returns {string[]}
       */
      getTitle: function(webComponentTarget) {
        if (webComponentTarget) {
          const targetNode = this.getAnchorNode().getApplication().model.getNodeByAttribute('name', webComponentTarget);
          const domElement = targetNode.getController().getWidget()._iframeElement;
          try {
            return [domElement.contentWindow.document.title];
          } catch (e) {
            this.runtimeError(e.message);
          }
        } else {
          this.runtimeError('No webcomponent name provided');
        }
      }
    };
  }
);
