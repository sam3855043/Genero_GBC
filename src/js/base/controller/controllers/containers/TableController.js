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

modulum('TableController', ['ControllerBase', 'ControllerFactory'],
  function(context, cls) {
    /**
     * @class TableController
     * @memberOf classes
     * @extends classes.ControllerBase
     */
    cls.TableController = context.oo.Class(cls.ControllerBase, function($super) {
      return /** @lends classes.TableController.prototype */ {
        __name: "TableController",

        /** @type {String|null} */
        _storedSettingsKey: null,

        // specific variables used for multirow selection
        /** @type {number} */
        multiRowSelectionRoot: -1,
        /** @type {boolean} */
        updateMultiRowSelectionRoot: false,

        /** @type {boolean} */
        _isListView: false,
        /** @type {boolean} */
        _isTreeView: false,

        /** @type {boolean} */
        forceDefaultSettings: false,
        /** @type {boolean} */
        nativeVerticalScroll: true,

        /**
         * @param {ControllerBindings} bindings
         */
        constructor: function(bindings) {

          this._isListView = bindings.anchor.isListView();
          this._isTreeView = bindings.anchor.isTreeView();

          $super.constructor.call(this, bindings);
          this._initStoredSettings();
        },

        /**
         * @inheritDoc
         */
        _createWidget: function(type) {
          let parentPageWidget = null;
          const uiWidget = this.getUINode().getController().getWidget();
          const parentPageNode = this.getAnchorNode().getAncestor("Page");
          if (parentPageNode) {
            parentPageWidget = parentPageNode.getController().getWidget();
          }

          return cls.WidgetFactory.createWidget('RTable', {
            appHash: this.getAnchorNode().getApplication().applicationHash,
            appWidget: this.getAnchorNode().getApplication().getUI().getWidget(),
            auiTag: this.getAnchorNode().getId(),
            uiWidget: uiWidget,
            folderPageWidget: parentPageWidget,
            isTreeView: this._isTreeView
          }, this.getAnchorNode());
        },

        /**
         * Initialize Stored Setting
         * @private
         */
        _initStoredSettings: function() {
          const node = this.getNodeBindings().anchor;

          // Build stored settings key
          const formName = node.getAncestor("Form").attribute("name");
          const tabName = node.attribute("tabName");

          this._storedSettingsKey = "gwc.forms." + formName + ".tables." + tabName;
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

          // pseudo-selector behaviors
          this._addBehavior(cls.FocusCurrentCellPseudoSelectorBehavior);
          this._addBehavior(cls.OffsetPseudoSelectorBehavior);
          this._addBehavior(cls.Reverse4STBehavior);

          // vm behaviors
          this._addBehavior(cls.TableDialogTypeVMBehavior);
          if (this._isListView) { // This behavior creates widgets it's better to call it before other behaviors
            this._addBehavior(cls.ListViewPageSizeVMBehavior);
          }
          this._addBehavior(cls.StretchVMBehavior);
          this._addBehavior(cls.EnabledVMBehavior);
          this._addBehavior(cls.HiddenVMBehavior);
          this._addBehavior(cls.ColorVMBehavior);
          this._addBehavior(cls.BackgroundColorVMBehavior);
          this._addBehavior(cls.FontFamilyVMBehavior);
          this._addBehavior(cls.FocusOnFieldVMBehavior);
          this._addBehavior(cls.VisibleRowsVMBehavior);
          this._addBehavior(cls.TableSortVMBehavior);
          this._addBehavior(cls.TableCurrentVMBehavior);
          this._addBehavior(cls.MultiRowSelectionVMBehavior);
          this._addBehavior(cls.WantFixedPageSizeVMBehavior);
          this._addBehavior(cls.PageSizeVMBehavior);
          this._addBehavior(cls.NativeScrollVMBehavior);
          this._addBehavior(cls.FlippedVMBehavior);

          // ui behaviors
          this._addBehavior(cls.NativeScrollUIBehavior);
          this._addBehavior(cls.OnLayoutUIBehavior);
          this._addBehavior(cls.RowAndSelectionUIBehavior);
          this._addBehavior(cls.TableFrozenUIBehavior);
          this._addBehavior(cls.TableResetToDefaultUIBehavior);
          this._addBehavior(cls.RequestFocusUIBehavior);
          this._addBehavior(cls.RowActionUIBehavior);
          this._addBehavior(cls.TableSortUIBehavior);
          if (this._isTreeView) {
            this._addBehavior(cls.TreeItemKeyExpandUIBehavior);
            this._addBehavior(cls.TreeItemToggleUIBehavior);
          }
          this._addBehavior(cls.RowBoundUIBehavior);
          this._addBehavior(cls.TableDndUIBehavior);
          this._addBehavior(cls.HaveRowActionsVMBehavior);
          this._addBehavior(cls.TableClickOnContainerUIBehavior);
          // Pagination nav WIP
          //this._addBehavior(cls.ScrollOffsetUIBehavior);

          // 4st behaviors
          this._addBehavior(cls.TableType4STBehavior);
          this._addBehavior(cls.FrozenColumns4STBehavior);
          this._addBehavior(cls.TableHeader4STBehavior);
          this._addBehavior(cls.ShowGrid4STBehavior);
          this._addBehavior(cls.AllowWebSelection4STBehavior);
          this._addBehavior(cls.RowAspect4STBehavior);
          this._addBehavior(cls.Highlight4STBehavior);
          this._addBehavior(cls.Border4STBehavior);
          this._addBehavior(cls.ResizeFillsEmptySpace4STBehavior);
          this._addBehavior(cls.RowActionTrigger4STBehavior);
          this._addBehavior(cls.ReduceFilter4STBehavior);
          this._addBehavior(cls.RowHover4STBehavior);
          this._addBehavior(cls.AlternateRows4STBehavior);
          this._addBehavior(cls.DefaultTTFColor4STBehavior);
          this._addBehavior(cls.SummaryLine4STBehavior);

          // should be set before table column widgets creation
          this.forceDefaultSettings = this.getAnchorNode().getStyleAttribute('forceDefaultSettings') === "yes";

        },

        /**
         * Build row selection event
         * @param {number} row - row selected
         * @param {boolean} ctrlKey - true if ctrl key is pressed
         * @param {boolean} shiftKey - true if shift key is pressed
         * @returns {object} row selection event
         */
        buildRowSelectionEvent: function(row, ctrlKey, shiftKey) {

          const node = this.getNodeBindings().anchor;
          let startIndex = row;
          let endIndex = row;
          let mode = "set";

          if (shiftKey) {
            if (this.multiRowSelectionRoot === -1) {
              this.multiRowSelectionRoot = node.attribute('currentRow');
            }

            startIndex = this.multiRowSelectionRoot;
            endIndex = row;
            mode = ctrlKey ? "exset" : "set";

            this.updateMultiRowSelectionRoot = false;
          } else if (ctrlKey) {
            const children = node.getChildren();
            const rowInfoListNode = children[children.length - 1];
            const rowInfoNode = rowInfoListNode.getChildren()[row - node.attribute('offset')];
            mode = rowInfoNode.attribute('selected') === 1 ? "unset" : "exset";
          }

          return new cls.VMRowSelectionEvent(node.getId(), {
            startIndex: startIndex,
            endIndex: endIndex,
            selectionMode: mode
          });
        },

        /**
         * @inheritDoc
         */
        setFocus: function() {
          let widget = this.getWidget();
          if (widget.isInputMode() || widget.isInputArrayMode()) {
            widget.setFocus(); //We need to set the focus on the Table to be able to show the rowbound
            widget = this.getCurrentInternalWidget();
          } else {
            let showFilter = (widget.hasReduceFilter() && !widget.isTreeView());
            // show filter menu item from chrome bar
            let filterAttribute = this.getAnchorNode().attribute("filter");
            this.getUINode().getController().getWidget().showChromeBarFilterMenuItem(showFilter, filterAttribute);
          }

          if (widget) {
            widget.setFocus();
          }
        },

        /**
         * @inheritDoc
         */
        sendWidgetValue: function(newValue = null) {
          const valueNode = this.getAnchorNode().getCurrentValueNode(true);
          if (valueNode) {
            valueNode.getController().sendWidgetValue(newValue);
          }
        },

        /**
         * @inheritDoc
         */
        setStoredSetting: function(key, value) {
          if (this.forceDefaultSettings) {
            return null;
          } else {
            gbc.StoredSettingsService.setSettings(this._storedSettingsKey + "." + key, value);
          }
        },

        /**
         * @inheritDoc
         */
        getStoredSetting: function(key) {
          if (this.forceDefaultSettings) {
            return null;
          } else {
            return gbc.StoredSettingsService.getSettings(this._storedSettingsKey + "." + key);
          }
        },

        /**
         * Reset Stored Setting
         */
        resetStoredSetting: function() {
          if (!this.forceDefaultSettings) {
            gbc.StoredSettingsService.removeSettings(this._storedSettingsKey);
          }
        },

        /**
         * Reset specific stored setting
         * @param {string} key - key to reset
         * 
         */
        removeStoredSetting: function(key) {
          if (!this.forceDefaultSettings) {
            gbc.StoredSettingsService.removeSettings(this._storedSettingsKey + "." + key);
          }
        },

        /**
         * Returns if table should be rendered as a listview
         * @returns {boolean}
         */
        isListView: function() {
          return this._isListView;
        },

        /**
         * @inheritDoc
         */
        ensureVisible: function(executeAction) {
          const widget = this.getAnchorNode().getWidget();
          widget.emit(context.constants.widgetEvents.splitViewChange, widget);
          return $super.ensureVisible.call(this, executeAction);
        }
      };
    });
    cls.ControllerFactory.register("Table", cls.TableController);

  });
