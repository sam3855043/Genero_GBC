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

modulum('WidgetPlaceholderBase', ['WidgetBase'],
  function(context, cls) {

    /**
     * Base for placeholder widget.
     * @class WidgetPlaceholderBase
     * @memberOf classes
     * @extends classes.WidgetBase
     * @publicdoc Widgets
     */
    cls.WidgetPlaceholderBase = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.WidgetPlaceholderBase.prototype */ {
        __name: 'WidgetPlaceholderBase',

        /**
         * All the virtual widgets inside the placeholder
         * @type {Map}
         */
        _children: null,

        /**
         * Position of the placeholder in his parent
         * @type {number}
         */
        _positionInParent: null,

        /**
         * Current active parent id
         * @type {number}
         */
        _activeParentId: null,

        _appliedStyle: null,

        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          this._appliedStyle = new Map();
          this._children = new Map();
          this._positionInParent = 0;
          this._activeParentId = 0;

          $super.constructor.call(this, opts);
        },

        /**
         * Get the widget key for the children map
         * @param {number} parentId
         * @param {classes.WidgetBase} widget
         * @return {string}
         * @private
         */
        _getVirtualChildrenKey: function(parentId, widget) {
          return widget === null ? parentId + "-" :
            parentId + "-" + widget.getUniqueIdentifier();
        },

        /**
         * Append a widget in the placeholder
         * @param {number} parentId
         * @param {classes.WidgetBase} widget
         */
        appendVirtualChildWidget: function(parentId, widget) {
          this.addVirtualChildWidget(parentId, widget, this._children.size);
        },

        /**
         * Set Default TTF color
         * @param {string} color - rgb formatted or css name
         */
        setDefaultTTFColor: function(color) {
          this._appliedStyle.set('setDefaultTTFColor', color);
          this._children.forEach((info) => {
            if (info.widget.setDefaultTTFColor) {
              info.widget.setDefaultTTFColor(color);
            }
          });
        },

        /**
         * Add a virtual widget in the placeholder
         * @param {number} parentId
         * @param {classes.WidgetBase} widget virtual widget to add
         * @param {number} position position in the parent widget
         */
        addVirtualChildWidget: function(parentId, widget, position) {
          const childKey = this._getVirtualChildrenKey(parentId, widget);

          widget.getElement().setAttribute("placeholderId", this.getUniqueIdentifier());

          let posInParent = this._positionInParent;

          this._children.set(childKey, {
            widget: widget,
            position: position
          });

          widget.when(context.constants.widgetEvents.destroyed, (event, widget) => {
            const key = this._getVirtualChildrenKey(parentId, widget);
            if (this._children && this._children.has(key)) {
              this._children.delete(key);
            }
          });

          let parentWidget = this.getParentWidget();
          if (parentWidget instanceof cls.ChromeBarWidget) {
            parentWidget = this;
          }

          let options = {};
          options.position = posInParent + position;

          if (this._activeParentId === parentId) {
            parentWidget.addChildWidget(widget, options);
            parentWidget.getLayoutEngine().invalidateMeasure();
            parentWidget.getLayoutEngine().forceMeasurement();
          }

          this._layoutEngine.invalidateMeasure();
          this._layoutEngine.forceMeasurement();
        },

        /**
         * @inheritDoc
         */
        addChildWidget: function(widget) {
          const element = this._element;

          element.appendChild(widget.getElement());
        },

        /**
         * @inheritDoc
         */
        removeChildWidget: function(widget) {
          widget._element.remove();
        },

        /**
         * Set placeholder the position in is parent widget
         * @param {number} position
         */
        setPositionInParent: function(position) {
          this._positionInParent = position;
        },

        /**
         * Set the active parent id (example: Menu id)
         * @param {number} parentId
         */
        setActiveParentId: function(parentId) {
          this._refreshChild(parentId);
        },

        /**
         * Get the current active parent id
         * @return {number}
         */
        getActiveParentId: function() {
          return this._activeParentId;
        },

        /**
         * Get the count of displayed widgets
         * @return {number}
         */
        getDisplayedWidgetCount: function() {
          let keyStart = this._getVirtualChildrenKey(this._activeParentId, null);
          let count = 0;
          for (let [key, info] of this._children) {
            if (key.startsWith(keyStart) /*&& !info.widget.isHidden()*/ ) {
              count++;
            }
          }

          return count;
        },

        /**
         * Refresh the DOM content of the placeholder
         * @param parentId the widgets of this parent are attached to the DOM
         * @param force
         * @private
         */
        _refreshChild: function(parentId, force) {
          if (this._activeParentId === parentId && !force) {
            return;
          }

          //Update placeholder content according to the new active widget
          let newKeyStart = this._getVirtualChildrenKey(parentId, null);
          let oldKeyStart = this._getVirtualChildrenKey(this._activeParentId, null);

          let parentWidget = this.getParentWidget();

          if (parentWidget instanceof cls.ChromeBarWidget) {
            parentWidget = this;
          }

          for (let [key, info] of this._children) {
            if (key.startsWith(oldKeyStart)) {
              parentWidget.removeChildWidget(info.widget);
            }
          }

          let posInParent = this._positionInParent;
          const options = {};
          for (let [key, info] of this._children) {
            if (key.startsWith(newKeyStart)) {
              options.position = posInParent + info.position;
              parentWidget.addChildWidget(info.widget, options);
            }
          }

          this._activeParentId = parentId;
        },

        /**
         * @inheritDoc
         */
        setFontSize: function(size) {
          this._appliedStyle.set('setFontSize', size);
          this._children.forEach((info) => {
            if (info.widget.setFontSize) {
              info.widget.setFontSize(size);
            }
          });
        },

        /**
         * @inheritDoc
         */
        setFontStyle: function(style) {
          this._appliedStyle.set('setFontStyle', style);
          this._children.forEach((info) => {
            if (info.widget.setFontStyle) {
              info.widget.setFontStyle(style);
            }
          });
        },

        /**
         * @inheritDoc
         */
        setNoBorder: function(noBorder) {
          this._appliedStyle.set('setNoBorder', noBorder);
          this._children.forEach((info) => {
            if (info.widget.setNoBorder) {
              info.widget.setNoBorder(noBorder);
            }
          });
        },

        /**
         * @inheritDoc
         */
        setButtonType: function(buttonType) {
          this._appliedStyle.set('setButtonType', buttonType);
          this._children.forEach((info) => {
            if (info.widget.setButtonType) {
              info.widget.setButtonType(buttonType);
            }
          });
        },

        /**
         * @inheritDoc
         */
        setFontColor: function(color) {
          this._appliedStyle.set('setFontColor', color);
          this._children.forEach((info) => {
            if (info.widget.setFontColor) {
              info.widget.setFontColor(color);
            }
          });
        },

        /**
         * @inheritDoc
         */
        setWrapPolicy: function(format) {
          this._appliedStyle.set('setWrapPolicy', format);
          this._children.forEach((info) => {
            if (info.widget.setWrapPolicy) {
              info.widget.setWrapPolicy(format);
            }
          });
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          $super.destroy.call(this);

          this._appliedStyle.clear();
          this._appliedStyle = null;

          if (this._children) {
            this.destroyAllChildren();
            this._children = null;
          }

        },

        /**
         * Destroy all the known children
         */
        destroyAllChildren: function() {
          this._children.forEach((info) => {
            let w = info.widget,
              realWidget = w.getAUIWidget();

            if (realWidget.removeVirtualChildWidget) {
              realWidget.removeVirtualChildWidget(w);
            }

            info.widget.destroy();
          });

          this._children.clear();
        },

        /**
         * get Virtual widget corresponding to the real one
         * @param {classes.WidgetBase} realWidget
         * @return {null|classes.WidgetBase}
         */
        getVirtualWidget: function(realWidget) {
          for (let info of this._children.values()) {
            if (info.widget.getAUIWidget() === realWidget) {
              return info.widget;
            }
          }

          return null;
        },

        applyCommonStyleToWidget: function(widget) {
          this._appliedStyle.forEach((value, methode) => {
            widget[methode](value);
          });
        }
      };
    });
  });
