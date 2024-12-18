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

(function(w) {
  const modules = [];
  let resolvedModules = 0;
  const loadedModules = {};
  let injection = [];
  const loadModule = function(module) {
    module.exec.apply(w, injection);
  };
  const resolve = function() {
    let moduleIndex = 0;
    for (;;) {
      if (moduleIndex >= modules.length) {
        break;
      }
      const module = modules[moduleIndex];
      if (module) {
        let dependencyIndex = 0;
        for (;;) {
          if (!module.after || dependencyIndex >= module.after.length) {
            break;
          }
          const dependency = module.after[dependencyIndex];
          if (dependency && loadedModules[dependency]) {
            module.after[dependencyIndex] = null;
            module.dependencyResolved++;
          }
          dependencyIndex++;

        }
        if (module.after.length === module.dependencyResolved) {
          loadedModules[module.id] = true;
          loadModule(module);
          modules[moduleIndex] = null;
          resolvedModules++;
        } else {
          moduleIndex++;
        }
      } else {
        moduleIndex++;
      }
    }
  };
  const error = function() {
    let text = "Modulum.js: Cyclic dependency detected.\n";
    let i = 0,
      j = 0;
    for (; i < modules.length; i++) {
      if (modules[i]) {
        text += modules[i].id + " depends on [" + modules[i].after.join(", ") + "]\n";
        j++;
        if (j > 10) {
          text += "[...]";
          break;
        }
      }
    }
    window.critical.display(text);
  };
  const checkLoadedDependencies = function(module) {
    let result = true;
    const deps = module.after;
    let i = 0;
    const len = deps.length;
    for (; i < len; i++) {
      if (deps[i] && !loadedModules[deps[i]]) {
        result = false;
        break;
      } else {
        deps[i] = null;
        module.dependencyResolved++;
      }
    }
    return result;
  };

  /**
   * @typedef {Function} ModulumExec
   * @param {gbc} arg1
   * @param {classes} arg2
   */

  /**
   *
   * @param {string} module module name
   * @param {string[]|ModulumExec} dependencies module dependencies
   * @param {?ModulumExec=} exec module content
   */
  w.modulum = function(module, dependencies, exec) {
    if (!exec) {
      exec = dependencies;
      dependencies = null;
    }
    const mod = {
      id: module,
      after: dependencies,
      exec: exec,
      dependencyResolved: 0
    };
    if (!mod.after || checkLoadedDependencies(mod)) {
      loadedModules[mod.id] = true;
      loadModule(mod);
      modules.push(null);
      resolvedModules++;
    } else {
      modules.push(mod);
    }
  };

  /**
   *
   * @param {gbc} arg1 gbc context
   * @param {classes} arg2 classes context
   */
  w.modulum.inject = function(arg1, arg2) {
    injection = [arg1, arg2];
  };
  w.modulum.assemble = function() {
    let loaded = resolvedModules;
    while (loaded < modules.length) {
      resolve();
      if (loaded === resolvedModules) {
        error();
        throw new Error("cyclic dependencies");
      }
      loaded = resolvedModules;
    }
  };
})(window);
