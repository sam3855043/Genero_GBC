/// FOURJS_START_COPYRIGHT(D,2022)
/// Property of Four Js*
/// (c) Copyright Four Js 2022, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('RowBoundUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * Handling rowbound
     *
     *
     * @class RowBoundUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.RowBoundUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.RowBoundUIBehavior.prototype */ {
        /** @type {string} */
        __name: "RowBoundUIBehavior",

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller?.getWidget()) {
            data.rowBoundMenuHandle = controller.getWidget()
              .when(
                gbc.constants.widgetEvents.rowBoundMenu,
                this._onRowBoundMenu.bind(this, controller, data)
              );
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.rowBoundMenuHandle) {
            data.rowBoundMenuHandle();
            data.rowBoundMenuHandle = null;
          }
        },

        /**
         * Create a scheduler command to open rowbound menu
         * @param controller
         * @param data
         * @private
         */
        _onRowBoundMenu: function(controller, data) {
          let widget = controller.getWidget();
          if (widget?.getRowBoundMenu) {
            let anchorNode = controller.getAnchorNode();
            let app = anchorNode.getApplication();
            app.scheduler.callbackCommand(widget.getRowBoundMenu().show.bind(widget.getRowBoundMenu()));
          }
        }
      };
    });
  });
