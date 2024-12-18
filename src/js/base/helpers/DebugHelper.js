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

modulum('DebugHelper',
  function(context, cls) {
    /**
     *
     * @class DebugHelper
     * @memberOf classes
     */
    cls.DebugHelper = context.oo.StaticClass(function() {
      return /** @lends classes.DebugHelper */ {
        activateDebugHelpers: function() {
          if (!window.gbcNode) {
            /**
             *
             * @param elementOrIdRef
             * @return {classes.NodeBase}
             */
            window.gbcNode = this.gbcNode;
          }
          if (!window.gbcJsonAui) {
            /**
             * Return Json formatted AUI tree
             * @param {number} nodeId - node to start aui display from
             * @param {Object} aui - not used yet, for future optim
             * @return {{}|{children: *, attributes: *, id: *, tag: *}|{attributes: *, id: *, tag: *}}
             */
            window.gbcJsonAui = this.getJsonAui;
          }
          if (!window.gbcController) {
            window.gbcController = function(elementOrIdRef) {
              const node = window.gbcNode(elementOrIdRef);
              return node ? node.getController() : null;
            };
          }
          if (!window.gbcWidget) {
            /**
             *
             * @param elementOrIdRef
             * @returns {classes.WidgetBase}
             */
            window.gbcWidget = function(elementOrIdRef) {
              const controller = window.gbcController(elementOrIdRef);
              return controller ? controller.getWidget() : null;
            };
          }
          if (!window.gbcMeasuring) {
            /**
             * Switch from g_measured to g_measuring layout and conversely on each element
             * @param {boolean} b - if true g_measured to g_measuring else g_measuring to g_measured
             */
            window.gbcMeasuring = function(b = true) {
              const list = document.getElementsByClassName(b ? "g_measured" : "g_measuring");
              for (const elem of list) {
                if (b) {
                  elem.removeClass("g_measured").addClasses("g_measuring", "__debug");
                } else {
                  elem.addClass("g_measured").removeClass("g_measuring").removeClass("__debug");
                }
              }
            };
          }
        },
        gbcNode: function(elementOrIdRef) {
          if (typeof(elementOrIdRef) === 'object') {
            let element = elementOrIdRef;
            while (element) {
              const classList = element.classList;
              for (const cls of classList) {
                if (cls.startsWith("aui__")) {
                  const id = parseInt(cls.substr(5), 10);
                  return context.SessionService.getCurrent().getCurrentApplication().getNode(id);
                }
              }
              element = element.parentElement;
            }
            return null;
          } else {
            return context.SessionService.getCurrent().getCurrentApplication().getNode(elementOrIdRef);
          }
        },
        getJsonAui: function(nodeId = 0, aui = {}) {
          const {
            _id,
            _attributes,
            _children,
            _tag
          } = {
            ...cls.DebugHelper.gbcNode(nodeId)
          };
          // out if node isn't found
          if (_id === null || (typeof _id === 'undefined')) {
            return {};
          }
          //out of recursive if leaf
          if (_children.length <= 0) {
            return {
              id: _id,
              tag: _tag,
              attributes: _attributes
            };
          }
          return {
            id: _id,
            tag: _tag,
            attributes: _attributes,
            // jshint ignore:start
            // spread is not ES9 compliant
            children: _children.reduce((a, child) => ({
              ...a,
              [child._id]: cls.DebugHelper.getJsonAui(child._id, aui)
            }), {})
            // jshint ignore:end
          };
        }
      };
    });
  });
