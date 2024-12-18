/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableColumnTextVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class TableColumnTextVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.TableColumnTextVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.TableColumnTextVMBehavior.prototype */ {
        __name: "TableColumnTextVMBehavior",

        watchedAttributes: {
          anchor: ['text']
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const widget = controller.getWidget();
          if (widget?.setTitleText) {
            const bindings = controller.getNodeBindings();
            const text = bindings.anchor.attribute('text');
            widget.setTitleText(text);
          }
        }
      };
    });
  });
