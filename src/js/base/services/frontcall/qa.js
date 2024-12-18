/// FOURJS_START_COPYRIGHT(D,2016)
/// Property of Four Js*
/// (c) Copyright Four Js 2016, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

modulum('FrontCallService.modules.qa', ['FrontCallService'],
  function(context, cls) {
    /**
     * Frontcall service QA related module
     * @instance qa
     * @memberOf gbc.FrontCallService.modules
     */
    context.FrontCallService.modules.qa = {

      /**
       * First function to call in a QA environement
       * @return {Array}
       */
      startqa: function() {
        gbc.qaMode = true;
        return [''];
      },

      /**
       * Clean GBC Stored Settings to unsure clean environement
       * @return {Array}
       */
      removestoredsettings: function() {
        window.gbc.StoredSettingsService.reset();
        return [''];
      },

      /**
       * Get an attribute according to its name
       * @param {Number} id of the element
       * @param {String} name of the attribute to get
       * @return {Array}
       */
      getattribute: function(id, name) {
        const element = document.querySelector('[data-aui-id="' + JSON.parse(id).id + '"]');

        if (element) {
          switch (name) {
            case "width":
              return [element.getBoundingClientRect().width];
            case "height":
              return [element.getBoundingClientRect().height];
            case "text":
              const textHolder = element.querySelector(".gbc-label-text-container") ||
                element.querySelector(".gbc_dataContentPlaceholder") || element;
              return [(textHolder.value || textHolder.textContent).trim()];
            case "image":
              const img = element.querySelector("img");
              const cssBg = window.getComputedStyle(element).backgroundImage;
              const urlRegex = /url\("(.*)"\)/.exec(cssBg);
              const url = (urlRegex && urlRegex.length >= 1) ? urlRegex[1] : "";
              return [(img && img.attributes.src.value) ? img.attributes.src.value : url];
            default:
              console.log("getAttribute not supported property:", name);
          }
        }
        console.log("getAttribute", id, name);

        return [''];
      }
    };
  }
);
