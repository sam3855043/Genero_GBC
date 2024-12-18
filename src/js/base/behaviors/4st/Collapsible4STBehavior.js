/// FOURJS_START_COPYRIGHT(D,2018)
/// Property of Four Js*
/// (c) Copyright Four Js 2018, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('Collapsible4STBehavior', ['StyleBehaviorBase'],
  function(context, cls) {
    /**
     * @class Collapsible4STBehavior
     * @memberOf classes
     * @extends classes.StyleBehaviorBase
     */
    cls.Collapsible4STBehavior = context.oo.Singleton(cls.StyleBehaviorBase, function($super) {
      return /** @lends classes.Collapsible4STBehavior.prototype */ {
        __name: "Collapsible4STBehavior",

        usedStyleAttributes: ["collapsible", "initiallyCollapsed"],

        /**
         * @inheritDoc
         */
        _attachWidget: function(controller, data) {
          if (controller.getWidget()) {
            data.toggleClickHandler = controller.getWidget().when(
              context.constants.widgetEvents.toggleClick,
              this._onToggleClick.bind(this, controller, data)
            );
          }
        },
        /**
         * @inheritDoc
         */
        _detachWidget: function(controller, data) {
          if (data.toggleClickHandler) {
            data.toggleClickHandler();
            data.toggleClickHandler = null;
          }
        },

        /**
         * @inheritDoc
         */
        _apply: function(controller, data) {
          const node = controller?.getAnchorNode(),
            widget = controller.getWidget();
          const storedSettingsGroupId = this._getIdentifier(controller);
          widget.setGroupIdentifier(storedSettingsGroupId);
          if (node && widget && widget.setCollapsible) {
            const isCollapsible = this.isSAYesLike(node.getStyleAttribute("collapsible")),
              initiallyCollapsedAttr = node.getStyleAttribute("initiallyCollapsed"),
              initiallyCollapsed = this.isSAYesLike(initiallyCollapsedAttr);
            widget.setCollapsible(isCollapsible);

            if (initiallyCollapsedAttr === "always") {
              if (!data.firstApply) {
                widget.setCollapsed(true);
                data.firstApply = true;
              }
            } else if (initiallyCollapsedAttr === "never") {
              if (!data.firstApply) {
                widget.setCollapsed(false);
                data.firstApply = true;
              }
            } else {
              const storedCollapsedState = context.StoredSettingsService
                .getGroupCollapsedState(storedSettingsGroupId.formName, storedSettingsGroupId.id);
              if (typeof storedCollapsedState === "boolean") {
                widget.setCollapsed(storedCollapsedState);
              } else if (initiallyCollapsed && !data.initiallyCollapsed) {
                data.initiallyCollapsed = true;
                widget.setCollapsed(true);
              }
            }
          }
        },
        /**
         *
         * @param {classes.ControllerBase} controller
         * @param {*} data
         * @private
         */
        _onToggleClick: function(controller, data) {
          const node = controller?.getAnchorNode(),
            app = node?.getApplication();
          if (app) {
            app.scheduler.layoutCommand();
          }
        },

        /**
         * Get a unique id for a Group
         * @param controller
         * @returns {{formName:string, id:string}} identifier of the Group
         * @private
         */
        _getIdentifier: function(controller) {
          const identifier = [];
          const bindings = controller.getNodeBindings();
          let anchor = bindings.anchor;
          let form = anchor.getAncestor("Form");
          let siblings = null;
          if (["Group"].indexOf(anchor.getTag()) >= 0) {
            siblings = form.getDescendants(anchor.getTag());
            identifier.push(anchor.getTag() + siblings.indexOf(anchor));
          }
          return {
            formName: form.attribute("name"),
            id: identifier.reverse().join("_")
          };
        }

      };
    });
  });
