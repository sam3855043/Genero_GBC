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

modulum('WebComponentController', ['ValueContainerControllerBase', 'ControllerFactory', 'WidgetFactory'],
  function(context, cls) {
    /**
     * @class WebComponentController
     * @memberOf classes
     * @extends classes.ValueContainerControllerBase
     */
    cls.WebComponentController = context.oo.Class(cls.ValueContainerControllerBase, function($super) {
      return /** @lends classes.WebComponentController.prototype */ {
        __name: 'WebComponentController',

        _properties: null,
        _bufferPending: false,
        _ordersManagedHandler: null,

        /**
         * Initialize behaviors of the controller
         * @private
         */
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE
          if (this.isInTable()) {
            this._addBehavior(cls.TableSizeVMBehavior);
          }
          if (!this.isInTable() || this.isInFirstTableRow()) {
            this._addBehavior(cls.LayoutInfoVMBehavior);
          }
          this._addBehavior(cls.StyleVMBehavior);
          // END WARNING

          // pseudo-selector behaviors
          this._addBehavior(cls.ActivePseudoSelectorBehavior);
          this._addBehavior(cls.DialogTypePseudoSelectorBehavior);
          if (this.isInMatrix()) {
            this._addBehavior(cls.MatrixCurrentRowVMBehavior);
          }
          this._addBehavior(cls.FontStyle4STBehavior);
          this._addBehavior(cls.FontSize4STBehavior);
          this._addBehavior(cls.FontColor4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.PropertyVMBehavior);
          this._addBehavior(cls.ComponentTypeVMBehavior);
          this._addBehavior(cls.ValuePrefixedVMBehavior);
          this._addBehavior(cls.EnabledVMBehavior);
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.TitleVMBehavior);
          this._addBehavior(cls.WebComponentStateChangedVMBehavior);
          this._addBehavior(cls.WebComponentCursorsVMBehavior);
          this._addBehavior(cls.StretchVMBehavior);

          // ui behaviors
          this._addBehavior(cls.ValueChangedUIBehavior);
          this._addBehavior(cls.RequestFocusUIBehavior);
          this._addBehavior(cls.OnActionUIBehavior);
          this._addBehavior(cls.OnDataUIBehavior);
          this._addBehavior(cls.HasWebComponentUIBehavior);
          this._addBehavior(cls.WebComponentKeyboardUIBehavior);
        },

        /**
         * @inheritDoc
         */
        constructor: function(bindings) {
          $super.constructor.call(this, bindings);
          const app = this.getAnchorNode().getApplication();

          // Webcomponent cannot be in a table!
          if (this.isInTable()) {
            app.fail("Cannot initialize table including web component");
          }

          // Once an order is managed, flush the property buffer
          if (app && app.dvm) {
            this._ordersManagedHandler = app.dvm.onOrdersManaged(function() {
              if (this._bufferPending && this.getWidget()) {
                this.getWidget().setProperty(JSON.stringify(this._properties));
                this._bufferPending = false;
              }
            }.bind(this));
          }
        },

        /**
         * Bufferize to unsure all properties are sent after a single order
         * @param {Object} properties - JSON object containing the webcomponent properties
         */
        bufferizeProperties: function(properties) {
          this._bufferPending = true;
          this._properties = Object.assign(this._properties || {}, properties);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._ordersManagedHandler) {
            this._ordersManagedHandler();
          }
          $super.destroy.call(this);
        }

      };
    });
    cls.ControllerFactory.register('WebComponent', cls.WebComponentController);
  });
