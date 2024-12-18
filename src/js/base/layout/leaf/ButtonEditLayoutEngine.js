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

modulum('ButtonEditLayoutEngine', ['LeafLayoutEngine'],
  function(context, cls) {

    /**
     * @class EditLayoutEngine
     * @memberOf classes
     * @extends classes.LayoutEngineBase
     */
    cls.ButtonEditLayoutEngine = context.oo.Class(cls.LeafLayoutEngine, function($super) {
      return /** @lends classes.ButtonEditLayoutEngine.prototype */ {
        __name: "ButtonEditLayoutEngine",

        /**
         * TODO remove after fixing GBC-4777
         * This patch can also be applied to ComboBox and EditWidget
         * @inheritDoc
         */
        setHint: function(widthHint, heightHint) {
          let editedWidthHint = widthHint;
          if ((typeof(widthHint) === "undefined") || widthHint === null || widthHint === "") {
            editedWidthHint = 1;
          } else if (this._widget.isInTable()) {
            editedWidthHint = widthHint + 2;
          }

          this._widget.getLayoutInformation().setSizeHint(
            editedWidthHint,
            ((typeof(heightHint) === "undefined") || heightHint === null || heightHint === "") ? 1 : heightHint
          );
        },
      };
    });
  });
