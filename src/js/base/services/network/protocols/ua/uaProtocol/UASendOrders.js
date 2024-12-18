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

(
  function(context, cls) {
    /**
     * @class UASendOrders
     * @memberOf classes
     */
    cls.UASendOrders = context.oo.StaticClass(
      /** @lends classes.UASendOrders */
      {
        run: function(orders, application, callback, httpOptions) {
          for (const element of orders) {
            if (element.lazyResolve) {
              element.lazyResolve();
            }
          }
          const data = cls.AuiProtocolWriter.translate({
            type: "om",
            order: application.info().auiOrder++,
            orders: orders
          }, application);
          application.model.logFireEvent(data);
          cls.UANetwork.auiOrder(application, callback, data, httpOptions);
        }
      });
  })(gbc, gbc.classes);
