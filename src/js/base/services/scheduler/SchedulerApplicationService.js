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

modulum('SchedulerApplicationService', ['ApplicationServiceBase', 'ApplicationServiceFactory'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * Scheduler service.
     * This class is in charge of keeping track of the commands.
     * Stack commands, schedule their execution on the server
     * Manages client side life cycle representation of the node.
     * @class SchedulerApplicationService
     * @memberOf classes
     * @extends classes.ApplicationServiceBase
     */
    cls.SchedulerApplicationService = context.oo.Class(cls.ApplicationServiceBase, function($super) {
      return /** @lends classes.SchedulerApplicationService.prototype */ {
        __name: "SchedulerApplicationService",

        /** @type {classes.CommandBase[]} **/
        _commandsQueue: null,
        /** @type {classes.CommandBase[]} */
        _failedCommandsQueue: null,
        /** @type {classes.CommandBase[]} **/
        /* commands being converted and send as VM event to VM  */
        _processingCommands: null,
        /** @type {classes.CommandBase[]} */
        _commandsWhileFrontCallQueue: null,
        /** @type {number} */
        _lastCommandTime: 0,
        /** @type {boolean} */
        _isInNextCommandLoop: false,

        /** @type {classes.GroupCommand[]} */
        _currentGroupCommandQueue: null,

        /** @type {classes.LayoutCommand} */
        _layoutCommand: null,
        /** @type {classes.RestoreFocusCommand} */
        _restoreFocusCommand: null,

        /**
         * @param {classes.VMApplication} app owner
         */
        constructor: function(app) {
          $super.constructor.call(this, app);
          this._commandsQueue = [];
          this._failedCommandsQueue = [];
          this._commandsWhileFrontCallQueue = [];
          this._processingCommands = [];
          this._currentGroupCommandQueue = [];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);
          this._processingCommands = [];
          this._commandsQueue = [];
          this._failedCommandsQueue = [];
          this._commandsWhileFrontCallQueue = [];
          this._currentGroupCommandQueue = [];
          this._layoutCommand = null;
          this._restoreFocusCommand = null;
        },

        /**
         * Returns true if the scheduler has command which are executed but not yet validated
         * @returns {boolean}
         */
        hasProcessingCommands: function() {
          return this._processingCommands.length !== 0;
        },

        /**
         * Returns true if the scheduler has finished to process all post treatment commands
         * - Execute layout command
         * - Restore Focus command
         * @returns {boolean}
         */
        hasPostTreatmentCommands: function() {
          return this._restoreFocusCommand !== null || this._layoutCommand !== null;
        },

        /**
         * Empty commands in the queue
         */
        emptyCommandsQueue: function() {
          if (this._commandsQueue.length > 0 || this._commandsWhileFrontCallQueue.length > 0) {
            context.LogService.scheduler.warn("Empty commands queue.");
            this._commandsQueue.length = 0;
            this._commandsWhileFrontCallQueue.length = 0;
          }
        },

        /**
         * Returns true if the scheduler has finished to process the command queue.
         * **The command queue don't include the post treatment commands**
         * @returns {boolean}
         */
        hasNoCommandToProcess: function() {
          return !this.hasProcessingCommands() && !this.hasPendingCommands();
        },

        /**
         * Returns true if the scheduler has finished to process all commands. 
         * **Post treatment included**
         * @returns {boolean}
         */
        hasNothingToProcess: function() {
          return !this.hasNoCommandToProcess() && !this.hasPostTreatmentCommands();
        },

        /**
         * Add a command in the scheduler list
         * @param {classes.CommandBase} cmd new command to add to the list
         * @param {boolean} execute if true execute the next command
         * @param {boolean} topOfQueue if true insert the command at the beginning of the queue. Otherwise, by default it's pushed at the end.
         * @returns {classes.CommandBase} the command added in scheduler
         * @private
         */
        _addCommand: function(cmd, execute = true, topOfQueue = false) {
          if (!this._application) {
            return null;
          }
          context.LogService.scheduler.log("[app" + this._application.applicationHash + "] " + cmd.__name + " command added",
            cmd);

          if (this._currentGroupCommandQueue.length > 0) { // if there is a current group command is added to this group
            this._currentGroupCommandQueue[this._currentGroupCommandQueue.length - 1].addCommand(cmd);
          } else {
            // if only one command of this type must be added, and there is already an existing command --> do nothing
            if (cmd.isUnique() && this.hasPendingCommands(cmd.__name)) {
              return null;
            }

            // If a FrontCall is processing, queue it in a special buffer
            if (context.FrontCallService.functionCallIsProcessing()) {
              this._commandsWhileFrontCallQueue.push(cmd);
            } else {
              if (topOfQueue) {
                this._commandsQueue.unshift(cmd);
              } else {
                this._commandsQueue.push(cmd);
              }
            }

            if (execute) {
              this._start(cmd);
            }
          }
          return cmd;
        },

        /**
         * @private
         */
        _initFullQueue() {
          let finalCommandsList = this._commandsQueue.slice();
          for (const failedCmd of this._failedCommandsQueue) {
            /*
             * If the command is unique and already in the command list (that means it was called again).
             * We don't use failed command, so it reset the attempt counter
             */
            if (!(failedCmd.isUnique() && (finalCommandsList.findIndex((cmdInList) => failedCmd.__name === cmdInList.__name) !== -1))) {
              finalCommandsList.push(failedCmd);
            }
          }
          this._failedCommandsQueue = [];

          finalCommandsList = finalCommandsList.concat(this._commandsWhileFrontCallQueue);
          this._commandsWhileFrontCallQueue = [];

          return finalCommandsList;
        },

        /**
         * Store failed command if the run attempt is under the maximum limit
         * @param {BaseCommand} cmd The Command to store
         * @private
         */
        _handleFailedCommand(cmd) {
          if (cmd.retryIfFailed() && cmd.getRunAttempts() < cmd.getMaxRunAttempts()) {
            this._failedCommandsQueue.push(cmd);
          }
        },

        /**
         * Starts scheduler
         * @param {classes.CommandBase} cmd new command just added in the list
         * @private
         */
        _start: function(cmd = null) {
          if (!this._isInNextCommandLoop) { // no need to start if it is already running
            this.emit(context.constants.schedulerEvents.commandProcessStarted);
            if (cmd === null || cmd.executeImmediately()) {
              // if command is send immediately no other cmd can be added before
              this._executeNextCommand();
            } else {
              // we execute it in the next animation frame to permit to add more cmd
              window.setTimeout(() => {
                this._executeNextCommand();
              });
            }
          }
        },

        /**
         * Remove a command not yet executed
         * @param {classes.CommandBase} cmd command to be removed
         */
        _removeCommand: function(cmd) {
          this._commandsQueue.remove(cmd);
        },

        /**
         * Execute next command
         * @private
         */
        _executeNextCommand: function() {
          if (this._destroyed || !this._application) {
            // application doesn't exist anymore
            return;
          }

          const isFrontCallProcessing = context.FrontCallService.functionCallIsProcessing();
          if (isFrontCallProcessing) {
            context.LogService.scheduler.warn(
              "VM is waiting for a FrontCall response. Do not send another command vm event during that process. Waiting...");
          }
          const isProcessing = this.hasProcessingCommands() || this._application?.isProcessing() || isFrontCallProcessing;

          if (!isProcessing) { // if app is processing don't send any command
            this._commandsQueue = this._initFullQueue();

            let cmd = null;
            let events = [];

            let integrityOk = true;
            while (events.length === 0 && this._commandsQueue.length !== 0 && integrityOk) {
              this._isInNextCommandLoop = true;
              do {
                cmd = this._commandsQueue.shift();

                context.LogService.scheduler.log("Executing " + cmd.__name + " command", cmd);

                // Merge beginning commands of the FIFO into cmd;
                while (this._commandsQueue.length !== 0 && cmd.merge(this._commandsQueue[0])) {
                  this._commandsQueue.shift();
                }

                // before checkIntegrity & execute need to updateNode
                // because node can have changed between command creation and command execution
                let commandProcessed = false;
                const executeCommand = cmd.updateNode();
                if (executeCommand) {
                  integrityOk = cmd.checkIntegrity();
                  if (integrityOk) {

                    // save existing scheduler list
                    let savedCommandsQueue = this._commandsQueue.slice();
                    this._commandsQueue = [];

                    commandProcessed = cmd.execute();

                    // all the commands created during the command execution must be added at the beginning of commandsQueue
                    this._commandsQueue = this._commandsQueue.concat(savedCommandsQueue);
                    savedCommandsQueue = [];

                    if (!commandProcessed) {
                      context.LogService.scheduler.log("Popping unused " + cmd.__name + " command", cmd);
                    } else if (cmd.getVMEvents) { // cmd is a CommandVMBase
                      const vmEvents = cmd.getVMEvents();
                      if (vmEvents && vmEvents.length > 0) {
                        events = events.concat(vmEvents);
                        // if command generate vm events, add it to processingCommands list
                        this._processingCommands.push(cmd);
                      }
                    }
                  }
                } else {
                  context.LogService.scheduler.log("Poping outdated " + cmd.__name + " command", cmd);
                }

                if (!commandProcessed) {
                  /* If the integrity is already ok, keep it like that.
                   * If the integrity is not okay, set it to true if rerun failed is true.
                   * So it doesn't break the loop on a command that is okay to fail
                   */
                  integrityOk = integrityOk || cmd.retryIfFailed();
                  cmd.fail();
                }
                // End Executing cmd group

              } while (this._commandsQueue.length !== 0 && !cmd.needsVmSync() && integrityOk);
            }

            this._isInNextCommandLoop = false;

            if (integrityOk === false) {
              context.LogService.scheduler.warn("Command integrity error", cmd);
              // if there is an integrity error in a command, don't execute it and stop to execute next queued commands which become invalid (but current commands being processed added before are still valid)
              this.emptyCommandsQueue();
            }

            // If there are events to send to VM
            if (events.length !== 0 && this._processingCommands.length !== 0) {
              this._lastCommandTime = this._processingCommands[this._processingCommands.length - 1].getTime();
              context.LogService.scheduler.log("Sending events to VM", events);
              // Send commands converted into events to VM
              this._application.protocolInterface.event(events);
            }
            // End execute next command group

          }

          // if there is nothing more to process, do nothing
          this._executePostTreatmentCommand();
          if (this.hasNoCommandToProcess()) {
            /**@todo : If the setTimeout of safari is removed, move the line :
             * this.emit(context.constants.schedulerEvents.commandProcessEnded);
             */
            return;
          }
        },

        _executePostTreatmentCommand() {
          // if there is nothing more to process, execute layout command
          if (this.hasNoCommandToProcess() && this._layoutCommand) {
            this._layoutCommand.execute();
            this._layoutCommand = null;
          }

          // Do this in a setTimeout because on Safari the element.focus doesn't work at the first display of a form
          // if you try to remove it, check GBC-1362 testcase at start focus must be in the first field
          const restoreFocusFunc = () => {
            // if there is nothing more to process, execute restoreFocus command
            if (this.hasNoCommandToProcess()) {
              if (this._restoreFocusCommand) {
                this._restoreFocusCommand.execute();
                this._restoreFocusCommand = null;
              }
              // Once the restore focus is done, we consider that the scheduler has ended the process
              this.emit(context.constants.schedulerEvents.commandProcessEnded);
            }
          };
          if (window.browserInfo.isSafari) {
            window.setTimeout(restoreFocusFunc, 100); // focus doesn't seem to work well if timeout <100ms for safari
          } else {
            restoreFocusFunc();
          }
        },

        /**
         * Validate the last commands send to the VM
         * This function is called each time we received a message from VM
         * @param {boolean} isNewTask - message send by VM is a new task (new app)
         */
        validateLastCommand: function(isNewTask = false) {

          if (isNewTask) {
            // no need to anything in this case juste empty the processing commands
            this._processingCommands = [];
            return;
          }

          let needsRefreshLayout = false;
          if (this._processingCommands.length !== 0) {
            let isLastCommandValidated = true;

            let cmd = null;
            const conflictFunc = function(command) {
              if (command instanceof cls.GroupCommand && command._commands && command._commands.length) {
                command._commands = command._commands.filter(conflictFunc);
              } else {
                return command.getNode() !== cmd._conflictNode;
              }
            };
            // validate each commands
            while (this._processingCommands.length > 0) {
              cmd = this._processingCommands.shift();
              needsRefreshLayout = needsRefreshLayout || cmd.needsRefreshLayout();
              if (isLastCommandValidated) {
                isLastCommandValidated = cmd.validate();
              }

              // check conflicts with pending commands
              // remove conflictNode commands from commandsQueue
              if (cmd._conflictNode) {
                this._commandsQueue = this._commandsQueue.filter(conflictFunc);
              }
            }

            context.LogService.scheduler.log("Command(s) validation OK", this._processingCommands);
            this.restoreFocusCommand(!isLastCommandValidated);

          } else {
            context.LogService.scheduler.log("No command to validate");
            needsRefreshLayout = true;
          }

          // require layout after each command validated
          this.layoutCommand({
            noLayout: !needsRefreshLayout
          });

          // try to send next commands
          this._executeNextCommand();
        },

        /**
         * Checks if the given node has pending VALUE command in the scheduler command list
         * @param {classes.NodeBase} [node]
         * @returns {boolean}
         */
        hasPendingValueCommands: function(node = null) {
          for (const cmd of this._commandsQueue) {
            if (cmd instanceof cls.ValueVMCommand && (!node || cmd.getNode() === node)) {
              return true;
            }
          }
          return false;
        },

        /**
         * Checks if the given node has pending VALUE command in the scheduler command list
         * @param {classes.NodeBase} [node]
         * @returns {boolean}
         */
        hasPendingScrollCommands: function(node = null) {
          for (const cmd of this._commandsQueue) {
            if (cmd instanceof cls.ScrollVMCommand && (!node || cmd.getNode() === node)) {
              return true;
            }
          }
          return false;
        },

        /**
         * Returns true if processing commands queue contains at least one ScrollVMCommand
         * @param {classes.NodeBase} [node]
         * @returns {boolean}
         */
        isProcessingScrollCommand: function(node = null) {
          for (const cmd of this._processingCommands) {
            if (cmd instanceof cls.ScrollVMCommand && (!node || cmd.getNode() === node)) {
              return true;
            }
          }
          return false;
        },

        /**
         * Returns true if there are some scroll commands in the commands queue or if a scroll command is processing
         * @param {classes.NodeBase} [node]
         * @returns {boolean}
         */
        hasScrollCommandsToProcess(node = null) {
          return this.isProcessingScrollCommand(node) || this.hasPendingScrollCommands(node);
        },

        /**
         * Checks if the given node has pending FOCUS command in the scheduler command list
         * @param {classes.NodeBase} [node]
         * @returns {boolean}
         */
        hasPendingFocusCommands: function(node = null) {
          for (const cmd of this._commandsQueue) {
            if (cmd instanceof cls.FocusVMCommand && (!node || cmd.getNode() === node)) {
              return true;
            }
          }
          return false;
        },

        /**
         * Checks if the given node has pending navigation command in the scheduler command list
         * @returns {boolean}
         */
        hasPendingNavigationCommands: function() {
          for (const cmd of this._commandsQueue) {
            if ((cmd instanceof cls.CurrentRowVMCommand || cmd instanceof cls.FocusVMCommand) && (cls.ActionNode
                .isTableNavigationAction(
                  cmd._actionName) || cls.ActionNode.isFieldNavigationAction(cmd._actionName))) {
              return true;
            }
          }
          return false;
        },

        /**
         * Checks if the given node has pending FunctionCallResult command in the scheduler command list
         * @param {boolean} [processing] - check also if there is a frontcall command in processing commands list
         * @returns {boolean}
         */
        hasPendingFunctionCallResultCommands: function(processing) {
          let i;
          let cmd;
          for (i = 0; i < this._commandsQueue.length; ++i) {
            cmd = this._commandsQueue[i];
            if (cmd instanceof cls.FunctionCallResultVMCommand) {
              return true;
            }
          }
          if (processing) {
            for (i = 0; i < this._processingCommands.length; ++i) {
              cmd = this._processingCommands[i];
              if (cmd instanceof cls.FunctionCallResultVMCommand) {
                return true;
              }
            }
          }
          return false;
        },

        /**
         * Checks if there are pending commands in the scheduler
         * @param {String} [classname] - class name of the command
         * @returns {boolean}
         */
        hasPendingCommands: function(classname) {
          if (!classname) {
            return this._commandsQueue.length > 0;
          } else {
            for (const cmd of this._commandsQueue) {
              if (cmd.__name === classname) {
                return true;
              }
            }
          }
          return false;
        },

        /**
         * @returns {number} the creation time of the last executed command
         */
        getLastCommandTime: function() {
          return this._lastCommandTime;
        },

        // ============== START - SPECIFIC COMMANDS ===================

        /**
         * Request focus on the given node
         * @param {classes.NodeBase} node - node which should get the focus
         * @param {number} [cursor1] - current starting cursor of the node
         * @param {number} [cursor2] - current ending cursor of the node
         * @param {number} [rowIndex] - hint for current row index requested
         */
        focusVMCommand: function(node, cursor1, cursor2, rowIndex) {
          return this._addCommand(new cls.FocusVMCommand(this.getApplication(), node, cursor1, cursor2, rowIndex));
        },

        /**
         * Send value on the given node
         * @param {classes.NodeBase} node - target node
         * @param {string} value - current value of the node
         * @param {boolean} [vmSync] - by default command value requires a VM sync
         */
        valueVMCommand: function(node, value, vmSync = true) {
          // If the value command is part of a GroupCommand, it's canBeExecuted should return false
          const canBeExecuted = this._currentGroupCommandQueue.length === 0;
          return this._addCommand(new cls.ValueVMCommand(this.getApplication(), node, value, canBeExecuted, vmSync));
        },

        /**
         * Send cursors of a given node
         * @param {classes.NodeBase} node - target node
         * @param {number} cursor1 - current starting cursor of the node
         * @param {number} cursor2 - current ending cursor of the node
         * @param {number} valueLength - node value length
         */
        cursorsVMCommand: function(node, cursor1, cursor2, valueLength) {
          // If the value command is part of a GroupCommand, it's canBeExecuted should return false
          const canBeExecuted = this._currentGroupCommandQueue.length === 0;
          return this._addCommand(new cls.CursorsVMCommand(this.getApplication(), node, cursor1, cursor2, valueLength, canBeExecuted));
        },

        /**
         * Send scroll change command. During a scroll
         * @param {classes.TableNode|classes.MatrixNode} node
         * @param {number} offset
         */
        scrollVMCommand: function(node, offset) {
          return this._addCommand(new cls.ScrollVMCommand(this.getApplication(), node, offset));
        },

        /**
         * Send pageSize change command.
         * @param {classes.TableNode} node
         * @param {number} pageSize
         * @param {number} bufferSize
         */
        pageSizeVMCommand: function(node, pageSize, bufferSize) {
          return this._addCommand(new cls.PageSizeVMCommand(this.getApplication(), node, pageSize, bufferSize));
        },

        /**
         * Send currentRow change command
         * @param {classes.TableNode|classes.MatrixNode} node
         * @param {string} actionName
         * @param {boolean} [ctrlKey] - ctrlKey pressed during command creation
         * @param {boolean} [shiftKey] - shiftKey pressed during command creation
         */
        currentRowVMCommand: function(node, actionName, ctrlKey, shiftKey) {
          return this._addCommand(new cls.CurrentRowVMCommand(this.getApplication(), node, actionName, ctrlKey, shiftKey));
        },

        /**
         * Send rowSelection change command
         * @param {classes.TableNode} node
         * @param {boolean} ctrlKey
         * @param {boolean} shiftKey
         * @param {number} type - type of row selection (merge, toggle, selectAll)
         * @param {string} [actionName] - actionName used to change current row
         */
        rowSelectionVMCommand: function(node, ctrlKey, shiftKey, type, actionName) {
          return this._addCommand(new cls.RowSelectionVMCommand(this.getApplication(), node, ctrlKey, shiftKey, type, actionName));
        },

        /**
         * Send action command
         * @param {classes.NodeBase} node
         * @param {Object} [options] - add options
         * @param {Boolean} [options.noUserActivity] - true if action is not from a user interaction
         * @param {String} [options.actionName] - action name instead of id
         */
        actionVMCommand: function(node, options = {}) {
          return this._addCommand(new cls.ActionVMCommand(this.getApplication(), node, options));
        },

        /**
         * Send a front call result
         * @param status front call result status
         * @param message front call result status message
         * @param values front call result values
         */
        functionCallResultVMCommand: function(status, message, values) {
          return this._addCommand(new cls.FunctionCallResultVMCommand(this.getApplication(), status, message, values), true, true);
        },

        /**
         * Send VM event command
         * @param {classes.VMEventBase} event
         * @param {classes.NodeBase} [node]
         * @param {boolean} [needsVmSync]
         */
        eventVMCommand: function(event, node, needsVmSync = false) {
          const cmd = new cls.EventVMCommand(this.getApplication(), event, node);
          cmd.setNeedsVmSync(needsVmSync);
          return this._addCommand(cmd);
        },

        /**
         * Send layout command.
         * @param {Object} opts
         */
        layoutCommand: function(opts = {}) {
          if (this._application) {
            const cmd = new cls.LayoutCommand(this.getApplication(), opts);
            context.LogService.scheduler.log("[app" + this._application.applicationHash + "] " + cmd.__name + " command set",
              cmd);
            if (this._layoutCommand === null) {
              this._layoutCommand = cmd;
            } else {
              this._layoutCommand.merge(cmd);
            }
            this._start(cmd);
            return cmd;
          }
          return null;
        },

        /**
         * Send restore focus command.
         */
        restoreFocusCommand: function(restoreDOMFocus) {
          if (this._application) {
            const cmd = new cls.RestoreFocusCommand(this.getApplication(), restoreDOMFocus);
            context.LogService.scheduler.log("[app" + this._application.applicationHash + "] " + cmd.__name + " command set",
              cmd);
            if (this._restoreFocusCommand === null) {
              this._restoreFocusCommand = cmd;
            } else {
              this._restoreFocusCommand.merge(cmd);
            }
            this._start(cmd);
            return cmd;
          }
          return null;
        },

        /**
         * Add a delayedKey command
         * @param {String} keyString string corresponding to the key
         * @param {Event} keyEvent
         */
        delayedKeyCommand: function(keyString, keyEvent) {
          return this._addCommand(new cls.DelayedKeyCommand(this.getApplication(), keyString, keyEvent));
        },

        /**
         * Add a delayedMouseClick command
         * @param {classes.WidgetBase} widget - widget where we must replay the event
         * @param {Event} mouseEvent
         */
        delayedMouseClickCommand: function(widget, mouseEvent) {
          return this._addCommand(new cls.DelayedMouseClickCommand(this.getApplication(), widget, mouseEvent));
        },

        /**
         * Add an open drop down command
         * @param {classes.NodeBase} node
         */
        openDropDownCommand: function(node) {
          return this._addCommand(new cls.OpenDropDownCommand(this.getApplication(), node));
        },

        /**
         * Add a native back command
         * @param {String[]} actionList list of actions
         */
        nativeBackCommand: function(actionList) {
          return this._addCommand(new cls.NativeBackCommand(this.getApplication(), actionList));
        },

        /**
         * Add a clipboard command for paste
         * @param {String} textToPaste text to paste
         * @param {classes.WidgetBase} widget
         */
        clipboardPasteCommand: function(textToPaste, widget) {
          return this._addCommand(new cls.ClipboardPasteCommand(this.getApplication(), textToPaste, widget));
        },

        /**
         * Add a clipboard command for cut
         * @param {classes.WidgetBase} widget
         */
        clipboardCutCommand: function(widget) {
          return this._addCommand(new cls.ClipboardCutCommand(this.getApplication(), widget));
        },

        /**
         * Add a native close command
         */
        nativeCloseCommand: function() {
          return this._addCommand(new cls.NativeCloseCommand(this.getApplication()));
        },

        /**
         * Add a native notificationpushed command
         */
        nativeNotificationPushedCommand: function() {
          return this._addCommand(new cls.NativeNotificationPushedCommand(this.getApplication()));
        },

        /**
         * Add a native notificationselected command
         */
        nativeNotificationSelectedCommand: function() {
          return this._addCommand(new cls.NativeNotificationSelectedCommand(this.getApplication()));
        },

        /**
         * Add a enterbackground command
         */
        enterBackgroundCommand: function() {
          return this._addCommand(new cls.EnterBackgroundCommand(this.getApplication()));
        },

        /**
         * Add a enterforeground command
         */
        enterForegroundCommand: function() {
          return this._addCommand(new cls.EnterForegroundCommand(this.getApplication()));
        },

        /**
         * Add a native cordovacallback command
         */
        nativeCordovaCallbackCommand: function() {
          return this._addCommand(new cls.NativeCordovaCallbackCommand(this.getApplication()));
        },

        /**
         * Add a callback command
         * @param {function} callback - function to call when command is executed
         * @return {classes.CallbackCommand} callback command created
         */
        callbackCommand: function(callback) {
          return this._addCommand(new cls.CallbackCommand(this.getApplication(), callback));
        },

        /** Start group command.
         *  all commands added between call of startGroupCommand() and finishGroupCommand()
         *  will be added in a group command.
         */
        startGroupCommand: function() {
          const groupCommand = new cls.GroupCommand(this.getApplication(), [], null);
          this._currentGroupCommandQueue.push(groupCommand);
          context.LogService.scheduler.log("[app" + this._application.applicationHash + "] Start command group", groupCommand);
          return groupCommand;
        },

        /** Finish group command and add it in the scheduler queue.
         */
        finishGroupCommand: function() {
          const groupCommand = this._currentGroupCommandQueue.pop();
          context.LogService.scheduler.log("[app" + this._application.applicationHash + "] Finish command group", groupCommand);
          this._addCommand(groupCommand);
        },

        // ============== END - SPECIFIC COMMANDS ===================

        /**
         * Attach the hook function to schedulerProcessStarted event.
         * That is emitted once the start function is triggered.
         * @param {Function} hook the hook
         * @param {boolean} [once] true to free handle after first call
         * @return {HandleRegistration} the event handle
         */
        schedulerProcessStartedEvent: function(hook, once) {
          return this.when(context.constants.schedulerEvents.commandProcessStarted, hook, once);
        },

        /**
         * Attach the hook function to schedulerProcessEnded event.
         * That is emitted once the layout and focus had been restored.
         * @param {Function} hook the hook
         * @param {boolean} [once] true to free handle after first call
         * @return {HandleRegistration} the event handle
         */
        schedulerProcessEndedEvent: function(hook, once) {
          return this.when(context.constants.schedulerEvents.commandProcessEnded, hook, once);
        }
      };
    });
    cls.ApplicationServiceFactory.register("Scheduler", cls.SchedulerApplicationService);
  }
);
