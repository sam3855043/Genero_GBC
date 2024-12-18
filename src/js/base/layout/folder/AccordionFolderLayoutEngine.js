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

modulum('AccordionFolderLayoutEngine', ['FolderLayoutEngine'],
  /**
   * @param {gbc} context
   * @param {classes} cls
   */
  function(context, cls) {
    /**
     * @class AccordionFolderLayoutEngine
     * @memberOf classes
     * @extends classes.FolderLayoutEngine
     */
    cls.AccordionFolderLayoutEngine = context.oo.Class(cls.FolderLayoutEngine, function($super) {
      return /** @lends classes.AccordionFolderLayoutEngine.prototype */ {
        __name: "AccordionFolderLayoutEngine",

        /**
         * @inheritDoc
         */
        measureDecoration: function() {
          let decorationHeight = 0;
          let decorationWidth = 0;
          let pageDecorationHeight = 0;
          let pageDecorationWidth = 0;
          const visiblePageCount = this._widget.getVisiblePageCount();
          if (visiblePageCount > 0) {
            const pageWithDecorationElement = this._widget.getElement().child("gbc_AccordionElement");
            const pageWithoutDecorationElement = pageWithDecorationElement.child("gbc_AccordionPage");

            const oneTitleHeight = pageWithDecorationElement.clientHeight - pageWithoutDecorationElement.clientHeight;
            decorationHeight = visiblePageCount * oneTitleHeight;
            decorationWidth = pageWithDecorationElement.clientWidth - pageWithoutDecorationElement.clientWidth;

            const pageMargin = parseInt(context.ThemeService.getValue("gbc-AccordionFolderWidget-page-margin"), 10);

            pageDecorationWidth = pageMargin * 2;
            pageDecorationHeight = pageMargin * 2;
          }

          this._getLayoutInfo().setDecorating(
            this._widget.getElement().clientWidth - this._widget.getContainerElement().clientWidth + decorationWidth +
            pageDecorationWidth,
            this._widget.getElement().clientHeight - this._widget.getContainerElement().clientHeight + decorationHeight +
            pageDecorationHeight
          );

          for (const element of this._widget._children) {
            element.getLayoutInformation().setDecorating(
              pageDecorationWidth,
              pageDecorationHeight
            );
          }
        },

        /**
         * @inheritDoc
         */
        prepareApplyLayout: function() {
          $super.prepareApplyLayout.call(this);

          const visiblePageCount = this._widget.getVisiblePageCount();
          let pageHeight = 0;

          if (visiblePageCount > 0) {
            // fix height of current page (this is necessary for css animation (transition on height))
            pageHeight = this._widget.getCurrentPage().getLayoutInformation().getAvailable().getHeight();
            pageHeight = pageHeight + this._widget.getCurrentPage().getLayoutInformation().getDecorating().getHeight();
          }

          this._widget.setStyle({
            selector: ".gbc_AccordionPage.currentPage",
            appliesOnRoot: false
          }, {
            "height": pageHeight + "px"
          });
        },
      };
    });
  });
