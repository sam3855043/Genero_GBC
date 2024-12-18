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

modulum('SessionWaitingEndWidget', ['WidgetBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SessionWaitingEndWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.SessionWaitingEndWidget = context.oo.Class(cls.WidgetBase, function($super) {
      return /** @lends classes.SessionWaitingEndWidget.prototype */ {
        __name: "SessionWaitingEndWidget",

        _htmlFilter: null,

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
         * Defines header message
         * @param {string} message the header content
         * @publicdoc
         */
        setHeader: function(message) {
          this._element.getElementsByClassName("mt-card-header-text")[0].innerText = message;
        },

        /**
         * Defines message to display at the end of the session
         * @param {string} message - text to display
         * @publicdoc
         */
        setMessage: function(message) {
          const messageElt = this._element.getElementsByClassName("message")[0];
          messageElt.removeClass("hidden");
          if (!this._htmlFilter) {
            this._htmlFilter = cls.WidgetFactory.createWidget('HtmlFilterWidget', this.getBuildParameters());
          }
          messageElt.innerHTML = this._htmlFilter.sanitize(message);
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._htmlFilter) {
            this._htmlFilter.destroy();
            this._htmlFilter = null;
          }
          $super.destroy.call(this);
        },

      };
    });
    cls.WidgetFactory.registerBuilder('SessionWaitingEnd', cls.SessionWaitingEndWidget);
  });
