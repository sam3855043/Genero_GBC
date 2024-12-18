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

modulum('HVBoxSplitterWidget', ['SplitterWidget', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Splitter widget.
     * @class HVBoxSplitterWidget
     * @memberOf classes
     * @extends classes.SplitterWidget
     */
    cls.HVBoxSplitterWidget = context.oo.Class(cls.SplitterWidget, function($super) {
      return /** @lends classes.HVBoxSplitterWidget.prototype */ {
        __name: "HVBoxSplitterWidget",
        __templateName: "SplitterWidget",
        _orientation: "vertical",

        setOrientation(orientation) {
          this._orientation = orientation;
          this.toggleClass("gbc_VBoxSplitterWidget", "gbc_HBoxSplitterWidget", this._isVertical());
        },

        _isVertical() {
          return this._orientation === "vertical";
        },

        _initElement: function() {
          $super._initElement.call(this);
          this._element.addClass("gbc_SplitterWidget");
        },
        _initLayout: function() {
          $super._initLayout.call(this);
          this._layoutInformation.setMaximal(cls.Size.maximal, 8);
        },
        _onDragOver: function(evt) {
          $super._onDragOver.call(this, evt);
          this._pagePosition = this._isVertical() ? evt.pageY : evt.pageX;
        },
        _updateResizerDrag: function(evt) {
          this._pagePosition = this._isVertical() ? evt.pageY : evt.pageX;
          this._resizerDragPosition = this._isVertical() ? evt.pageY : evt.pageX;
        },

        updateSplits: function(delta) {
          // Only for HBOX
          if (!this._isVertical()) {
            if (this.isReversed()) {
              delta = -delta;
            }
          }
          $super.updateSplits.call(this, delta);
        },

        // Touch only
        _onTouchStart: function(evt) {
          this._splitStartPos = this._isVertical() ? evt.touches[0].clientY : evt.touches[0].clientX;
          $super._onTouchStart.call(this, evt);
        },

        _onTouchMove: function(evt) {
          this._pagePosition = this._isVertical() ? evt.touches[0].clientY : evt.touches[0].clientX;
          $super._onTouchMove.call(this, evt);
        },

      };
    });
    cls.WidgetFactory.registerBuilder('HVBoxSplitter', cls.HVBoxSplitterWidget);
  });
