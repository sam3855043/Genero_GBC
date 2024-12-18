/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum("ColorPickerWidget", ["FieldWidgetBase", "WidgetFactory"],
  function (context, cls) {

    // Import external js library in document. Only done once for all ColorPickerWidget instances


    cls.ColorPickerWidget = context.oo.Class(cls.FieldWidgetBase, function ($super) {
      return {
        __name: "ColorPickerWidget",
        _colorPicker: null,
        _animationFrameOffset: 0,

        /**
         * Each widget needs its layout engine & layout information instance
         * @private
         */
        _initLayout: function () {
          if (!this._ignoreLayout) {
            this._layoutInformation = new cls.LayoutInformation(this);
            this._layoutEngine = new cls.LeafLayoutEngine(this);
            this._layoutInformation.setReservedDecorationSpace(2);
          }
        },

        /**
         * Value received from VM
         * @param value
         * @param force
         */
        setValue: function (value, fromVM) {
          $super.setValue.call(this, value, fromVM);
          if (this._colorPicker) {
            this._colorPicker.setColor(value);
          }
        },

        /**
         * Called on click right before sending value to the VM
         * @returns {string} the displayed value
         */
        getValue: function () {
          return this._colorPicker && this._colorPicker.colorHex;
        },

        /**
         * Initialize our colorpicker library and emit a click event when a color has been picked.
         * @private
         */
        _initColorPicker: function () {
          if (!this._colorPicker && this._element) {
            this._colorPicker = window.tinycolorpicker(this._element);

            this._element.on("change", function (event) {
              this._onRequestFocus(event); // request focus
              this.setEditing(true);
              this.emit(context.constants.widgetEvents.click, event);
            }.bind(this));
          }
        },

        /**
         * This protected method is called for each widget when they are added in DOM.
         * We redefine the method to add add
         * @protected
         */
        _setDOMAttachedOrDetached: function () {
          $super._setDOMAttachedOrDetached.call(this);

          // 'window.requestionAnimationFrame' waits browser is ready with painting
          if (this._animationFrameOffset) {
            this._clearAnimationFrame(this._animationFrameOffset);
          }
          this._animationFrameOffset = this._registerAnimationFrame(function () {
            this._animationFrameOffset = 0;
            this._initColorPicker();
          }.bind(this));
        },

        /**
         * Destroy colorpicker instances and unbind events
         */
        destroy: function() {
          this._element.off("change");
          this._colorPicker = null;
          $super.destroy.call(this);
        },

      };
    });
    /**
     * Register our custom widget 'colorpicker_demo' as a replacement of the default ButtonEdit widget for all ButtonEdit having style='colorpicker_demo'
     */
    cls.WidgetFactory.registerBuilder("ButtonEdit.colorpicker_demo", cls.ColorPickerWidget);
  });