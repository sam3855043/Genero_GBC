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

modulum('ControllerFactory', ['Factory'],
  function(context, cls) {
    /**
     * @namespace classes.ControllerFactory
     */
    cls.ControllerFactory = context.oo.StaticClass(function() {
      const _eventListener = new cls.EventListener();

      /**
       *
       * @type {classes.Factory}
       */
      const factory = new cls.Factory("Controller");
      return /** @lends classes.ControllerFactory */ {

        /**
         * Trigger the handler when a controller for node name kind is created
         * @param {string} kind node name
         * @param {Hook} handler - handler to trigger
         * @returns {classes.ControllerBase}
         */
        onControllerCreated: function(kind, handler) {
          return _eventListener.when(context.constants.controllerEvents.created, function(id) {
            if (handler && id.data[0] === kind) {
              handler(id.data[0], id.data[1]);
            }
          });
        },

        /**
         *
         * @param {string} id
         * @param {Function} constructor
         */
        register: function(id, constructor) {
          factory.register(id, constructor);
        },
        /**
         *
         * @param {string} id
         */
        unregister: function(id) {
          factory.unregister(id);
        },
        /**
         *
         * @param {string} id
         * @returns {classes.ControllerBase}
         */
        create: function(id, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
          const controller = factory.create(id, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);

          _eventListener.emit(context.constants.controllerEvents.created, id, controller);

          return controller;
        }

      };
    });
  });
