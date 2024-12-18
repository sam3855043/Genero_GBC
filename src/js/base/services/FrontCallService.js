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

modulum('FrontCallService', ['InitService'],
  function(context, cls) {

    /**
     * @namespace gbc.FrontCallService
     * @gbcService
     */
    context.FrontCallService = context.oo.StaticClass( /** @lends gbc.FrontCallService */ {
      __name: "FrontCallService",

      /**
       * list of available front call modules
       * @type {Object}
       * */
      modules: {},
      /**
       * currently running front call
       * @type {classes.NodeBase}
       * */
      _functionCallNode: null,

      /** @type {boolean} */
      _functionCallProcessing: false,

      /**
       * Initialize the service
       */
      init: function() {
        const lowerCasedModules = {};
        const moduleNames = Object.keys(this.modules);
        for (const moduleName of moduleNames) {
          const module = this.modules[moduleName];
          const functionNames = Object.keys(module);
          const lowerCasedModule = {};
          lowerCasedModules[moduleName.toLowerCase()] = lowerCasedModule;
          for (const functionName of functionNames) {
            lowerCasedModule[functionName.toLowerCase()] = module[functionName];
          }
        }
        this.modules = lowerCasedModules;
      },

      /**
       * Check if the module exist
       * @param {string} module - name of the frontcall module (i.e: standard, mobile ...)
       * @return {boolean}
       */
      hasModule: function(module) {
        return Boolean(this.modules[module.toLowerCase()]);
      },

      /**
       * Check if module has a frontcall
       * @param {string} module - name of the frontcall module (i.e: standard, mobile ...)
       * @param {string} name - name of the function (i.e: feinfo, openDir, playSound...)
       * @return {boolean} - true if frontcall exist in the module
       */
      hasFrontCall: function(module, name) {
        const moduleItem = this.modules[module.toLowerCase()];
        if (moduleItem) {
          return Boolean(moduleItem[name.toLowerCase()]);
        } else {
          return false;
        }
      },

      /**
       * Check if a functionCall is processing
       * @return {boolean} true if processing, false otherwise
       */
      functionCallIsProcessing: function() {
        return this._functionCallProcessing;
      },

      /**
       * Tell the service that a FrontCall is processing or not
       * @param {boolean} processing - true if processing
       */
      setFunctionCallProcessing: function(processing) {
        this._functionCallProcessing = processing;
      }

    });
    context.InitService.register(context.FrontCallService);
  });
