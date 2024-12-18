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

modulum('SettingsWidget', ['WidgetGroupBase', 'WidgetFactory'],
  function(context, cls) {

    /**
     * @class SettingsWidget
     * @memberOf classes
     * @extends classes.WidgetBase
     */
    cls.SettingsWidget = context.oo.Class(cls.WidgetGroupBase, function($super) {
      return /** @lends classes.SettingsWidget.prototype */ {
        __name: "SettingsWidget",

        _lngWidget: null,
        _lngDefaultWidget: null,
        _themeWidget: null,
        _themeSchemeWidget: null,
        _themeHandleRegistration: null,
        _enableWidget: null,
        _resetWidget: null,
        _msgWidget: null,
        _latencyWidget: null,
        _loglevelWidget: null,
        _logtypesWidget: null,

        _lngElement: null,
        _themeElement: null,
        _enableElement: null,
        _resetElement: null,
        _resetConfirm: false,

        _storeSettingsEnabled: false,

        _initElement: function() {
          this._ignoreLayout = true;
          $super._initElement.call(this);

          this._storeSettingsEnabled = gbc.StoredSettingsService.areEnabled();

          //Language widget
          this._lngDefaultWidget = cls.WidgetFactory.createWidget("CheckBoxWidget", this.getBuildParameters());
          this._lngDefaultWidget.setEnabled(true);
          this._lngDefaultWidget.setText(i18next.t("gwc.storedSettings.defaultLng"));
          const isDefault = Boolean(gbc.StoredSettingsService.getSettings("gwc.app.defaultLocale"));
          this._lngDefaultWidget.setValue(isDefault);

          this._lngWidget = cls.WidgetFactory.createWidget("ComboBoxWidget", this.getBuildParameters());
          this._lngWidget.setNotNull(true);
          this._lngWidget.setEnabled(!isDefault);

          const allLng = gbc.I18NService.getAllLng();
          this._lngWidget.setItems(allLng.map((lng) => {
            return {
              text: lng.language,
              value: lng.locale
            };
          }));
          this._lngWidget.setValue(context.StoredSettingsService.getLanguage());

          this._lngWidget.when(context.constants.widgetEvents.click, () => {
            this._lngWidget.openDropDown();
          });
          this._lngWidget.when(context.constants.widgetEvents.valueChanged, () => {
            const lng = this._lngWidget.getValue();
            this.setLanguage(lng);
            this._updateThemeList();
          });

          this._lngDefaultWidget.when(context.constants.widgetEvents.click, () => {
            gbc.StoredSettingsService.setSettings("gwc.app.defaultLocale", this._lngDefaultWidget.getValue() === true);
            this._lngWidget.setEnabled(!this._lngDefaultWidget.getValue());

            if (this._lngDefaultWidget.getValue()) {
              this.setLanguage(gbc.I18NService.getBrowserLanguage());
            } else {
              this._lngWidget.emit(context.constants.widgetEvents.valueChanged, this._lngWidget.getValue());
            }
          });

          // Theme widget
          this._themeSchemeWidget = cls.WidgetFactory.createWidget("CheckBoxWidget", this.getBuildParameters());
          this._themeSchemeWidget.setText(i18next.t("gwc.storedSettings.darkMode"));
          const currentTheme = context.ThemeService.getCurrentTheme();
          this._themeSchemeWidget.setValue(context.ThemeService.isDarkScheme(currentTheme));
          // Disable if no other scheme available for the current theme
          this._themeSchemeWidget.setEnabled(context.ThemeService.hasMultipleSchemes(currentTheme));

          this._themeWidget = cls.WidgetFactory.createWidget("ComboBoxWidget", this.getBuildParameters());
          this._themeWidget.setNotNull(true);
          this._updateThemeList();
          this._themeHandleRegistration = context.ThemeService.whenThemeChanged(() => {
            this._themeWidget.setValue(context.ThemeService.getLightSchemeName(context.ThemeService.getCurrentTheme()), true);
          });
          this._themeWidget.when(context.constants.widgetEvents.click, () => {
            this._themeWidget.openDropDown();
          });
          this._themeWidget.when(context.constants.widgetEvents.valueChanged, () => {
            let theme = this._themeWidget.getValue();
            if (this._themeSchemeWidget.getValue()) {
              // Keep dark theme if checked
              theme = context.ThemeService.getDarkSchemeName(theme);
            }
            context.ThemeService.loadTheme(theme, function() {});
            this._themeSchemeWidget.setValue(context.ThemeService.isDarkScheme(theme));
            this._themeSchemeWidget.setEnabled(context.ThemeService.hasMultipleSchemes(theme));
          });
          this._themeSchemeWidget.when(context.constants.widgetEvents.click, () => {
            if (this._themeSchemeWidget.getValue()) {
              // Checked = load dark theme
              context.ThemeService.loadTheme(context.ThemeService.getDarkSchemeName(context.ThemeService.getCurrentTheme()));
            } else {
              context.ThemeService.loadTheme(context.ThemeService.getLightSchemeName(context.ThemeService.getCurrentTheme()));
            }
          });

          // Enable StoredSettings button
          this._enableWidget = cls.WidgetFactory.createWidget("CheckBoxWidget", this.getBuildParameters());
          this._enableWidget.setEnabled(true);
          this._enableWidget.setText(i18next.t("gwc.storedSettings.enable"));
          this.enableStoredSettings(this._storeSettingsEnabled);
          this._enableWidget.when(context.constants.widgetEvents.click, () => {
            this.toggleStoredSettings();
          });

          // Reset StoredSettings button
          this._resetWidget = cls.WidgetFactory.createWidget("ButtonWidget", this.getBuildParameters());
          this._resetWidget.setText(i18next.t("gwc.storedSettings.reset"));
          this._resetWidget.when(context.constants.widgetEvents.click, () => {
            this.resetStoredSettings(this._resetConfirm);
          });

          // Get containers for each widget
          this._lngElement = this._element.getElementsByClassName("lngSettings")[0];
          this._themeElement = this._element.getElementsByClassName("themeSettings")[0];
          this._storedSettingsElement = this._element.getElementsByClassName("storedSettings")[0];
          this._aboutElement = this._element.getElementsByClassName("aboutSettings")[0];

          // Add widgets in each container
          this._lngElement.appendChild(this._lngWidget.getElement());
          this._lngElement.appendChild(this._lngDefaultWidget.getElement());
          this._themeElement.appendChild(this._themeWidget.getElement());
          this._themeElement.appendChild(this._themeSchemeWidget.getElement());
          this._storedSettingsElement.appendChild(this._resetWidget.getElement());
          this._storedSettingsElement.appendChild(this._enableWidget.getElement());

          this._msgWidget = this._element.querySelector(".message");

          if (gbc.LocalSettingsService._quotaExceededError) {
            this._msgWidget.removeClass("hidden");
          }
          gbc.LocalSettingsService._eventListener.when("QuotaExceededError", () => {
            this._msgWidget.removeClass("hidden");
          });

          // Debug & QA
          if (context.DebugService.isActive()) {
            this._latencyWidget = cls.WidgetFactory.createWidget("EditWidget", this.getBuildParameters());
            this._latencyWidget.setEnabled(true);
            this._latencyWidget.setType("number");
            const minDuration = gbc.SessionService.getCurrent() &&
              gbc.SessionService.getCurrent().getCurrentApplication() &&
              gbc.SessionService.getCurrent().getCurrentApplication().protocolInterface.getNetworkDelay() || 0;
            this._latencyWidget.setValue("" + minDuration);
            this._latencyWidget.getInputElement().on('input', () => {
              const val = parseInt(this._latencyWidget.getValue(), 10);
              if (val > 0) {
                gbc.SessionService.getCurrent().getCurrentApplication().protocolInterface.setNetworkDelay(val);
              }
            });

            this._element.getElementsByClassName("debugTopic")[0].removeClass("hidden");
            this._debugLatencyElement = this._element.getElementsByClassName("latency")[0];
            this._debugLatencyElement.appendChild(this._latencyWidget.getElement());

            this._loglevelWidget = cls.WidgetFactory.createWidget("LogLevelSelector", this.getBuildParameters());
            this._loglevelWidget.when("loglevel", (evt, src, level) => {
              context.LogService.changeLevel(level);
              context.StoredSettingsService.setLoglevel(level);
            });
            this._debugLoglevelElement = this._element.getElementsByClassName("loglevel")[0];
            this._debugLoglevelElement.appendChild(this._loglevelWidget.getElement());

            this._logtypesWidget = cls.WidgetFactory.createWidget("LogTypesSelector", this.getBuildParameters());
            this._logtypesWidget.when("logtype", (evt, src, type) => {
              context.LogService.toggleType(type);
              const currentTypes = context.LogService.getActiveLogTypes();
              context.StoredSettingsService.setLogtypes(currentTypes);
              this._logtypesWidget.setCurrentTypes(currentTypes);
            });
            this._debugLogtypesElement = this._element.getElementsByClassName("logtypes")[0];
            this._debugLogtypesElement.appendChild(this._logtypesWidget.getElement());

            const fglElement = this._element.getElementsByClassName("field_fgl")[0];
            fglElement.textContent = gbc.info().runtimeVersion;

            const gasElement = this._element.getElementsByClassName("field_gas")[0];
            gasElement.textContent = gbc.info().serverVersion;

            const platformElement = this._element.getElementsByClassName("field_platform")[0];
            platformElement.textContent = gbc.info().platform;
          } else {
            this._element.getElementsByClassName("debug-info-app")[0].remove();
          }

          // Display GBC information
          const versionElement = this._element.getElementsByClassName("field_version")[0];
          versionElement.textContent = context.version;

          const copyrightYearElement = this._element.getElementsByClassName("copyright_year")[0];
          copyrightYearElement.textContent = " " + context.copyrightYear;

          const buildElement = this._element.getElementsByClassName("field_build")[0];
          buildElement.textContent = context.build + (context.dirtyFlag || "");

          if (context.tag === "dev-snapshot") {
            const tagElement = this._element.getElementsByClassName("field_tag")[0];
            tagElement.textContent = "(dev-snapshot)";
          }

          const logoElement = this._element.getElementsByClassName("field_logo")[0];
          logoElement.setAttribute("src", context.ThemeService.getResource("img/logo.png"));
          logoElement.setAttribute("alt", "Genero Browser Client");
        },

        /**
         * @inheritDoc
         */
        destroy: function() {
          if (this._themeHandleRegistration) {
            this._themeHandleRegistration();
            this._themeHandleRegistration = null;
          }
          if (this._lngWidget) {
            this._lngWidget.destroy();
            this._lngWidget = null;
          }
          if (this._lngDefaultWidget) {
            this._lngDefaultWidget.destroy();
            this._lngDefaultWidget = null;
          }
          if (this._themeWidget) {
            this._themeWidget.destroy();
            this._themeWidget = null;
          }
          if (this._themeSchemeWidget) {
            this._themeSchemeWidget.destroy();
            this._themeSchemeWidget = null;
          }
          if (this._enableWidget) {
            this._enableWidget.destroy();
            this._enableWidget = null;
          }
          if (this._resetWidget) {
            this._resetWidget.destroy();
            this._resetWidget = null;
          }
          if (this._latencyWidget) {
            this._latencyWidget.destroy();
            this._latencyWidget = null;
          }
          if (this._loglevelWidget) {
            this._loglevelWidget.destroy();
            this._loglevelWidget = null;
          }
          if (this._logtypesWidget) {
            this._logtypesWidget.destroy();
            this._logtypesWidget = null;
          }

          this._msgWidget = null;
          $super.destroy.call(this);
        },

        _initLayout: function() {
          // no layout
        },

        _restoreDefaultButton: function() {
          // Restore default button
          this._resetConfirm = false;
          this._resetWidget.setText(i18next.t("gwc.storedSettings.reset"));
          this._resetWidget.setEnabled(true);
          this._resetWidget.setBackgroundColor(null);
          this._resetWidget.setColor(null);
        },

        setLanguage: function(lng) {
          gbc.StoredSettingsService.setLanguage(lng);
          this.getParentWidget().setFooter(i18next.t("gwc.storedSettings.changed"));
        },

        toggleStoredSettings: function() {
          if (this._storeSettingsEnabled) {
            this.enableStoredSettings(false);
          } else {
            this.enableStoredSettings(true);
          }
        },

        /**
         *
         * @param status
         */
        enableStoredSettings: function(status) {
          this._enableWidget.setValue(status ? this._enableWidget._checkedValue : this._enableWidget._uncheckedValue);
          this._storeSettingsEnabled = status;
          gbc.StoredSettingsService.enable(status);

        },
        /**
         *
         * @param force if not true, will ask for confirmation
         */
        resetStoredSettings: function(force) {
          // Ask for confirmation first
          if (!force) {
            this._resetWidget.setBackgroundColor(context.ThemeService.getValue("mt-red-200"));
            this._resetWidget.setColor(context.ThemeService.getValue("theme-secondary-color"));
            this._resetWidget.setText(i18next.t("gwc.storedSettings.confirm"));
            this._resetConfirm = true;
          } else { // Reset once confirmed
            gbc.StoredSettingsService.reset();
            this._resetConfirm = false;
            this._resetWidget.setText(i18next.t("gwc.storedSettings.done"));
            this._resetWidget.setEnabled(false);
            this._resetWidget.setBackgroundColor(context.ThemeService.getValue("mt-green-200"));
            this._resetWidget.setColor(context.ThemeService.getValue("theme-secondary-color"));
            this._registerTimeout(() => {
              this._restoreDefaultButton();
            }, 2000);
          }
        },

        _updateThemeList: function() {
          const filteredThemes = context.ThemeService.getAvailableThemes().filter((theme) => {
            return !context.ThemeService.isDarkScheme(theme.name) || !context.ThemeService.hasMultipleSchemes(theme.name);
          });
          this._themeWidget.setItems(filteredThemes.map((theme) => {
            let titleKey = "gwc.main.theme." + theme.title;
            let localizedTitle = i18next.t("gwc.main.theme." + theme.title, {
              lng: window.i18next.language,
              lngs: [window.i18next.language]
            });
            return {
              text: localizedTitle === titleKey ? theme.title : localizedTitle,
              value: theme.name
            };
          }));
          this._themeWidget.setValue(context.ThemeService.getLightSchemeName(context.ThemeService.getCurrentTheme()), true);
          this._themeWidget.setEnabled(filteredThemes.length > 1);

        }
      };
    });
    cls.WidgetFactory.registerBuilder('Settings', cls.SettingsWidget);
  });
