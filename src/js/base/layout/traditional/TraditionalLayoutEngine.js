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

modulum('TraditionalLayoutEngine', ['LayoutEngineBase'],
  function(context, cls) {

    /**
     * @class TraditionalLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.TraditionalLayoutEngine = context.oo.Class(cls.LayoutEngineBase, function($super) {
      return /** @lends classes.TraditionalLayoutEngine.prototype */ {
        __name: "TraditionalLayoutEngine",

        _children: null,

        /**
         * @inheritDoc
         * @constructs
         */
        constructor: function(widget) {
          $super.constructor.call(this, widget);
          this._children = [];
        },

        /**
         * @inheritDoc
         */
        registerChild: function(widget) {
          this._children.push(widget);
          const li = widget.getLayoutInformation();
          li.className = 'tgl_' + widget.getUniqueIdentifier();
          li.styleRules = {};
          li.styleRulesContent = {};
          li.styleRules['.' + li.className] = li.styleRulesContent;
        },

        /**
         * @inheritDoc
         */
        unregisterChild: function(widget) {
          this._children.remove(widget);
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          const heightpadding = parseFloat(context.ThemeService.getValue("theme-field-height-ratio"));
          const fieldheight = parseFloat(context.ThemeService.getValue("theme-field-default-height"));
          const letterSpacing = context.ThemeService.getValue("theme-traditional-mode-letter-spacing");

          for (const child of this._children) {
            child.traditionalDisplay(letterSpacing, fieldheight, heightpadding);
          }
        },

        /**
         * @inheritDoc
         */
        getRenderableChildren: function() {
          return [];
        }
      };
    });
  });
