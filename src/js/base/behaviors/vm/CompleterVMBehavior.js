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

modulum('CompleterVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * Behavior controlling the completer items
     * @class CompleterVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.CompleterVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.CompleterVMBehavior.prototype */ {
        __name: "CompleterVMBehavior",

        watchedAttributes: {
          anchor: ['value']
        },

        /**
         * Updates the widget's visibility depending on the AUI tree information
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          const completerNode = controller.getNodeBindings().completer;
          const anchorNode = controller.getAnchorNode();
          const focusedNode = anchorNode.getApplication().getFocusedVMNodeAndValue(true);
          const hasFocus = focusedNode === anchorNode;
          if (completerNode && widget) { // only display completer if widget has focus and has completer
            if (widget.addCompleterWidget) {
              widget.addCompleterWidget();
            }

            if (hasFocus) {
              let completerWidget = null;
              if (widget.getCompleterWidget) {
                completerWidget = widget.getCompleterWidget();
              }

              if (completerWidget) {

                const children = completerNode.getChildren();
                const size = completerNode.attribute("size");
                completerWidget.clearChoices();
                completerWidget.setSize(size);

                for (let i = 0; i < size; i++) {
                  completerWidget.addChoice(children[i].attribute("text"));
                }

                if (size > 0) {
                  completerWidget.showDropDown();
                } else {
                  completerWidget.hideDropDown();
                }
              }
            }
          }
        },

        /**
         * @inheritDoc
         * @protected
         */
        _attach: function(controller, data) {
          const decoratorNode = controller.getNodeBindings().decorator;

          //on new Item node
          data._onNodeCreateHandle = decoratorNode.onNodeCreated(this._onItemsCountChanged.bind(this, controller, data),
            "Item");
          data._onNodeRemoveHandle = decoratorNode.onNodeRemoved(this._onItemsCountChanged.bind(this, controller, data),
            "Item");
        },

        /**
         * Handler executed each time a node is created or removed
         * @param controller
         * @param data
         * @param event
         * @param src
         * @param node
         * @private
         */
        _onItemsCountChanged: function(controller, data, event, src, node) {
          const nodeBindings = controller.getNodeBindings();

          if (nodeBindings) {
            const completerNode = nodeBindings.completer;

            data._watchedAttributes = [{
              node: completerNode,
              attribute: 'size'
            }];
            for (const element of completerNode._children) {
              data._watchedAttributes.push({
                node: element,
                attribute: 'text'
              });
            }
            data.dirty = true;
          }

        },

        /**
         * @inheritDoc
         * @protected
         */
        _detach: function(controller, data) {
          if (data._onNodeCreateHandle) {
            data._onNodeCreateHandle();
            data._onNodeCreateHandle = null;
          }
          if (data._onNodeRemoveHandle) {
            data._onNodeRemoveHandle();
            data._onNodeRemoveHandle = null;
          }
        }
      };
    });
  });
