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

modulum('TableColumnController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class TableColumnController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.TableColumnController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.TableColumnController.prototype */ {
        __name: "TableColumnController",

        /** @type {boolean} */
        _isTreeViewColumn: false,
        /** @type {boolean} */
        _isInitiallyHidden: false,

        /**
         * @param {ControllerBindings} bindings
         */
        constructor: function(bindings) {

          let tableColumnNode = bindings.anchor;
          let tableNode = tableColumnNode.getParentNode();

          this._isTreeViewColumn = Boolean(tableNode.getFirstChild('TreeInfo')) &&
            tableNode.getFirstChild('TableColumn') === tableColumnNode;

          $super.constructor.call(this, bindings);
        },

        /**
         * @inheritDoc
         */
        _initBehaviors: function() {
          $super._initBehaviors.call(this);

          // These behaviors should stay added at first
          // WARNING : DO NOT ADD BEHAVIORS BEFORE

          // END WARNING

          // vm behaviors
          this._addBehavior(cls.EnabledVMBehavior);
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontWeightVMBehavior);
          this._addBehavior(cls.TextDecorationVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.TableColumnTextVMBehavior);
          this._addBehavior(cls.TableRowHeightVMBehavior);
          this._addBehavior(cls.AggregateVMBehavior);
          this._addBehavior(cls.TableColumnTabIndexVMBehavior);
          this._addBehavior(cls.TextAlignVMBehavior);
          this._addBehavior(cls.UnhidableVMBehavior);
          this._addBehavior(cls.UnmovableVMBehavior);
          this._addBehavior(cls.UnsizableVMBehavior);

          // ui behaviors
          this._addBehavior(cls.TableColumnHideUIBehavior);
          this._addBehavior(cls.TableColumnOrderUIBehavior);
          this._addBehavior(cls.TableColumnDndUIBehavior);
          this._addBehavior(cls.TableColumnResizeUIBehavior);

          // 4st behaviors
          this._addBehavior(cls.Reverse4STBehavior);
        },

        /**
         * @inheritDoc
         */
        _createWidget: function(type) {
          const columnNode = this.getNodeBindings().anchor;
          const widget = cls.WidgetFactory.createWidget('RTableColumn', {
            appHash: columnNode.getApplication().applicationHash,
            appWidget: columnNode.getApplication().getUI().getWidget(),
            auiTag: columnNode.getId(),
            isTreeView: this._isTreeViewColumn,
            tableWidget: columnNode.getParentNode().getController().getWidget()
          }, columnNode);

          widget.setUserWidth(this.getStoredSetting("width"));
          return widget;
        },

        /**
         * @inheritDoc
         */
        setStoredSetting: function(key, value) {
          let anchor = this.getNodeBindings().anchor;
          let columnIndex = anchor.getParentNode().getChildren("TableColumn").indexOf(anchor);
          anchor.getParentNode().getController().setStoredSetting("columns.col" + columnIndex +
            "." + key, value);
        },

        /**
         * @inheritDoc
         */
        getStoredSetting: function(key) {
          let anchor = this.getNodeBindings().anchor;
          let columnIndex = anchor.getParentNode().getChildren("TableColumn").indexOf(anchor);
          return anchor.getParentNode().getController().getStoredSetting("columns.col" + columnIndex +
            "." + key);
        },

        /**
         * Is initially hidden ?
         * @return {boolean} is initially hidden ?
         */
        isInitiallyHidden: function() {
          return this._isInitiallyHidden;
        },

        /**
         * Set if col is initially hidden
         * @param {boolean} hidden - is initially hidden ?
         */
        setInitiallyHidden: function(hidden) {
          this._isInitiallyHidden = hidden;
        }
      };
    });
    cls.ControllerFactory.register("TableColumn", cls.TableColumnController);

  });
