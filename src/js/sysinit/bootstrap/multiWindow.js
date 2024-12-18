/// FOURJS_START_COPYRIGHT(D,2020)
/// Property of Four Js*
/// (c) Copyright Four Js 2020, 2024. All Rights Reserved.
/// * Trademark of Four Js Development Tools Europe Ltd
///   in the United States and elsewhere
///
/// This file can be modified by licensees according to the
/// product manual.
/// FOURJS_END_COPYRIGHT

"use strict";

(function(context) {
  const debug = false;

  const data = context._multiWindowData = {};

  /* jshint -W106 */
  data.uid = context._gbc_uid = "window@" + String.random();
  data.directChildren = [];
  data.parentWindow = context.opener;

  if (debug) {
    context.console.log(`Initialized ${data.uid}`);
  }

  try {
    data.isRoot = !data.parentWindow || !data.parentWindow._multiWindowData;
  } catch (e) {
    data.isRoot = true;
  }
  if (data.isRoot) {
    data.rootWindow = context;
    data.treeChildren = [];
    data.treeCount = 1;
  }

  Object.defineProperty(context, "rootMultiWindow", {
    get: function() {
      return data.rootWindow;
    },
    enumerable: true,
    configurable: false
  });

  /**
   * register direct child
   * @param {window} win
   * @private
   */
  data._registerDirectChild = function(win) {
    data.directChildren.push(win);
    if (debug) {
      context.console.log(`${data.uid} added direct ${win._multiWindowData.uid}`);
    }
  };

  /**
   * register root child
   * @param {window} win
   * @private
   */
  data._registerRootChild = function(win) {
    data.treeChildren.push(win);
    data.treeCount++;
    win._multiWindowData.rootWindow = context;
    if (debug) {
      context.console.log(`${data.uid} added tree ${win._multiWindowData.uid}`);
    }
  };

  /**
   * register child window
   * @param {window} win
   * @param _notDirect
   */
  data.registerChildWindow = function(win, _notDirect) {
    if (!_notDirect) {
      data._registerDirectChild(win);
    }
    if (data.isRoot) {
      data._registerRootChild(win);
    } else {
      data.parentWindow._multiWindowData.registerChildWindow(win, true);
    }
  };

  /**
   *
   * @param {function} finder
   * @returns {Window|T}
   */
  data.findWindowBy = function(finder) {
    const root = data.rootWindow;
    return finder(root) ? root : root._multiWindowData.treeChildren.find(finder);
  };

  context.addEventListener("unload", () => {
    if (data.isRoot) {
      let newRootWindow = data.directChildren[0];
      if (newRootWindow) {
        let evt = new CustomEvent("multiWindowUnloadRoot", {
          detail: {
            context,
            data
          }
        });
        newRootWindow.dispatchEvent(evt);
      }
    } else {
      let parentWindow = data.parentWindow;
      if (parentWindow) {
        let evt = new CustomEvent("multiWindowUnload", {
          detail: {
            context,
            data
          }
        });
        parentWindow.dispatchEvent(evt);
      }
    }
  }, {
    once: true
  });

  context.addEventListener("multiWindowUnloadRoot", (evt) => {
    if (debug) {
      context.console.log(`getting root from ${evt.detail.data.uid}`);
    }
    for (let w of evt.detail.data.directChildren) {
      if (w !== context) {
        w._multiWindowData.parentWindow = context;
        data.directChildren.push(w);
        if (debug) {
          context.console.log(`${data.uid} re-attached direct ${w._multiWindowData.uid}`);
        }
      }
    }
    for (let w of evt.detail.data.treeChildren) {
      w._multiWindowData.rootWindow = context;
      if (debug) {
        context.console.log(`${data.uid} re-attached tree ${w._multiWindowData.uid}`);
      }
    }
    data.treeChildren = evt.detail.data.treeChildren.splice();
    data.treeChildren.remove(context);
    data.treeCount = evt.detail.data.treeCount - 1;
    if (debug) {
      context.console.log(`got root from ${evt.detail.data.uid}`);
    }
  });

  context.addEventListener("multiWindowUnload", evt => {
    for (let w of evt.detail.data.directChildren) {
      w._multiWindowData.parentWindow = context;
      data.directChildren.push(w);
      if (debug) {
        context.console.log(`${data.uid} re-attached direct ${w._multiWindowData.uid}`);
      }
    }
    data.directChildren.remove(evt.detail.context);
    if (debug) {
      context.console.log(`${data.uid} removed direct ${evt.detail.data.uid}`);
    }
    data.rootWindow._multiWindowData.treeChildren.remove(evt.detail.context);
    data.rootWindow._multiWindowData.treeCount--;
    evt.detail.data.rootWindow = null;
    if (debug) {
      data.rootWindow.console.log(`${data.rootWindow._multiWindowData.uid} removed tree ${evt.detail.data.uid}`);
    }
  });
  try {
    if (data.parentWindow && data.parentWindow._multiWindowData) {
      data.parentWindow._multiWindowData.registerChildWindow(context);
    }
  } catch (e) {}
})(window);
