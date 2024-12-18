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

modulum('ApplicationHostWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class ApplicationHostWidget
     * @memberOf classes
     * @extends classes.WidgetGroupBase
     */
    cls.ApplicationHostWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.ApplicationHostWidget.prototype */ {
        __name: "ApplicationHostWidget",
        /**
         * left css position of the container
         * @type {?number}
         */
        _position: null,
        /**
         * @type {HTMLElement}
         */
        _centralContainer: null,
        _launcher: null,

        /**
         * @inheritDoc
         */
        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);
        },

        /**
         * @inheritDoc
         */
        _initLayout: function() {
          // no layout
        },

        /**
         * @inheritDoc
         */
        _initContainerElement: function() {
          $super._initContainerElement.call(this);
          this._centralContainer = this._element.firstElementChild;
          this._launcher = cls.WidgetFactory.createWidget('ApplicationLauncher', this.getBuildParameters());
          this._launcher.setHidden(true);
          this.addChildWidget(this._launcher);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._launcher.destroy();
          this._centralContainer = null;
          $super.destroy.call(this);
        },
        getLauncher: function() {
          return this._launcher;
        },

        /**
         *
         * @returns {classes.ApplicationHostSidebarWidget}
         */
        getCentralContainer: function() {
          return this._centralContainer;
        },
        getCentralContainerPosition: function() {
          return this._position;
        },
        /**
         *
         * @param position
         * @returns {boolean} true if position has changed
         */
        setCentralContainerPosition: function(position) {
          if (position !== this._position) {
            this._position = position;
            this._centralContainer.style.left = position + "px";
            return true;
          }
          return false;
        }
      };
    });
    cls.WidgetFactory.registerBuilder('ApplicationHost', cls.ApplicationHostWidget);
  });
