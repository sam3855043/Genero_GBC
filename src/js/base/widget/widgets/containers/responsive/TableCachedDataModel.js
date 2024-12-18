/// FOURJS_START_COPYRIGHT(D,2023)
/// Property of Four Js*
/// (c) Copyright Four Js 2023, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('TableCachedDataModel', ['EventListener'],
  function(context, cls) {

    /**
     * Cached Data Model for table.
     * @class TableCachedDataModel
     * @memberOf classes
     * @extends classes.EventListener
     * @publicdoc
     */
    cls.TableCachedDataModel = context.oo.Class({
      base: cls.EventListener
    }, function($super) {
      return /** @lends classes.TableCachedDataModel.prototype */ {
        __name: "TableCachedDataModel",

        /**
         * Data model
         * @type Object[]
         */
        _data: null,

        /**
         * AUI Value data
         * @type Object[]
         */
        _auiValueData: null,

        /**
         * AUI Row data
         * @type Object[]
         */
        _auiRowData: null,

        /** Ref on table widget which uses model
         * @type classes.RTableWidget
         */
        _tableWidget: null,

        /**
         * @constructs
         * @param {classes.RTableWidget} tableWidget - ref on table widget
         */
        constructor: function(tableWidget) {
          $super.constructor.call(this);

          this._tableWidget = tableWidget;
          this._data = [];
          this._auiValueData = [];
          this._auiRowData = [];
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          this._data = null;
          this._auiValueData = null;
          this._auiRowData = null;
          this._tableWidget = null;

          $super.destroy.call(this);
        },

        /**
         * Initialize data model
         * @param {number} nbRows - number of rows in the data model
         */
        init: function(nbRows) {
          this._data = [];
          this.addDefaultRows(nbRows);
        },

        /**
         * Update number of rows in the model
         * @param nbRows
         */
        updateNbRows: function(nbRows) {
          const length = this._data.length;
          if (nbRows > length) {
            this.addDefaultRows(nbRows - length);
          }
          // TODO else if (nbRows < length) {}
        },

        /**
         * Add default and empty rows in the data model
         * @param {number} nbRows - number of rows to add
         */
        addDefaultRows: function(nbRows) {
          for (let i = 0; i < nbRows; i++) {
            const rowData = {
              vm: false,
              selected: null,
              treeDepth: null,
              treeLeaf: null,
              treeExpanded: null,
              items: []
            };
            this._data.push(rowData);
          }
        },

        /**
         * Check and add columns if necessary in the data model
         * @param {number} rowIndex - index of row
         * @param {number} colIndex - index of column
         */
        checkAndAddDefaultColumns: function(rowIndex, colIndex) {
          if (this._data && this._data.length > 0) {
            if (colIndex >= this._data[rowIndex].items.length) {
              for (let i = 0; i < this._data.length; i++) {
                while (this._data[i].items.length <= colIndex) {
                  const obj = {
                    value: undefined,
                    textColor: undefined,
                    image: undefined,
                    fontWeight: undefined,
                    textDecoration: undefined,
                    backgroundColor: undefined
                  };
                  this._data[i].items.push(obj); // add an object with default parameters by default
                }
              }
            }
          }
        },

        /**
         * Returns value from AUI value data
         * @param {number} valueNodeIndex - value node index
         * @param {number} tableColumNodeIndex - column index
         */
        getAUIValueData: function(valueNodeIndex, tableColumNodeIndex) {
          // init global object
          if (!this._auiValueData) {
            this._auiValueData = [];
          }
          // init row
          if (!this._auiValueData[valueNodeIndex]) {
            this._auiValueData[valueNodeIndex] = {};
          }
          // init value
          if (!this._auiValueData[valueNodeIndex][tableColumNodeIndex]) {
            this._auiValueData[valueNodeIndex][tableColumNodeIndex] = {};
          }

          return this._auiValueData[valueNodeIndex][tableColumNodeIndex];
        },

        /**
         * Returns value from AUI row data
         * @param {number} valueNodeIndex - value node index
         */
        getAUIRowData: function(valueNodeIndex) {
          // init global object
          if (!this._auiRowData) {
            this._auiRowData = [];
          }
          // init row
          if (!this._auiRowData[valueNodeIndex]) {
            this._auiRowData[valueNodeIndex] = {};
          }

          return this._auiRowData[valueNodeIndex];
        },

        /**
         * Update data model from a value node
         * @param {classes.ValueNode} valueNode - value node
         * @param {String} dataName - data name
         * @param {*} dataValue - data value
         */
        updateDataFromValueNode: function(valueNode, dataName, dataValue) {
          const tableColumnNode = valueNode.getAncestor("TableColumn");
          const tableNode = tableColumnNode.getParentNode();
          const valueNodeIndex = valueNode.getIndex("Value");
          const tableColumNodeIndex = tableColumnNode.getIndex("TableColumn");
          const tableOffset = tableNode.attribute('offset');
          const rowIndex = valueNodeIndex + tableOffset;

          this.updateData(rowIndex, tableColumNodeIndex, tableOffset, dataName, dataValue);
        },

        /**
         * Update data model
         * @param {number} rowIndex - row of the data to be updated
         * @param {number} colIndex - col of the data to be updated
         * @param {number} offset - table offset
         * @param {String} dataName - data name
         * @param {*} dataValue - data value
         */
        updateData: function(rowIndex, colIndex, offset, dataName, dataValue) {
          const currentAUIValueData = this.getAUIValueData((rowIndex - offset), colIndex);

          if (dataName) {
            /// update AUI value data model
            currentAUIValueData[dataName] = dataValue;
          }

          if (this._data === null) {
            return;
          }

          // case when scroll is at most bottom, and it is processing the last value node (bufferSize = pageSize + 1)
          if (rowIndex >= this._data.length) {
            return;
          }
          // check an add columns in model if necessary
          this.checkAndAddDefaultColumns(rowIndex, colIndex);

          // update value in model
          this._data[rowIndex].items[colIndex][dataName] = dataValue;

          // TODO if value really changed maybe need to inform widget to update it
          // TODO when GBC-3930 will be done

          // debug
          //console.log("updateDataModel(" + data + "," + rowIndex + "," + colIndex + ")");
          //console.log(this._data);
        },

        /**
         * Update row data
         * @param {number} rowIndex - row index
         * @param {number} offset - table offset
         * @param {String} dataName - data name
         * @param {*} dataValue - data value
         */
        updateRowData: function(rowIndex, offset, dataName, dataValue) {
          const currentAUIRowData = this.getAUIRowData((rowIndex - offset));

          if (dataName) {
            // update AUI row data model
            currentAUIRowData[dataName] = dataValue;
          }

          if (rowIndex >= this._data.length) {
            return;
          }

          // update in _data
          this._data[rowIndex][dataName] = dataValue;
        },

        /**
         * Flag rows as VM checked, meaning VM validated them. When a row is VM validated, we have no more reason to blur it later on
         * @param offset
         * @param bufferSize
         */
        vmFlagRows: function(offset, bufferSize) {
          const max = Math.min(this._data.length, (offset + bufferSize));
          for (let i = offset; i < max; i++) {
            this._data[i].vm = true;
          }
        },

        /**
         * Sync current offset of the data model
         * @param offset
         * @param bufferSize
         */
        syncModel: function(offset, bufferSize) {
          const max = Math.min(this._data.length, (offset + bufferSize));
          for (let rowIndex = offset; rowIndex < max; rowIndex++) {
            const row = this._data[rowIndex];
            for (let colIndex = 0; colIndex < row.items.length; colIndex++) {

              // sync valueNodeData in _data model
              const currentValueNodeData = this.getAUIValueData((rowIndex - offset), colIndex);
              const oldData = this._data[rowIndex].items[colIndex];

              // TODO PERF if this._data[rowIndex].vm is false, is it necessary to merge ?
              this._data[rowIndex].items[colIndex] = {
                ...oldData,
                ...currentValueNodeData
              };
            }

            // sync aui rowData in _data model
            const currentAUIRowData = this.getAUIRowData(rowIndex - offset);

            const oldData = this._data[rowIndex];
            this._data[rowIndex] = {
              ...oldData,
              ...currentAUIRowData
            };
          }
        },

        /**
         * Returns data model
         * @returns {Object[]} data model
         */
        getData: function() {
          return this._data;
        }
      };
    });
  });
