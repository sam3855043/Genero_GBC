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

modulum('WindowNode', ['StandardNode', 'NodeFactory'],
  function(context, cls) {
    /**
     * @class WindowNode
     * @memberOf classes
     * @extends classes.StandardNode
     */
    cls.WindowNode = context.oo.Class(cls.StandardNode, function($super) {
      return /** @lends classes.WindowNode.prototype */ {

        __name: "WindowNode",

        /** @type {string} */
        _title: null,
        /** @type {string} */
        _icon: null,
        /** @type {?number} */
        _parentWindowId: null,

        /** @type {boolean} */
        _isModal: null,

        /** @type {boolean} */
        _isDestroying: false,

        /**
         * @inheritDoc
         */
        constructor: function(parent, tag, id, attributes, app) {
          $super.constructor.call(this, parent, tag, id, attributes, app);
          this._isDestroying = false;
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._isDestroying = true;
          $super.destroy.call(this);
        },

        /**
         * Get the window title
         * @returns {string}
         */
        getTitle: function() {
          return this._title;
        },

        /**
         * Set the window title
         * @param {string} title
         */
        setTitle: function(title) {
          this._title = title;
          this.emit(context.constants.widgetEvents.titleChanged, title);
        },

        /**
         * Get the window icon
         * @returns {string}
         */
        getIcon: function() {
          return this._icon;
        },

        /**
         * Set the window icon
         * @param {string} icon
         */
        setIcon: function(icon) {
          this._icon = icon;
          const widget = this.getWidget();
          if (widget) {
            widget.setImage(icon);
          }
          this.emit(context.constants.widgetEvents.iconChanged, icon);
        },

        /**
         * Return whether this window is the current one in the application or not
         * @returns {boolean}
         */
        isCurrentWindowNode: function() {
          const uiNode = this.getApplication().getNode(0);
          return uiNode.attribute('currentWindow') === this.getId();
        },

        /**
         * Is this window in traditional mode
         * @returns {boolean}
         */
        isTraditional: function() {
          const uiNode = this.getApplication().getNode(0);
          const winStyle = this.attribute("style");

          // Traditional mode is not applied on dialog (as GDC)
          if (uiNode.attribute("uiMode") === "traditional" && winStyle !== 'dialog') {
            const formNode = this.getFirstChild("Form");
            if (formNode) {
              const screenNode = formNode.getFirstChild("Screen");
              if (screenNode) {
                return true;
              }
            }
          }
          return false;
        },

        /**
         * Get the first traditional window
         * @returns {null|classes.WindowNode}
         */
        getFirstTraditionalWindow: function() {
          const children = this.getApplication().getNode(0).getChildren();
          for (const child of children) {
            if (child.getTag() === "Window" && child.isTraditional()) {
              return child;
            }
          }
          return null;
        },

        /**
         * Get the active dialog
         * @returns {classes.NodeBase}
         */
        getActiveDialog: function() {
          const length = this._children.length;
          for (let i = length - 1; i >= 0; --i) {
            const child = this._children[i];
            if (child._tag === 'Menu' || child._tag === 'Dialog') {
              if (child.attribute('active') === 1) {
                return child;
              }
            }
          }
        },

        /**
         * Is this window modal
         * @returns {boolean}
         */
        isModal: function() {
          if (this._isDestroying) {
            return this._isModal;
          }

          const windowTypeAttr = this.getStyleAttribute("windowType");
          this._isModal = windowTypeAttr === "modal" ||
            windowTypeAttr === "popup" ||
            (windowTypeAttr === "modalOnLargeScreen" && gbc.ThemeService.getMediaString() === "large");
          return this._isModal;
        },

        _setProcessingStyle: function(processing) {
          const widget = this._controller && this._controller.getWidget();
          if (widget?._setProcessingStyle) {
            widget._setProcessingStyle(processing);
          }
        },

        /**
         * Set the parent window identifier
         * @param {number} parentWindowId identifier o17f the parent window
         */
        setParentWindowId: function(parentWindowId) {
          this._parentWindowId = parentWindowId;
        },

        /**
         * Get the parent window identifier
         * @return {number} - the id of the parent window
         */
        getParentWindowId: function() {
          return this._parentWindowId;
        },

        /**
         * Get the pasent window when modal
         * @returns {null|classes.WindowNode}
         */
        getParentNodeWhenModal: function() {
          if (this.isModal() && this.getParentWindowId() > 0) {
            return this.getParentNode().getFirstChildWithId(this.attribute("parent"));
          }
          return null;
        }
      };
    });
    cls.NodeFactory.register("Window", cls.WindowNode);
  });
