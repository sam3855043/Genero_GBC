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

modulum('DndService', ['InitService'],
  function(context, cls) {

    /**
     * This is responsible to manage the Dnd indicator, 
     * and also to manage the drag and drop of Table Items (or table columns)
     * It also manage to send VM Event for Multi Row Selection
     * @namespace gbc.DndService
     * @gbcService
     */
    context.DndService = context.oo.StaticClass( /** @lends gbc.DndService */ {
      //#region Fields
      __name: "DndService",

      /**
       * @type {cls.TableNode}
       * @private
       */
      _draggedNodeInitialContainer: null,
      /**
       * @type {cls.TableNode}
       * @private
       */
      _hoveredContainerNode: null,
      /**
       * @type {cls.ValueNode}
       * @private
       */
      _draggedValueNode: null,
      /**
       * @type {cls.ValueNode}
       * @private
       */
      _hoveredValueNode: null,
      /**
       * @type {cls.ValueNode}
       * @private
       */
      _targetValueNode: null,
      /**
       * @type {boolean}
       * @private
       */
      _insertAfter: false,
      /**
       * @type {cls.ValueStandardNodeNode}
       * @private
       */
      _targetTreeItemNode: null,
      /**
       * The DragDropInfo node sent by the VM 
       * @type {cls.StandardNode}
       * @private
       */
      _dragDropInfoNode: null,
      /**
       * @type {boolean}
       * @private
       */
      _dndAccepted: false,

      /**
       * The drop indicator container DOM Element
       * @type {Element}
       * @private
       */
      _dropIndicatorContainer: null,

      /**
       * The drop indicator DOM Element
       * null if the drop indicator is not in DOM
       * @type {Element}
       * @private
       */
      _dropIndicator: null,

      /**
       * A reference to the widget that invocated the dropIndicator
       * @type {WidgetBase}
       * @private
       */
      _dropIndicatorController: null,

      /**
       * @type {number}
       * @private
       */
      _tableThreshold: 0.5,
      /**
       * @type {number}
       * @private
       */
      _treeviewThreshold: 0.75,
      //#endregion

      init: function() {},

      /**
       * Destroy the Dnd Indicator and set the variable to null
       */
      destroy: function() {
        this.destroyDropIndicator(this._draggedNodeInitialContainer);
        this._dropIndicatorContainer = null;
        this.resetServiceVariables();
      },

      /**
       * Reset all the variables to null or their default value
       */
      resetServiceVariables: function() {
        this._hoveredContainerNode = null;
        this._draggedNodeInitialContainer = null;
        this._draggedValueNode = null;
        this._hoveredValueNode = null;
        this._targetValueNode = null;
        this._targetTreeItemNode = null;
        this.setDndAccepted(false);
      },

      //#region Table Item Drag Events
      /**
       * Call this method when a DragStart event happens on a TableItem
       * @param {cls.TableNode} parentTableNode
       * @param {cls.ValueNode} draggedValueNode
       * @param {DragEvent} domEvent
       */
      onTableItemDragStart: function(parentTableNode, draggedValueNode, domEvent) {
        this._draggedNodeInitialContainer = parentTableNode;
        this._draggedValueNode = draggedValueNode;

        const vmEvents = [];

        // Send currentRow to VM
        const startDragRowIndex = this._draggedNodeInitialContainer.attribute("offset") + draggedValueNode.getIndex();
        vmEvents.push(new cls.VMConfigureEvent(this._draggedNodeInitialContainer.getId(), {
          currentRow: startDragRowIndex
        }));

        // Send row selection extension if mrs is enabled
        if (this._draggedNodeInitialContainer.attribute("multiRowSelection") === 1) {
          const startDragRowIndexIsSelected = (this._draggedNodeInitialContainer.getChildren("RowInfoList")[0].getChildren()[draggedValueNode
              .getIndex()]
            .attribute(
              "selected") === 1);
          if (startDragRowIndexIsSelected === false) {
            vmEvents.push(new cls.VMRowSelectionEvent(this._draggedNodeInitialContainer.getId(), {
              startIndex: startDragRowIndex,
              endIndex: startDragRowIndex,
              selectionMode: "set"
            }));
          }
        }

        this.createDropIndicator(this._draggedNodeInitialContainer.getController());

        // Send dragStart event to VM
        vmEvents.push(new cls.VMDragDropEvent(this._draggedNodeInitialContainer.getId(), {
          dndEventType: "dragStart"
        }));
        this._draggedNodeInitialContainer.getApplication().scheduler.eventVMCommand(vmEvents, this._draggedNodeInitialContainer);

        // Tell the VM we have entered the initial table node
        this.onEnterContainerNode(this._draggedNodeInitialContainer);
      },

      /**
       * Call this method when a DragEnd event happens on a TableItem
       * @param {DragEvent} domEvent
       */
      onTableItemDragEnd: function(domEvent) {
        if (!this._draggedNodeInitialContainer) {
          return;
        }

        let dndOperation = "";
        if (this._dragDropInfoNode) {
          dndOperation = this._dragDropInfoNode.attribute("dndOperation");
        }
        dndOperation = dndOperation === "" ? "move" : dndOperation;

        this.destroyDropIndicator(this._draggedNodeInitialContainer.getController());

        // Send dragFinished event to VM
        const dragFinishedEvent = new cls.VMDragDropEvent(this._draggedNodeInitialContainer.getId(), {
          dndEventType: "dragFinished",
          dndOperation: dndOperation
        });
        this._draggedNodeInitialContainer.getApplication().scheduler.eventVMCommand(dragFinishedEvent, this._draggedNodeInitialContainer);

        this.resetServiceVariables();
      },

      /**
       * Call this method when a dragEnter event happens on a TableItem
       * @param {cls.TableNode} enteredTableNode 
       * @param {cls.ValueNode} enteredValueNode 
       * @param {DragEvent} domEvent
       */
      onDragEnterTableItem: function(enteredTableNode, enteredValueNode, domEvent) {
        this.onEnterContainerNode(enteredTableNode);
      },

      /**
       * Call this method when a DragOver event happens on a TableItem
       * @param {cls.TableNode} hoveredTableNode
       * @param {cls.ValueNode} hoveredValueNode
       * @param {DragEvent} domEvent
       */
      onDragOverTableItem: function(hoveredTableNode, hoveredValueNode, domEvent) {
        // avoid triggering all the logic if there was no Dnd Started
        if (!this._draggedNodeInitialContainer) {
          return;
        }

        if (hoveredTableNode === null) {
          throw new Error("The hovered table node is null");
        }
        if (hoveredValueNode === null) {
          throw new Error("The hovered value node is null");
        }

        // Cancel the the function there is no dragDropInfoNode
        if (!this._dragDropInfoNode) {
          // Hide the indicator
          this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), {
            visible: false
          });
          return;
        }

        if (this._dragDropInfoNode.attribute("dndAccepted") === 1) {
          domEvent.preventCancelableDefault();
        }

        // Compute ratio to know if we insert the draged node before or after
        const ratios = this._getMouseOffsetRatios(domEvent, hoveredValueNode.getController().getWidget().getElement());
        const hoveredTableisTreeView = hoveredTableNode.getTreeInfo() !== null;
        let targetValueNode = this._getTargetValueNode(
          hoveredValueNode,
          ratios,
          hoveredTableisTreeView ? this._treeviewThreshold : this._tableThreshold
        );
        if (targetValueNode === this._draggedValueNode) {
          // Hide the indicator
          this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), {
            visible: false
          });
          return;
        }

        let targetTreeItemNode = null;
        if (hoveredTableisTreeView) {
          // Get the corresponding tree item
          targetTreeItemNode = hoveredTableNode.getTreeItemNodeAtRow(targetValueNode.getIndex());
          // If mouse position is located on the border of the tree item, use the ancestor as drop container
          if (targetTreeItemNode && (ratios.y < 0.25 || ratios.y > this._treeviewThreshold)) {
            targetTreeItemNode = targetTreeItemNode.getAncestor("TreeItem");
          }
        }

        if (targetValueNode !== this._targetValueNode || targetTreeItemNode !== this._targetTreeItemNode) {
          // as we are in the same configuration than last event, just return
          this._hoveredValueNode = hoveredValueNode;
          this._targetValueNode = targetValueNode;
          this._targetTreeItemNode = targetTreeItemNode;
          this._dragOverTableItemNode(hoveredTableisTreeView);
        }

        this._updateDropDownIndicatorFromTargetNode();
      },

      /**
       * Manage VM event when dragging over a table item
       * @param {number} indexValue
       * @param {boolean} isTreeView
       * @private
       */
      _dragOverTableItemNode: function(isTreeView) {
        let dndOperation = this._dragDropInfoNode.attribute("dndOperation");
        dndOperation = dndOperation === "" ? "move" : dndOperation;
        let dragOverEvent = null;
        if (isTreeView) {
          dragOverEvent = new cls.VMDragDropEvent(this._targetValueNode.getId(), {
            dndEventType: "dragOver",
            dndOperation: dndOperation,
            dndParentIdRef: this._targetTreeItemNode ? this._targetTreeItemNode.getId() : -1
          });
        } else {
          let hoveredNodeId = this._targetValueNode.getId();
          dragOverEvent = new cls.VMDragDropEvent(hoveredNodeId, {
            dndEventType: "dragOver",
            dndOperation: dndOperation
          });
        }
        this._draggedNodeInitialContainer.getApplication().scheduler.eventVMCommand(dragOverEvent, this._targetValueNode);
      },

      /**
       * Call this method when a Drop event happens on a TableItem
       * @param dropTargetValueNode
       */
      onDropTableItem: function(dropTargetValueNode, evt) {
        if (!this._draggedNodeInitialContainer) {
          return;
        }

        if (!this._dragDropInfoNode || !dropTargetValueNode) {
          return;
        }
        // Better compute the target node
        const ratios = this._getMouseOffsetRatios(evt, dropTargetValueNode.getController().getWidget().getElement());
        const tableNode = dropTargetValueNode.getTableNode();
        const isTreeView = tableNode.getTreeInfo() !== null;
        let dropTargetNodeId = this._getTargetValueNode(
          dropTargetValueNode,
          ratios,
          isTreeView ? this._treeviewThreshold : this._tableThreshold).getId();

        // Send drop event to VM
        const dropEvent = new cls.VMDragDropEvent(dropTargetNodeId, {
          dndEventType: "drop",
          dndBuffer: this._dragDropInfoNode.attribute("dndBuffer")

        });
        dropTargetValueNode.getApplication().scheduler.eventVMCommand(dropEvent, dropTargetValueNode);
      },
      //#endregion

      //#region TableContainer Drag Events
      /**
       * Update the current hovered parent node,
       * send a dragLeave of the previous container to the VM 
       * @param {cls.NodeBase} enteredNode The entered container node
       */
      onEnterContainerNode: function(enteredNode) {
        if (!this._draggedNodeInitialContainer) {
          return;
        }

        if (enteredNode === null || enteredNode === this._hoveredContainerNode) {
          return;
        }
        if (!this._dragDropInfoNode) {
          return;
        }
        this.onLeaveContainerNode(this._hoveredContainerNode);

        this._hoveredContainerNode = enteredNode;

        const dragEnterEvent = new cls.VMDragDropEvent(this._hoveredContainerNode.getId(), {
          dndEventType: "dragEnter",
          dndMimeTypes: this._dragDropInfoNode.attribute("dndMimeTypes"),
          dndOperation: "move"
        });
        this._draggedNodeInitialContainer.getApplication().scheduler.eventVMCommand(dragEnterEvent, this._hoveredContainerNode);
        this._updateDropDownIndicatorFromTargetNode();
      },

      /**
       * Send a dragLeave event to the VM.
       * The current container node will be se to null
       * @param {cls.NodeBase} leavedNode The node that trigger the dragLeave event
       */
      onLeaveContainerNode: function(leavedNode) {
        if (!this._draggedNodeInitialContainer) {
          return;
        }
        if (leavedNode === null || leavedNode !== this._hoveredContainerNode) {
          return;
        }

        // Send dragLeave event to VM
        const dragLeaveEvent = new cls.VMDragDropEvent(this._hoveredContainerNode.getId(), {
          dndEventType: "dragLeave"
        });
        this._draggedNodeInitialContainer.getApplication().scheduler.eventVMCommand(dragLeaveEvent, this._hoveredContainerNode);
        this._hoveredContainerNode = null;
        this._updateDropDownIndicatorFromTargetNode();
      },

      //#endregion

      //#region Utils

      /**
       * Update the dropIndicator from currently hovered node data
       * @private
       */
      _updateDropDownIndicatorFromTargetNode() {
        let visualTargetNode = this._targetValueNode;
        if (!this._getIsDropAccepted() || visualTargetNode === null) {
          this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), {
            visible: false
          });
          return;
        }

        let useBottom = false;
        const containerSize = this._getHoveredContainerNodeSize();
        if (containerSize === 0) {
          this._updateDropDownIndicatorForEmptyContainer();
          return;
        } else if (visualTargetNode.getIndex() >= containerSize) {
          /*
           * If the node is after the container size
           * (we are in the case where we hover after the last node)
           */
          visualTargetNode = visualTargetNode.getParentNode().getChildren()[Math.max(0, containerSize - 1)];
          useBottom = true;
        }
        let targetRect = this._getNodeRect(visualTargetNode, true);
        if (!targetRect) {
          throw new Error(`No targetRect was found for the targetNode with id ${visualTargetNode.getId()}`);
        }
        const columnNodes = this._hoveredContainerNode.getColumns();
        const firstColumnRect = this._getNodeRect(columnNodes[0]);
        const lastColumnRect = this._getNodeRect(columnNodes.at(-1));

        let indicatorWidth = lastColumnRect.right - firstColumnRect.left;
        let tableWidth = this._hoveredContainerNode.getWidget().getContainerElement().clientWidth;
        if (indicatorWidth <= 0 || indicatorWidth > tableWidth) {
          indicatorWidth = tableWidth;
        }
        const displayData = {
          visible: true,
          lineWidth: `${indicatorWidth}px`,
          lineTop: `${useBottom ? targetRect.bottom : targetRect.top}px`,
          lineLeft: `${firstColumnRect.left}px`,
          lineVisibility: true,
          boxVisibility: false
        };

        if (this._targetTreeItemNode === null) {
          this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), displayData);
          return;
        }

        this._updateDropDownIndicatorForTreeview(visualTargetNode, displayData, indicatorWidth, firstColumnRect.left);
      },

      /**
       * Tweak the display data to fit the tree view and update the dndIndicator
       * @param {cls.ValueNode} visualTargetNode The node to use for computing indicator position
       * @param {object} displayData The object containing the current display data for the dnd indicator
       * @param {number} indicatorWidth The width of the container
       * @param {number} firstColumnLeftBound The left position of the first column, used to position the indicator
       */
      _updateDropDownIndicatorForTreeview(visualTargetNode, displayData, indicatorWidth, firstColumnLeftBound) {
        // We are in three item
        const targetTreeItemValueNode = this._targetTreeItemNode.getValueNode();
        const targetTreeItemRect = this._getNodeRect(targetTreeItemValueNode, true);
        if (targetTreeItemRect !== null) {
          // By default we consider that we are dropping between 2 tree nodes
          displayData.boxVisibility = true;
          displayData.boxLeft = `calc(${targetTreeItemRect.left}px + ${this._targetTreeItemNode.getDepth()}em)`;
          displayData.boxTop = `${targetTreeItemRect.top}px`;
          displayData.boxWidth = `calc(${indicatorWidth}px - ${this._targetTreeItemNode.getDepth()}em)`;
          displayData.boxHeight = `${targetTreeItemRect.height}px`;

          displayData.lineLeft = `calc(${firstColumnLeftBound}px + ${this._targetTreeItemNode.getDepth() + 1}em)`;
          displayData.lineWidth = `calc(${indicatorWidth}px - ${this._targetTreeItemNode.getDepth() + 1}em)`;
        }
        if (this._targetTreeItemNode.getRow() === visualTargetNode.getIndex()) {
          // Fired when the user drop directly on the tree item
          displayData.lineVisibility = false;
          displayData.thickBox = true;
        }
        this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), displayData);
      },

      /**
       * Tweak the display data to create a square arround the container
       */
      _updateDropDownIndicatorForEmptyContainer() {
        /** @type {DOMRect} */
        const containerRect = this._hoveredContainerNode.getWidget().getContainerElement().getBoundingClientRect();

        const displayData = {
          visible: true,
          lineVisibility: false,
          boxLeft: `${containerRect.left}px`,
          boxTop: `${containerRect.top}px`,
          boxHeight: `${containerRect.height}px`,
          boxWidth: `${containerRect.width}px`,
          thickBox: true,
          boxVisibility: true
        };
        this.updateDropIndicator(this._draggedNodeInitialContainer.getController(), displayData);
      },

      /**
       * @param {cls.StandardNode} dragDropInfoNode Set the information node sent by the VM
       */
      setDragDropInfoNode: function(dragDropInfoNode) {
        this._dragDropInfoNode = dragDropInfoNode;
      },

      /**
       * @param {boolean} dndAccepted True if the dndOperation is accepted
       */
      setDndAccepted: function(dndAccepted) {
        this._dndAccepted = dndAccepted;
      },

      /**
       * Get the element DOM Rect linked to the value node given in parameter 
       * @param {cls.ValueNode} node The value node to get the DOMRect from
       * @returns {DOMRect}
       * @private
       */
      _getNodeRect: function(node, useParent = false) {
        if (!node?.getController) {
          return null;
        }

        let widget = node?.getController()?.getWidget();
        if (useParent) {
          widget = widget?.getParentWidget();
        }
        const element = widget?.getElement();
        if (!element) {
          return null;
        }
        return element.getBoundingClientRect();
      },

      /**
       * Get the mouse location ratios compare to the element given in parameter
       * If the returned ratio is between 0 & 1, the event is in boundaries of the compared element
       * else the value is null
       * @param {MouseEvent} evt The mouse event to get the mouse coordinates from
       * @param {Element} comparingElement The element to compare against the event data
       * @returns {{x: number, y: number}}
       * @private
       */
      _getMouseOffsetRatios: function(evt, comparingElement) {
        const ratios = {
          x: 0,
          y: 0
        };
        const elementRect = comparingElement.getBoundingClientRect();

        let offsetX = evt.clientX - elementRect.x;
        ratios.x = offsetX / elementRect.width;

        let offsetY = evt.clientY - elementRect.y;
        ratios.y = offsetY / elementRect.height;

        return ratios;
      },

      /**
       * Get the target value node id depending on the ratio and threshold
       * @param {cls.ValueNode} valueNode The valueNode 
       * @param {{x: number, y: number}} ratios The current ratio
       * @param {number} threshold the value to overcome to consider that we take the next node as target
       * @returns {cls.ValueNode} 
       * @private
       */
      _getTargetValueNode: function(valueNode, ratios, threshold) {
        const insertAfter = ratios.y > threshold;

        const valueList = valueNode.getParentNode();
        if (valueNode.getWidget() === null) {
          const firstUnvaluedNode = valueList.getChildren().find((valueNode) => valueNode.getValue() === "");
          return firstUnvaluedNode;
        }

        if (insertAfter) {
          // get the node just after the hovered one 
          const nextValueNode = valueList.getChildren()[valueNode.getIndex() + 1];
          if (nextValueNode) {
            return nextValueNode;
          }
        }
        return valueNode;
      },

      /**
       * @private
       * @return The minimum between the size or pageSize attribute of the hoveredContainerNode
       */
      _getHoveredContainerNodeSize: function() {
        return Math.min(
          this._hoveredContainerNode.attribute("pageSize") + 1,
          this._hoveredContainerNode.attribute("size")
        );
      },

      /**
       * @private
       * @returns {boolean} True if we can drop on the current hoveredContainer node
       */
      _getIsDropAccepted: function() {
        return this._hoveredContainerNode?.attribute("canDrop") === 1 &&
          this._dragDropInfoNode?.attribute("dndAccepted") === 1;
      },

      //#endregion

      //#region Drop Indicator

      /**
       * Create a Drag and Drop indicator Element and add it to the dom
       * The element will be hidden until updated
       * @param {cls.ControllerBase} controller The controller invocating the dnd operation
       * @param {boolean} horizontal If True, the drag and drop will be horizontal, else it will be vertical
       */
      createDropIndicator: function(controller) {
        if (this._dropIndicator || this._dropIndicatorController) {
          let currentControllerName = "controller undefined";
          if (this._dropIndicatorController) {
            currentControllerName =
              `${this._dropIndicatorController.__name} : ${this._dropIndicatorController._auiName} #${this._dropIndicatorController._uuid}`;
          }
          throw new Error(
            `A drop indicator is already in the DOM. Destroy the indicator before creating a new one.\nController : ${currentControllerName}`
          );
        }
        if (!this._dropIndicatorContainer) {
          this._dropIndicatorContainer = context.HostService.getDropDownContainer();
        }

        this._dropIndicatorController = controller;
        this._dropIndicator = document.createElement("div");
        this._dropIndicator.id = "gbc_dndIndicator";
        this._dropIndicator.addClass("gbc_dndIndicator");
        const dropIndicatorLine = document.createElement("div");
        dropIndicatorLine.addClass("insertLine");
        const dropIndicatorBox = document.createElement("div");
        dropIndicatorBox.addClass("appendBox");
        this._dropIndicator.append(dropIndicatorLine);
        this._dropIndicator.append(dropIndicatorBox);
        this._dropIndicatorContainer.append(this._dropIndicator);
        this._dropIndicatorContainer.removeClass("hidden");
      },

      /**
       * Update the location of the drop indicator
       * @param {cls.ControllerBase} controller The controller that invoked the dnd operation
       * @param {string} displayData.lineTop The horizontal location of the line on the screen
       * @param {string} displayData.lineLeft The vertical location of the line on the screen
       * @param {string} displayData.lineWidth The width of the line indicator
       * @param {boolean} displayData.lineVisibility The visibility of the line indicator (true = visible, true by default)
       * @param {string} displayData.boxTop The horizontal location of the box on the screen
       * @param {string} displayData.boxLeft The vertical location of the box on the screen
       * @param {string} displayData.boxWidth The width of the box indicator
       * @param {string} displayData.boxHeight The height of the box indicator
       * @param {boolean} displayData.thickBox The border thickness of the box indicator
       * @param {boolean} displayData.boxVisibility The visibility of the box indicator (true = visible)
       * @param {boolean} displayData.visible The vibility of both indicator true = visible
       */
      updateDropIndicator: function(controller, displayData = {}) {
        if (!this._dropIndicator) {
          throw new Error("No Drop Indicator was created");
        }
        if (controller !== this._dropIndicatorController) {
          throw new Error("The invocators don't match");
        }

        this._dropIndicator.style.setProperty("--lineLeft", displayData.lineLeft);
        this._dropIndicator.style.setProperty("--lineTop", displayData.lineTop);
        this._dropIndicator.style.setProperty('--lineWidth', displayData.lineWidth);
        this._dropIndicator.style.setProperty('--lineVisibility', displayData.lineVisibility ? "visible" : "hidden");
        this._dropIndicator.style.setProperty("--boxLeft", displayData.boxLeft);
        this._dropIndicator.style.setProperty("--boxTop", displayData.boxTop);
        this._dropIndicator.style.setProperty('--boxWidth', displayData.boxWidth);
        this._dropIndicator.style.setProperty('--boxHeight', displayData.boxHeight);
        this._dropIndicator.style.setProperty('--thickBox', displayData.thickBox ? 1 : 0);
        this._dropIndicator.style.setProperty('--boxVisibility', displayData.boxVisibility ? "visible" : "hidden");

        if (displayData.visible && this._dropIndicator.classList.contains("hidden")) {
          this._dropIndicator.removeClass("hidden");
        } else if (!displayData.visible && !this._dropIndicator.classList.contains("hidden")) {
          this._dropIndicator.addClass("hidden");
        }
      },

      /**
       * Remove the DndIndicator from the DOM,
       * hide the DndIndicator container,
       * and set it to null. Also reset the _dropIndicatorController
       * @param {cls.ControllerBase} controller The Controller that invoked the dnd operation
       */
      destroyDropIndicator: function(controller) {
        if (!this._dropIndicator) {
          return;
        }

        if (this._dropIndicatorController !== controller) {
          throw new Error(`The invoker is not the same as the one that created the drop indicator`);
        }
        this._dropIndicator.remove();
        this._dropIndicator = null;
        this._dropIndicatorController = null;
        if (this._dropIndicatorContainer) {
          this._dropIndicatorContainer.addClass("hidden");
        }
      }
    });

    //#endregion

    context.InitService.register(context.DndService);
  });
