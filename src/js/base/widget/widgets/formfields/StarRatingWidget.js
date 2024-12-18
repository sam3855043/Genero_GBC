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

modulum(
  "StarRatingWidget",
  ["SpinEditWidget", "WidgetFactory"],
  function(context, cls) {
    /**
     * Star Rating Widget.
     * @class StarRatingWidget
     * @memberof classes
     * @extends classes.SpinEditWidget
     * @publicdoc Widgets
     */
    cls.StarRatingWidget = context.oo.Class(
      cls.SpinEditWidget,
      function($super) {
        return /** @lends classes.StarRatingWidget.prototype */ {
          __name: "StarRatingWidget",
          _animationFrameOffset: 0,

          /** @type {HTMLElement[]} */
          _ratingStars: null,
          /**
           * The Css class of the stars HTML elements
           * @type {string}
           */
          _ratingStarClass: "rating_star",
          /**
           * The Css class of checked stars HTML elements
           * @type {string}
           */
          _checkedStarClass: "checked",
          /**
           * The Css class of unchecked stars HTML elements
           * @type {string}
           */
          _uncheckedStarClass: "unchecked",
          /**
           * The Css class of stars that can received the hover aspect
           * This is used for CSS performances by not using :not(.disabled) selector
           */
          _hoverableStarClass: "hoverable",

          /**
           * @inheritDoc
           */
          _initElement: function() {
            $super._initElement.call(this);
            this._ratingStars = [];
          },

          /**
           * Emit a click event when clicking on a star
           * @private
           */
          _initStarRating: function() {
            if (this._ratingStars.length === 0 && this._element) {
              this._ratingStars = [];
              // Generate the stars from the min and max value
              for (let starIndex = 0; starIndex < this._max; starIndex += 1) {
                const ratingStar = document.createElement("i");
                if (this._placeholder) {
                  ratingStar.innerHTML = this._placeholder;
                }
                ratingStar.classList.add(this._ratingStarClass);
                ratingStar.setAttribute("data-value", starIndex + 1);
                if (starIndex < this._min) {
                  ratingStar.classList.add(this._checkedStarClass);
                  ratingStar.classList.add("disabled");
                }
                this._ratingStars.push(ratingStar);
                this._element.appendChild(ratingStar);
              }
              this._updateStarVisual();
            }
          },

          /**
           * Used to init stars once all the behaviors are applied
           * As we need min and max value to initialise the star widget
           * @inheritdoc
           */
          _setDOMAttachedOrDetached: function() {
            $super._setDOMAttachedOrDetached.call(this);

            if (this._animationFrameOffset) {
              this._clearAnimationFrame(this._animationFrameOffset);
            }

            this._animationFrameOffset = this._registerAnimationFrame(
              function() {
                this._animationFrameOffset = 0;
                this._initStarRating();
              }.bind(this)
            );
          },

          /**
           * @returns The Css class of the stars elements
           */
          getRatingStarClass: function() {
            return this._ratingStarClass;
          },

          /**
           * @returns The Css class of checked stars HTML elements
           */
          getCheckedStarClass: function() {
            return this._checkedStarClass;
          },

          /**
           * @returns The Css class of unchecked stars HTML elements
           */
          getUncheckedStarClass: function() {
            return this._uncheckedStarClass;
          },

          /**
           * @returns The Css class of stars that can received the css hover aspect
           */
          getHoverableStarClass: function() {
            return this._hoverableStarClass;
          },

          /**
           * @inheritDoc
           */
          setValue: function(value, fromVM = false, cursorPosition = null) {
            $super.setValue.call(this, value, fromVM, cursorPosition);
            this._updateStarVisual();
          },

          /**
           * @inheritdoc
           */
          setMin: function(min) {
            // Override the setMin to prevent min to be below 0 or null
            if (min < 0) {
              this.throwError("valueMinError");
            }
            min = min ? min : 0;
            $super.setMin.call(this, min);
          },

          /**
           * @inheritdoc
           */
          setMax: function(max) {
            // Override the setMax so if no max is set in the genero program, 5 is used
            if (max > 10) {
              this.throwError("valueMaxError");
            }
            max = max ? max : 5;
            $super.setMax.call(this, max);
          },

          /**
           * @inheritdoc
           */
          setStep: function(step) {
            if (step && step !== 1) {
              this.throwError("stepError");
            }
            $super.setStep.call(this, step);
          },

          /**
           * @inheritdoc
           */
          setEnabled: function(enabled) {
            $super.setEnabled.call(this, enabled);
            this._updateStarVisual();
          },

          /**
           * @inheritDoc
           */
          manageMouseClick: function(domEvent) {
            this._onRequestFocus(domEvent);

            const target = domEvent.target;
            const clickedIndex = this._ratingStars.findIndex(
              (starElem) => starElem === target
            );
            if (clickedIndex > -1 && clickedIndex >= this.getMin()) {
              const clickedValue = Number(target.getAttribute("data-value"));
              this._inputElement.value =
                Number(this._inputElement.value) === clickedValue ?
                this.getMin() :
                clickedValue;
              this.emit(
                context.constants.widgetEvents.valueChanged,
                this.getValue()
              );
            }

            return $super.manageMouseClick.call(this, domEvent);
          },

          /**
           * Update the star visual from the _inputElement value
           */
          _updateStarVisual: function() {
            if (!this._ratingStars && !this._inputElement) {
              return;
            }

            const currentValue = Number(this._inputElement.value);
            for (
              let starIndex = 0; starIndex < this._ratingStars.length; starIndex++
            ) {
              if (starIndex < this.getMin()) {
                continue;
              }

              const starElement = this._ratingStars[starIndex];

              starElement.removeClass(this._uncheckedStarClass);
              starElement.removeClass(this._checkedStarClass);
              starElement.removeClass(this._hoverableStarClass);

              starElement.addClass(
                starIndex < currentValue ?
                this._checkedStarClass :
                this._uncheckedStarClass
              );
              if (this._enabled) {
                starElement.addClass(this._hoverableStarClass);
              }
            }
          },

          /**
           * Stop the with a Fail message
           * @param {string} error The error code under gwc.starRating in the i18next files
           */
          throwError: function(error) {
            const currentApp =
              gbc.SessionService.getCurrent() &&
              gbc.SessionService.getCurrent().getCurrentApplication();
            if (currentApp) {
              currentApp.fail(i18next.t(`gwc.starRating.${error}`));
            }
          },

          /**
           * Destroy Star Rating instances and unbind events
           */
          destroy: function() {
            this._starRating = null;
            $super.destroy.call(this);
          },
        };
      }
    );

    cls.WidgetFactory.registerBuilder(
      "SpinEdit[customWidget=starRating]",
      cls.StarRatingWidget
    );
    cls.WidgetFactory.registerBuilder("StarRating", cls.StarRatingWidget);
  }
);
