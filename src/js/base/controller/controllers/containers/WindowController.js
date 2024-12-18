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

modulum('WindowController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class WindowController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.WindowController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.WindowController.prototype */ {
        __name: "WindowController",
        _isWidgetOwner: true,

        /** @type {String} */
        _storedSettingsKey: null,

        /** @type {Boolean} */
        forceDefaultSettings: false,

        /**
         * @inheritDoc
         */
        constructor: function(bindings) {
          $super.constructor.call(this, bindings);
          this._initStoredSettings(); // used for modal window to store position and size
        },
        /**
         * @inheritDoc
         */
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          this._addBehavior(cls.LayoutInfoVMBehavior);
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // vm behaviors
          this._addBehavior(cls.WindowTitleVMBehavior);
          this._addBehavior(cls.WindowParentVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.WindowImageVMBehavior);
          this._addBehavior(cls.TextVMBehavior);
          this._addBehavior(cls.WindowTypeVMBehavior);
          this._addBehavior(cls.CurrentTitleVMBehavior);

          // 4st behaviors
          this._addBehavior(cls.WindowState4STBehavior);
          this._addBehavior(cls.WindowOptionClose4STBehavior);
          this._addBehavior(cls.FontStyle4STBehavior);
          this._addBehavior(cls.FontSize4STBehavior);
          this._addBehavior(cls.FontColor4STBehavior);
          this._addBehavior(cls.ForceDefaultSettings4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.ToolBarPosition4STBehavior);
          this._addBehavior(cls.TopmenuRendering4STBehavior);
          this._addBehavior(cls.StartMenuPosition4STBehavior);
          this._addBehavior(cls.BackgroundImage4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);
          this._addBehavior(cls.Position4STBehavior); // to keep after Reverse4STBehavior
          this._addBehavior(cls.DefaultTTFColor4STBehavior);
          this._addBehavior(cls.AllowedOrientations4STBehavior);

          // ui behaviors
          this._addBehavior(cls.WindowCloseUIBehavior);

          this._addBehavior(cls.Sizable4STBehavior);
          this._addBehavior(cls.TabbedContainer4STBehavior);
        },

        // TODO incompatible override
        /**
         * @inheritDoc
         */
        createWidget: function() {
          const anchorNode = this.getAnchorNode(),
            application = anchorNode && anchorNode.getApplication(),
            session = application && application.getSession(),
            opts = {
              appHash: application && application.applicationHash,
              appWidget: application && application.getUI().getWidget(),
              auiTag: anchorNode.getId(),
              chromeBar: anchorNode.getParentNode().getWidget().getChromeBarWidget()
            };
          this._widget = cls.WidgetFactory.createWidget("Window", opts, anchorNode);

          context.HostService.registerClosableWindow(anchorNode, this._widget, opts);
          if (session) {
            session.getNavigationManager().addWindow(anchorNode);
          }

          if (anchorNode.isTraditional()) {
            this._widget.addClass("gbc_TraditionalContainerWindow");
          }

          this._widget.isModal = anchorNode.isModal();

          // Hack to prevent firefox to relayout and change richtext cursors
          const messageWidget = this._widget.getMessageWidget();
          messageWidget.setDummyMessage();
          this._widget.addChildWidget(messageWidget);
        },

        /**
         * @inheritDoc
         */
        setStyleBasedBehaviorsDirty: function(noUsageCheck, noRecurse, fromPseudoSelection) {
          $super.setStyleBasedBehaviorsDirty.call(this, noUsageCheck, noRecurse, fromPseudoSelection);
          this._widget.isModal = this.getAnchorNode().isModal();
        },

        /**
         * @inheritDoc
         */
        attachUI: function() {
          if (this._isWidgetOwner) {
            $super.attachUI.call(this);
          }
        },

        /**
         * @inheritDoc
         */
        detachUI: function() {
          if (this._isWidgetOwner) {
            if (this._widget && this.autoCreateWidget() && this._widget._modalWidget) {
              this._widget._modalWidget.when(context.constants.widgetEvents.close, () => {
                //Restore the window icon
                if (gbc.HostService.getCurrentWindowNode()) {
                  gbc.HostService.setDisplayedWindowNode(gbc.HostService.getCurrentWindowNode());
                }
              }, true);
            }
            $super.detachUI.call(this);
          }
        },
        /**
         * @inheritDoc
         */
        destroy: function() {
          const anchorNode = this.getAnchorNode(),
            application = anchorNode && anchorNode.getApplication(),
            session = application && application.getSession();
          if (session) {
            session.getNavigationManager().removeWindow(anchorNode);
          }
          context.HostService.unregisterClosableWindow(anchorNode);
          $super.destroy.call(this);
        },

        /**
         * Initialize Stored Setting used for modal to store position and size
         * @private
         */
        _initStoredSettings: function() {
          const node = this.getNodeBindings().anchor;
          // Build stored settings key
          const windowName = node.attribute("name");
          const appId = node.getApplication().applicationInfo.appId;
          this._storedSettingsKey = `gwc.apps.${appId}.window.${windowName}`;

          const formName = node.getFirstChild("Form")?.attribute("name");
          if (formName) {
            this._storedSettingsKey += `.forms.${formName}`;
          }

        },

        /**
         * Get the StoredSettings key to access saved info about this window
         * @return {string} - access path to stored Settings
         */
        getStoredSettingKey: function() {
          return this._storedSettingsKey;
        }
      };
    });
    cls.ControllerFactory.register("Window", cls.WindowController);

  });
