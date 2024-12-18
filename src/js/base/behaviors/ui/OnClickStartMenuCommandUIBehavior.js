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

modulum('OnClickStartMenuCommandUIBehavior', ['UIBehaviorBase'],
  function(context, cls) {
    /**
     * @class OnClickStartMenuCommandUIBehavior
     * @memberOf classes
     * @extends classes.UIBehaviorBase
     */
    cls.OnClickStartMenuCommandUIBehavior = context.oo.Singleton(cls.UIBehaviorBase, function($super) {
      return /** @lends classes.OnClickStartMenuCommandUIBehavior.prototype */ {
        /** @type {string} */
        __name: "OnClickStartMenuCommandUIBehavior",
        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          const widget = controller.getWidget();
          if (widget) {
            data.clickHandle = widget.when(gbc.constants.widgetEvents.click, this._onClick.bind(this, controller, data));
          }
        },

        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.clickHandle) {
            data.clickHandle();
            data.clickHandle = null;
          }
        },

        /**
         * Creates an action event and sends it to the VM
         */
        _onClick: function(controller, data) {
          const node = controller.getAnchorNode();
          node.getApplication().action.executeAction(node);
          context.HostLeftSidebarService.hideSidebar();
        }
      };
    });
  });
