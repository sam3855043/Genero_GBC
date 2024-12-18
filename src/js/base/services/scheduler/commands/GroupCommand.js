/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('GroupCommand', ['CommandBase'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Group of commands
     * @class GroupCommand
     * @memberOf classes
     * @extends classes.CommandBase
     */
    cls.GroupCommand = context.oo.Class(cls.CommandBase, function($super) {
      return /** @lends classes.GroupCommand.prototype */ {
        __name: "GroupCommand",

        /** @type {classes.CommandBase[]} */
        _commands: null,

        /** @function */
        _executionFunc: null,

        /**
         * @param {classes.VMApplication} app owner
         * @param {classes.CommandBase[]} commands - list of command
         * @param {function} func - execution function, if func() return true all commands are executed else nothing is done
         */
        constructor: function(app, commands, func) {
          $super.constructor.call(this, app, null);
          this._commands = commands;
          this._executionFunc = func;

          this._executeImmediately = true;
        },

        /**
         * Add a command in the group.
         * Last command added is used to know if all commands of the group can be executed
         * @param {classes.CommandBase} cmd - command to be added
         */
        addCommand: function(cmd) {
          if (!this._commands) {
            this._commands = [];
          }
          this._commands.push(cmd);

          this._executionFunc = cmd.canBeExecuted.bind(cmd);
          this.canBeExecuted = cmd.canBeExecuted.bind(cmd);
        },

        /**
         * @inheritDoc
         */
        checkIntegrity: function() {
          // if one command of the group is false all the group must be rejected
          for (let i = 0; i < this._commands.length; i++) {
            const cmd = this._commands[i];
            if (cmd.checkIntegrity() === false) {
              return false;
            }
          }
          return true;
        },

        /**
         * @inheritDoc
         */
        execute: function() {
          if (this._executionFunc && this._executionFunc()) {
            while (this._commands.length !== 0) {
              const cmd = this._commands.shift();
              // only last command of a group can require a vm sync
              if (cmd.setNeedsVmSync) {
                cmd.setNeedsVmSync(this._commands.length === 0 && cmd.needsVmSync());
              }
              this._app.scheduler._addCommand(cmd, this._commands.length === 0);
            }
            return true;
          } else {
            return false;
          }
        }
      };
    });
  }
);
