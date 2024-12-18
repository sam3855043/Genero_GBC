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

modulum('CanvasAbstractWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * Abstract class for canvas element widget.
     * @class CanvasAbstractWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.CanvasAbstractWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.CanvasAbstractWidget.prototype */ {
        __name: "CanvasAbstractWidget",

        /**
         * Flag for augmentedFace
         * @type {boolean}
         */
        __virtual: true,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          // can't refactorise these 2 events into MouseService because of __virtual attribute causing this widget to behave differently
          // we should probably make all Canvas related widgets inherit from this Abstract widget to be able to do something with MouseService
          this._element.on('click.CanvasAbstractWidget', this._onClick.bind(this));
          this._element.on('contextmenu.CanvasAbstractWidget', this._onContextMenu.bind(this));
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._element.off("click.CanvasAbstractWidget");
          this._element.off("contextmenu.CanvasAbstractWidget");
          $super.destroy.call(this);
        },

        /**
         * @inheritDoc
         */
        _onClick: function(event) {
          event.stopPropagation();
          event.preventCancelableDefault();
          this.emit(context.constants.widgetEvents.click, event);
        },

        /**
         * Handle contextmenu event
         * @param {*} event
         */
        _onContextMenu: function(event) {
          event.stopPropagation();
          event.preventCancelableDefault();
          this.emit(context.constants.widgetEvents.rightClick, event);
        },

        setColor: function(color) {
          this._element.setAttribute('fill', color);
        }
      };
    });
  }
);
