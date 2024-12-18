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

modulum('MouseService', ['InitService'],
  function(context, cls) {

    /**
     * Mouse events Service
     * @namespace gbc.MouseService
     * @gbcService
     */
    context.MouseService = context.oo.StaticClass( /** @lends gbc.MouseService */ {
      __name: "MouseService",

      /**
       *  Init mouse service
       */
      init: function() {
        document.body.on("mousedown.MouseService", this._onMouseDown.bind(this));
        document.body.on("mouseup.MouseService", this._onMouseUp.bind(this));
        document.body.on("click.MouseService", this._onClick.bind(this));
        document.body.on("contextmenu.MouseService", this._onRightClick.bind(this));
        document.body.on("dblclick.MouseService", this._onDblClick.bind(this));
      },

      /**
       * Save the mouse position after a domEvent
       * @param {MouseEvent} domEvent - dom event that trigger the request
       * @param {Element} targetElement - target element to use as reference when getting cursors
       */
      saveMousePosition: function(domEvent, targetElement) {
        if ((!domEvent.clientX || domEvent.clientX < 0) && (!domEvent.clientY || domEvent.clientY < 0)) {
          const rect = targetElement.getBoundingClientRect();
          context.WidgetService.cursorX = rect.left;
          context.WidgetService.cursorY = rect.top;
        } else {
          let marginLeft = 0;
          let marginTop = 0;
          // if target element is in another body context look for cursors using target element position as reference
          if (document.body !== domEvent.currentTarget) {
            const pos = targetElement.getBoundingClientRect();
            marginLeft = pos.x;
            marginTop = pos.y;
          }
          context.WidgetService.cursorX = marginLeft + domEvent.clientX;
          context.WidgetService.cursorY = marginTop + domEvent.clientY;
        }
      },

      /**
       * Mouse down handler bound on body element. Catch all mouse down events and propagate it to the corresponding widget.
       * @param event
       * @param targetElement - mouse down target element. If not specified we find it from event object
       * @private
       */
      _onMouseDown: function(event, targetElement) {
        context.LogService.mouse.log("onMouseDown event : ", event);

        targetElement = targetElement || event.target;

        this.saveMousePosition(event, targetElement);

        if (event?.button !== 2 && !cls.DropDownWidget.hasAnyVisible()) { // if !== right click & no dropdown
          // clear Table items selection
          cls.RTableWidget.getTableWithItemsSelection()?._resetItemsSelection();
        }

        // search widget from dom event
        const widget = gbc.WidgetService.getWidgetFromElement(targetElement);

        if (widget && !this._canProcessEvent(widget)) {
          return false;
        }

        // if a widget is found
        if (widget) {

          let bubbles = widget.manageMouseDown(event);

          // bubble event to parent *DOM* widget
          if (bubbles) {
            const widgetElement = targetElement.elementOrParent("gbc_WidgetBase");
            let parentWidgetElement = widgetElement.parent("gbc_WidgetBase");
            while (parentWidgetElement && bubbles) {
              const parentWidget = gbc.WidgetService.getWidgetFromElement(parentWidgetElement);
              if (parentWidget) {
                bubbles = parentWidget.manageMouseDown(event);
              }
              parentWidgetElement = parentWidgetElement.parent("gbc_WidgetBase");
            }
          }
        }
      },

      /**
       * Mouse up handler bound on body element. Catch all mouse up events and propagate it to the corresponding widget.
       * @param event
       * @param targetElement - mouse up target element. If not specified we find it from event object
       * @private
       */
      _onMouseUp: function(event, targetElement) {
        context.LogService.mouse.log("onMouseUp event : ", event);

        targetElement = targetElement || event.target;

        this.saveMousePosition(event, targetElement);

        // search widget from dom event
        const widget = gbc.WidgetService.getWidgetFromElement(targetElement);

        if (widget && !this._canProcessEvent(widget)) {
          return false;
        }

        // if a widget is found
        if (widget) {

          let bubbles = widget.manageMouseUp(event);

          // bubble event to parent *DOM* widget
          if (bubbles) {
            const widgetElement = targetElement.elementOrParent("gbc_WidgetBase");
            let parentWidgetElement = widgetElement.parent("gbc_WidgetBase");
            while (parentWidgetElement && bubbles) {
              const parentWidget = gbc.WidgetService.getWidgetFromElement(parentWidgetElement);
              if (parentWidget) {
                bubbles = parentWidget.manageMouseUp(event);
              }
              parentWidgetElement = parentWidgetElement.parent("gbc_WidgetBase");
            }
          }
        }
      },

      /**
       * Click handler bound on body element. Catch all click events and propagate it to the corresponding widget.
       * @param event
       * @param targetElement - click target element. If not specified we find it from event object
       * @param {boolean} delayedClick - true if onClick is executed from a delayed click command
       * @private
       */
      _onClick: function(event, targetElement, delayedClick = false) {
        // onClick can raise during a GBC reload. In that case just ignore it.
        if (!context.LogService.mouse) {
          return;
        }
        context.LogService.mouse.log("onClick event : ", event);

        targetElement = targetElement || event.target;

        this.saveMousePosition(event, targetElement);

        // if overlay is visible, we hide displayed dropdowns and prevent default click events behaviors
        if (cls.DropDownWidget.hasAnyVisible() && !cls.DropDownWidget.isChildOfDropDown(targetElement)) {
          cls.DropDownWidget.hideAll();
          return false;
        }

        // search widget from dom event
        let widget = gbc.WidgetService.getWidgetFromElement(targetElement);
        // if no widget found, but we clicked inside a widget dropdown, get this dropdown
        if (!widget && cls.DropDownWidget.hasAnyVisible() && cls.DropDownWidget.isChildOfDropDown(targetElement)) {
          widget = cls.DropDownWidget.getActiveDropDowns().last();
        }

        if (widget?.getAUIWidget && widget.getAUIWidget()) {
          // If the command widget is in sidebar, close it
          let sideBarTopmenu = widget.getParentWidget(cls.RSidebarTopMenuWidget);
          if (sideBarTopmenu) {
            context.HostLeftSidebarService.showTopMenu(false);
            sideBarTopmenu.emit("close");
          }

          //If it is a virtual widget send the mouse event to the real one
          widget = widget.getAUIWidget();
        }

        if (widget && !widget.acceptEventWhenWindowInactive() && !this._canProcessEvent(widget)) {
          return false;
        }

        // if a widget is found
        if (widget) {

          // if widget doesn't have aui identifier then directly execute manageMouseClick of the widget and do not delay the command (no vm interaction needed)
          if (!delayedClick && widget.getAuiLinkedUniqueIdentifier()) {
            const curSession = context.SessionService.getCurrent();
            const app = curSession && curSession.getCurrentApplication();
            if (app && !app.scheduler.hasNoCommandToProcess()) {

              // if widget is interruptable directly execute manageMouseClick no delayedMouseClick
              if (!widget.isInterruptable()) {
                app.scheduler.delayedMouseClickCommand(widget, event);
                return false;
              }
            }
          }

          let bubbles = widget.manageMouseClick(event);

          // bubble event to parent *DOM* widget
          if (bubbles) {
            const widgetElement = targetElement.elementOrParent("gbc_WidgetBase");
            let parentWidgetElement = widgetElement.parent("gbc_WidgetBase");
            while (parentWidgetElement && bubbles) {
              const parentWidget = gbc.WidgetService.getWidgetFromElement(parentWidgetElement);
              if (parentWidget) {
                bubbles = parentWidget.manageMouseClick(event);
              }
              parentWidgetElement = parentWidgetElement.parent("gbc_WidgetBase");
            }
          }
        }
      },

      /**
       * Click handler bound on body element. Catch all rightclick events and propagate it to the corresponding widget.
       * @param event
       * @param targetElement - right click target element. If not specified we find it from event object
       * @private
       */
      _onRightClick: function(event, targetElement) {
        context.LogService.mouse.log("onRightClick event : ", event);

        targetElement = targetElement || event.target;

        this.saveMousePosition(event, targetElement);

        // if overlay is visible, we hide displayed dropdowns and prevent default click events behaviors
        if (cls.DropDownWidget.hasAnyVisible() && !cls.DropDownWidget.isChildOfDropDown(targetElement)) {
          cls.DropDownWidget.hideAll();
          //Restore the focus to the current widget
          const application = context.SessionService.getCurrent().getCurrentApplication();
          if (application) {
            const node = application.getFocusedVMNodeAndValue(true);
            const ctrl = node.getController();
            if (ctrl) {
              ctrl.setFocus();
            }
          }
          event.preventCancelableDefault();
          return false;
        }

        // search widget from dom event
        const widget = gbc.WidgetService.getWidgetFromElement(targetElement);

        if (widget && !this._canProcessEvent(widget)) {
          return false;
        }

        // if a widget is found
        if (widget) {
          let bubbles = widget.manageMouseRightClick(event);

          // bubble event to parent *DOM* widget
          if (bubbles) {
            const widgetElement = targetElement.elementOrParent("gbc_WidgetBase");
            let parentWidgetElement = widgetElement.parent("gbc_WidgetBase");
            while (parentWidgetElement && bubbles) {
              const parentWidget = gbc.WidgetService.getWidgetFromElement(parentWidgetElement);
              if (parentWidget) {
                bubbles = parentWidget.manageMouseRightClick(event);
              }
              parentWidgetElement = parentWidgetElement.parent("gbc_WidgetBase");
            }
          }
        }
      },

      /**
       * Click handler bound on body element. Catch all dblclick events and propagate it to the corresponding widget.
       * @param event
       * @param targetElement - double click target element. If not specified we find it from event object
       * @private
       */
      _onDblClick: function(event, targetElement) {
        context.LogService.mouse.log("onDblClick event : ", event);

        targetElement = targetElement || event.target;

        // search widget from dom event
        const widget = gbc.WidgetService.getWidgetFromElement(targetElement);

        if (widget && !this._canProcessEvent(widget)) {
          return false;
        }

        // if a widget is found
        if (widget) {

          let bubbles = widget.manageMouseDblClick(event);

          // bubble event to parent *DOM* widget
          if (bubbles) {
            const widgetElement = targetElement.elementOrParent("gbc_WidgetBase");
            let parentWidgetElement = widgetElement.parent("gbc_WidgetBase");
            while (parentWidgetElement && bubbles) {
              const parentWidget = gbc.WidgetService.getWidgetFromElement(parentWidgetElement);
              if (parentWidget) {
                bubbles = parentWidget.manageMouseDblClick(event);
              }
              parentWidgetElement = parentWidgetElement.parent("gbc_WidgetBase");
            }
          }
        }
      },

      /**
       * @param {classes.WidgetBase} widget
       * @return {boolean} false if the application is waiting in background
       * @private
       */
      _canProcessEvent: function(widget) {
        const curSession = context.SessionService.getCurrent();
        const application = curSession && curSession.getApplicationByIdentifier(widget.getApplicationIdentifier());

        if (application) {
          return application.canProcessEvent();
        }

        return true;
      }

    });
    context.InitService.register(context.MouseService);
  });
