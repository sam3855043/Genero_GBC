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

modulum('WidgetGroupBase', ['TextWidgetBase'],
  function(context, cls) {

    /**
     * Base class for widget group.
     * @class WidgetGroupBase
     * @memberOf classes
     * @extends classes.TextWidgetBase
     * @publicdoc Widgets
     */
    cls.WidgetGroupBase = context.oo.Class(cls.TextWidgetBase, function($super) {
      return /** @lends classes.WidgetGroupBase.prototype */ {
        __name: "WidgetGroupBase",
        __virtual: true,
        /**
         * the container element
         * @type HTMLElement
         * @protected
         */
        _containerElement: null,
        /**
         * the children widget
         * @type {classes.WidgetBase[]}
         * @protected
         */
        _children: null,
        /**
         * @inheritDoc
         */
        constructor: function(opts) {
          this._children = [];
          $super.constructor.call(this, opts);
        },
        /**
         * @inheritDoc
         */
        _afterInitElement: function() {
          $super._afterInitElement.call(this);
          this._initContainerElement();
        },

        /**
         * init the container element
         * @protected
         */
        _initContainerElement: function() {
          const elt = this._element;
          this._containerElement = elt.hasClass("containerElement") ? elt : elt.getElementsByClassName("containerElement")[0];
          if (!this._containerElement) {
            throw new Error("Widgets inheriting WidgetGroupBase must have one container with class containerElement in its template");
          }
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._containerElement = null;
          if (this._children.length > 0) {
            gbc.error(this.__name + "(uuid: " + this.getUniqueIdentifier() + ") has been destroyed whereas it still has children");
          }
          $super.destroy.call(this);
        },

        /**
         * Destroy all children widgets
         */
        destroyChildren: function() {
          const children = this.getChildren();
          if (children) {
            for (let i = children.length - 1; i > -1; i--) {
              let currentChildren = children[i];
              currentChildren.destroy();
              currentChildren = null;
            }
          }
          this._children.length = 0;
        },

        /**
         * Get the container Element
         * @return {HTMLElement} the element
         * @publicdoc
         */
        getContainerElement: function() {
          return this._containerElement;
        },

        /**
         * Add a child widget to the widget
         * @param {classes.WidgetBase} widget the widget to add
         * @param {Object=} options - possible options
         * @param {boolean=} options.noDOMInsert - won't add child to DOM
         * @param {number=} options.position - insert position
         * @param {string=} options.tag - context tag
         * @param {string=} options.mode - context mode : null|"replace"
         * @publicdoc
         */
        addChildWidget: function(widget, options) {
          options = options || {};

          if (widget._parentWidget && widget._parentWidget !== this) {
            gbc.error(this.__name + "(uuid: " + this.getUniqueIdentifier() +
              ") addChildWidget cannot be executed if child has already a parent");
          }

          let position = Object.isNumber(options.position) ? options.position : (this._children.length);
          if (options.ordered) {
            if (this._children.length > 0) {
              for (let i = this._children.length; i > 0; i--) {
                if (widget.getAuiLinkedUniqueIdentifier() < this._children[i - 1].getAuiLinkedUniqueIdentifier()) {
                  position = i - 1;
                }
              }
            }
          }

          widget.setParentWidget(this, {
            noLayoutInvalidation: Boolean(options.noDOMInsert)
          });
          if (!options.noDOMInsert) {
            this._addChildWidgetToDom(widget, position);
            widget._setDOMAttachedOrDetached();
          }
          this._children.splice(position, 0, widget);
        },

        /**
         * Add a child widget which has already a parent to the widget
         * @param {classes.WidgetBase} widget the widget to add
         * @param {Object=} options - possible options
         * @param {boolean=} options.noDOMInsert - won't add child to DOM
         * @param {boolean=} options.noLayoutInvalidation - won't refresh the layout
         * @param {number=} options.position - insert position
         * @param {string=} options.ordered - auto order item by unique auiID
         * @param {string=} options.tag - context tag
         * @param {string=} options.mode - context mode : null|"replace"
         * @publicdoc
         */
        adoptChildWidget: function(widget, options) {
          options = options || {};

          if (widget.getParentWidget()) {
            const children = widget.getParentWidget().getChildren();
            if (children) {
              children.remove(widget);
            }
          }

          let position = Object.isNumber(options.position) ? options.position : (this._children.length);

          if (options.ordered) {
            if (this._children.length > 0) {
              for (let i = this._children.length; i > 0; i--) {
                if (widget.getAuiLinkedUniqueIdentifier() < this._children[i - 1].getAuiLinkedUniqueIdentifier()) {
                  position = i - 1;
                }
              }
            }
          }
          if (!options.noDOMInsert) { // move DOM element
            this._addChildWidgetToDom(widget, position);
          } else { // just remove DOM element from previous location
            this._removeChildWidgetFromDom(widget);
          }
          widget.setParentWidget(this, {
            noLayoutInvalidation: Boolean(options.noDOMInsert) || Boolean(options.noLayoutInvalidation)
          });
          this._children.splice(position, 0, widget);

          widget._setDOMAttachedOrDetached();
        },

        /**
         * add child widget to dom
         * @param {classes.WidgetBase} widget the widget to add
         * @param {number} position where to add the widget
         * @protected
         */
        _addChildWidgetToDom: function(widget, position) {
          widget._element.insertAt(position, this._containerElement);
        },

        /**
         * Remove a child widget from this widget
         * @param {classes.WidgetBase} widget the widget to remove
         * @publicdoc
         */
        removeChildWidget: function(widget) {
          this._removeChildWidgetFromDom(widget);
          widget.setParentWidget(null);
          if (this._children) {
            this._children.remove(widget);
          }
          widget._setDOMAttachedOrDetached();
        },
        /**
         * remove child widget from dom
         * @param {classes.WidgetBase} widget the widget to remove
         * @protected
         */
        _removeChildWidgetFromDom: function(widget) {
          if (widget._element.parentNode === this._containerElement) {
            widget._element.remove();
          }
        },

        /**
         * Remove a child widget to use another widget instead
         * @param {classes.WidgetBase} oldWidget the widget to replace
         * @param {classes.WidgetBase} newWidget the widget to add
         * @publicdoc
         */
        replaceChildWidget: function(oldWidget, newWidget) {
          const index = this.getIndexOfChild(oldWidget);
          const layoutInfo = newWidget.getLayoutInformation();
          if (layoutInfo) {
            layoutInfo.setOwningGrid(oldWidget.getLayoutInformation() && oldWidget.getLayoutInformation().getOwningGrid());
          }
          this.removeChildWidget(oldWidget);
          this.addChildWidget(newWidget, {
            position: index,
            mode: "replace"
          });
        },

        /**
         * Remove all children
         * @publicdoc
         */
        empty: function() {
          const remove = this._children.slice();
          for (const element of remove) {
            this.removeChildWidget(element);
          }
        },

        /**
         * Get the child widget position
         * @param {classes.WidgetBase} widget the widget
         * @returns {number} widget position
         * @publicdoc
         */
        getIndexOfChild: function(widget) {
          return this._children.indexOf(widget);
        },

        /**
         * Get all children of this widget
         * @returns {classes.WidgetBase[]} the list of children of this widget group
         * @publicdoc
         */
        getChildren: function() {
          return this._children;
        },

        /**
         * Returns current widget (flagged with 'current' class)
         * @returns {?classes.WidgetBase} The current child
         * @publicdoc
         */
        getCurrentChildren: function() {
          for (const child of this._children) {
            if (child.getElement().hasClass("current")) {
              return child;
            }
          }
          return null;
        },

        /**
         * Returns visible children
         * @returns {classes.WidgetBase[]}
         */
        getVisibleChildren: function() {
          return this._children.filter(function(item) {
            return !item.isHidden();
          });
        },

        /**
         * Returns number of visible children
         * @returns {number}
         */
        getVisibleChildrenCount: function() {
          return this.getVisibleChildren().length;
        },

        /**
         * returns true if a WebComponent is contained in any sublevel child
         * @publicdoc
         * @returns {boolean} true if the widget has webcomponent, false otherwise
         */
        hasChildWebComponent: function() {
          return this._hasChildWebComponent; // Tell window that it has a Web Component
        },

        /**
         * Flag/unflag having child with WebComponent
         * @param {boolean} has - flag the widget as having a webcomponent
         */
        setHasChildWebComponent: function(has) {
          this._hasChildWebComponent = has;
        },

      };
    });
  });
