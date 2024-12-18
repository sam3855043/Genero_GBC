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

modulum('FunctionCallController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * FunctionCallController
     * This handle any function call from the VM
     * @class FunctionCallController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.FunctionCallController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.FunctionCallController.prototype */ {
        __name: 'FunctionCallController',

        /**
         * The current file picket widget
         * @type {classes.FilePickerWidget}
         */
        _filePickerWidget: null,

        /**
         * @type {classes.BarcodeScannerWidget}
         */
        _barcodeScannerWidget: null,

        /**
         * @inheritDoc
         */
        constructor: function(bindings) {
          $super.constructor.call(this, bindings);
          context.FrontCallService.setFunctionCallProcessing(true);

          const functionCallNode = this.getAnchorNode(),
            app = functionCallNode.getApplication();

          const moduleName = functionCallNode.attribute('moduleName').toLowerCase();
          const functionName = functionCallNode.attribute('name').toLowerCase();

          if (app.applicationInfo.ignoreFrontcallModules && app.applicationInfo.ignoreFrontcallModules.indexOf(moduleName) >= 0) {
            this.setReturnValues([]);
          } else if (context.__wrapper.isNative() && !context.__wrapper.isFrontcallURForced(moduleName, functionName)) {
            context.__wrapper.frontcall(context.__wrapper.param(functionCallNode.getId(), app), function(nativeResult) {
              if (nativeResult.status === cls.VMFunctionCallEvent.success) {
                this.setReturnValues(nativeResult.result instanceof Array ? nativeResult.result : [nativeResult.result]);
              } else if (nativeResult.status === cls.VMFunctionCallEvent.unknownModule ||
                nativeResult.status === cls.VMFunctionCallEvent.unknownFunction) {
                this.browserFrontcall(moduleName, functionName, app);
              } else if (nativeResult.status === cls.VMFunctionCallEvent.stackError) {
                this.parametersError(nativeResult.errorMessage);
              } else {
                this.runtimeError(nativeResult.errorMessage);
              }
            }.bind(this));
          } else {
            this.browserFrontcall(moduleName, functionName, app);
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);

          if (this._filePickerWidget) {
            this._filePickerWidget.destroy();
          }
          if (this._barcodeScannerWidget) {
            this._barcodeScannerWidget.destroy();
          }
        },

        browserFrontcall: function(moduleName, functionName, app) {
          const module = context.FrontCallService.modules[moduleName];
          if (module) {
            const moduleFunction = module[functionName];
            if (moduleFunction) {
              const result = moduleFunction.apply(this, this._parseArgs());
              // If the return value of the front call isn't an array (undefined),
              // it is up to the front-call to invoke this.setReturnValues
              // This is to implement asynchonous front-calls
              if (Array.isArray(result)) {
                this.setReturnValues(result);
              }
            } else {
              app.scheduler.functionCallResultVMCommand(cls.VMFunctionCallEvent.unknownFunction);
            }
          } else {
            app.scheduler.functionCallResultVMCommand(cls.VMFunctionCallEvent.unknownModule);
          }
        },

        /**
         * This node doesn't need to create a widget
         * @return {null}
         * @private
         */
        _createWidget: function() {
          return null;
        },

        /**
         * Parse arguments of a functionCall
         * @return {Array} - List of the parsed parameters
         * @private
         */
        _parseArgs: function() {
          const functionCallNode = this.getAnchorNode();
          const paramNodes = functionCallNode.getChildren();
          const params = [];
          for (const paramNode of paramNodes) {
            if (paramNode.getTag() === 'FunctionCallParameter') {
              if (paramNode.attribute('isNull')) {
                params.push(null);
              } else {
                const dataType = paramNode.attribute('dataType');
                const value = paramNode.attribute('value');
                if (dataType === 'INTEGER' || dataType === 'SMALLINT') {
                  params.push(parseInt(value, 10));
                } else if (dataType === 'FLOAT' || dataType === 'DOUBLE') {
                  params.push(parseFloat(value));
                } else if (dataType === 'RECORD') {
                  params.push(JSON.parse(value));
                } else if (dataType.indexOf('ARRAY') >= 0) {
                  params.push(JSON.parse(value));
                } else {
                  params.push(value);
                }
              }
            }
          }
          return params;
        },

        /**
         * The front call may call this method if a wrong number of parameters is given
         * @param message error message
         */
        parametersError: function(message) {
          const functionCallNode = this.getAnchorNode(),
            app = functionCallNode.getApplication();
          const moduleName = functionCallNode.attribute("moduleName");
          const functionName = functionCallNode.attribute("name");
          let msg = "Wrong number of parameters when invoking '" + moduleName + "." + functionName + "'";
          if (message) {
            msg += ':\n' + message;
          }
          app.scheduler.functionCallResultVMCommand(cls.VMFunctionCallEvent.stackError, msg);
        },

        /**
         * The front call may call this method in case of runtime errors
         * @param {String} message error message
         * @param {Number?} resultCode - as defined in cls.VMFunctionCallEvent
         */
        runtimeError: function(message, resultCode) {
          const functionCallNode = this.getAnchorNode(),
            app = functionCallNode.getApplication();
          const moduleName = functionCallNode.attribute('moduleName');
          const functionName = functionCallNode.attribute('name');
          let msg = "Runtime error when invoking '" + moduleName + "." + functionName + "'";
          if (message) {
            msg += ':\n' + message;
          }
          app.scheduler.functionCallResultVMCommand(resultCode ? resultCode : cls.VMFunctionCallEvent.functionError, msg);
        },

        /**
         * Display un error message
         * @param {string} message - message to display
         */
        displayErrorMessage: function(message) {
          const application = context.SessionService.getCurrent().getCurrentApplication();
          const messageService = application.message;
          const userInterfaceNode = application.getNode(0);
          const userInterfaceWidget = userInterfaceNode.getController().getWidget();
          const msgWidget = userInterfaceWidget.getMessageWidget();
          msgWidget.setText(message);
          msgWidget.setMessageKind("error");

          messageService.addMessage("upload", msgWidget);
          messageService.handlePositions();
        },

        /**
         * The front call may call this method to set the return values in asynchronous mode
         * @param result list of result values
         */
        setReturnValues: function(result) {
          for (let i = 0; i < result.length; ++i) {
            if (typeof result[i] === 'object') {
              result[i] = JSON.stringify(result[i]);
            }
          }
          const functionCallNode = this.getAnchorNode();

          if (functionCallNode) {
            const app = functionCallNode.getApplication();
            app.scheduler.functionCallResultVMCommand(cls.VMFunctionCallEvent.success, null, result);
          }
        }
      };
    });
    cls.ControllerFactory.register('FunctionCall', cls.FunctionCallController);
  });
