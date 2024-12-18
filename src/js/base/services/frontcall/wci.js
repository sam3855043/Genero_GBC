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

modulum('FrontCallService.modules.wci', ['FrontCallService'],
  function(context, cls) {

    /**
     * MDI frontcalls
     * @instance localStorage
     * @memberOf gbc.FrontCallService.modules
     */
    context.FrontCallService.modules.wci = /** @lends gbc.FrontCallService.modules.wci */ {

      /**
       * Get the number of children of a container.
       * @param {string} containerName window container name
       * @returns {Array} children count
       */
      //http://localhost:6394/ua/r/GBC-2556
      childCount: function(containerName) {
        const session = context.SessionService.getCurrent();
        const appList = session.getNavigationManager().getApplications();
        let res = 0;

        appList.forEach((app) => {
          const container = app.uiNode().attribute("container");
          const type = app.uiNode().attribute("type");

          if (type === "child" && container === containerName) {
            res += 1;
          }
        });

        return [res];
      },

      /**
       * Get the number of child instances for a given program name in the specified container
       * @param {string} containerName window container name
       * @param {string} name program name
       * @returns {Array}
       */
      childInstances: function(containerName, name) {
        const session = context.SessionService.getCurrent();
        const appList = session.getNavigationManager().getApplications();
        let res = 0;

        appList.forEach((app) => {
          const container = app.uiNode().attribute("container");
          const type = app.uiNode().attribute("type");
          const uiName = app.uiNode().attribute("name");

          if (type === "child" && container === containerName && uiName === name) {
            res++;
          }
        });

        return [res];
      }
    };
  }
);
