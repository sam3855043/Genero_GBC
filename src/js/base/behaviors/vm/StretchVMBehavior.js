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

modulum('StretchVMBehavior', ['BehaviorBase'],
  function(context, cls) {
    /**
     * @class StretchVMBehavior
     * @memberOf classes
     * @extends classes.BehaviorBase
     */
    cls.StretchVMBehavior = context.oo.Singleton(cls.BehaviorBase, function($super) {
      return /** @lends classes.StretchVMBehavior.prototype */ {
        __name: "StretchVMBehavior",

        onlyXStretchWidget: ["ButtonEdit", "CheckBox", "DateEdit", "DateTimeEdit", "Edit", "Label", "ProgressBar",
          "RadioGroup", "Slider", "SpinEdit", "TimeEdit"
        ],

        watchedAttributes: {
          anchor: ['stretch'],
          decorator: ['stretch', 'stretchMin', "stretchMax"],
          form: ['stretch'],
          table: ['stretchColumns']
        },

        _apply: function(controller, data) {
          let widget = controller.getWidget(),
            layoutInformation = widget && widget.getLayoutInformation(),
            rawLayoutInformation = layoutInformation && layoutInformation.getRawInformation();

          if (widget && rawLayoutInformation) {
            let bindings = controller.getNodeBindings();
            let stretchNode = bindings.decorator ? bindings.decorator : bindings.anchor;
            let stretch = stretchNode.attribute('stretch');
            let stretchMin = stretchNode.attribute('stretchMin');
            let stretchMax = stretchNode.attribute('stretchMax');
            rawLayoutInformation.setStretch(stretch);
            rawLayoutInformation.setStretchMin(stretchMin);
            rawLayoutInformation.setStretchMax(stretchMax);

            // TODO @ALTR why not using isAttributeSetByVM function, why === undefined
            // TODO "" is not a value admitted by stretch attribute...
            if (stretch === "" || stretch === undefined) {
              let stretched = layoutInformation.getStretched();
              stretched.setX(stretched.getDefaultX()); //Reset to default value
              this._calculateStretch(bindings.form, stretchNode, widget);
            } else if (stretch && widget.getLayoutInformation()) {
              layoutInformation.getStretched().setX((stretch === 'x' || stretch === 'both'));
              if (this.onlyXStretchWidget.indexOf(stretchNode.getTag()) === -1) {
                layoutInformation.getStretched().setY(stretch === 'y' || stretch === 'both');
              }
            }

            let windowWidget = widget.getWindowWidget();
            if (windowWidget) {
              windowWidget.getLayoutEngine().invalidateAllocatedSpace();
            } else {
              widget.getLayoutEngine().invalidateAllocatedSpace();
            }
          }
        },

        /**
         * Define if the widget must be automatically stretched.
         * On mobile the default layout is stretch=X
         */
        _calculateStretch: function(formNode, stretchNode, widget) {
          let layout = widget.getLayoutInformation();
          if (!layout) {
            return;
          }

          if (stretchNode.isInTable()) {
            // in a table, stretch default value is computed from stretchColumns attribute of table node
            let tableNode = stretchNode.getAncestor("Table");
            if (tableNode.isAttributeSetByVM("stretchColumns")) {
              let stretchColumns = tableNode.attribute("stretchColumns") === 1;
              // Apply stretch from table node definition
              layout.getStretched().setX(stretchColumns);
            }
            return;
          }

          if (widget instanceof cls.LabelWidget || widget instanceof cls.CheckBoxWidget ||
            widget instanceof cls.RadioGroupWidget) {
            //This widget don't take the default value from FORM or on Mobile
            return;
          }

          if (formNode && formNode.isAttributeSetByVM("stretch")) {
            let currentFormStretch = formNode.attribute("stretch");
            //Apply stretch form node definition
            layout.getStretched().setX(currentFormStretch === 'x');
            return;
          }

          if (window.isMobile()) {
            //On mobile default value is STRETCH=X
            if (this.onlyXStretchWidget.indexOf(stretchNode.getTag()) >= 0) {
              layout.getStretched().setX(true);
            }
          }
        }
      };
    });
  });
