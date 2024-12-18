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

modulum('ValueChangedUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * Behavior which reacts when there are inputs on a widget
     * @class ValueChangedUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.ValueChangedUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.ValueChangedUIBehavior.prototype */ {
        __name: "ValueChangedUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller?.getWidget()) {
            data.valueChangedHandle = controller.getWidget().when(context.constants.widgetEvents.valueChanged, this._onValueChanged.bind(this,
              controller, data));
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.valueChangedHandle) {
            data.valueChangedHandle();
            data.valueChangedHandle = null;
          }
        },

        /**
         * Method called when the widget emits a 'valueChanged' event.
         * @param {classes.ValueContainerControllerBase} controller - widget controller
         * @param {object} data - dom event data
         * @param {object} event - dom event
         * @param {HTMLElement} sender - source element
         * @param {string} newValue - new value of the widget
         * @param {boolean} [sendValue] - if true new value must be sent to VM
         * @private
         */
        _onValueChanged: function(controller, data, event, sender, newValue, sendValue = true) {

          // 1. search if there is a dialogtouched action
          const anchorNode = controller.getAnchorNode();
          const windowNode = /** @type classes.WindowNode */ anchorNode.getAncestor("Window");
          const dialogNode = windowNode.getActiveDialog();
          let dialogTouchedNode = null;
          if (dialogNode) {
            dialogTouchedNode = dialogNode.getFirstChildWithAttribute('Action', 'name', 'dialogtouched');
          }

          // 2. if there is a dialogtouched action, execute it
          if (dialogTouchedNode && dialogTouchedNode.attribute('active') === 1) {

            anchorNode.getApplication().action.executeAction(dialogTouchedNode, {
              sendValue: true,
              newValue: newValue,
              sendValueNode: anchorNode
            });
            // The widget value is send by previous function, so no need to send it after
            sendValue = false;
          }

          // 3. send value to VM
          if (sendValue) {
            const containerNode = controller.getNodeBindings().container;
            if (!containerNode.isAttributePresent("active") || containerNode.attribute("active") === 1) {
              controller.sendWidgetCursors();
              controller.sendWidgetValue(newValue);
            }
          }

          // 4. Send Tab key if autonext
          const widget = /** @type {classes.FieldWidgetBase} */ controller.getWidget();
          if (widget.hasAutoNext() && widget.canAutoNext()) {
            controller.getAnchorNode().getApplication().keyboard.processKey("Tab");
          }
        }
      };
    });
  });
