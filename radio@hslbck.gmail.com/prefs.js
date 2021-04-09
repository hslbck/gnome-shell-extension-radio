/*
    Copyright (C) 2016 - 2019 hslbck <hslbck@gmail.com>
    Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

const SETTING_USE_MEDIA_KEYS = 'use-media-keys';
const SETTING_TITLE_NOTIFICATION = 'title-notification';
const SETTING_SHOW_TITLE_IN_PANEL = 'show-title-in-panel';
const SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER = 'show-volume-adjustment-slider';
const SETTING_ENABLE_SEARCH_PROVIDER = 'enable-search-provider';

var RadioPrefsWidget = GObject.registerClass(
    class RadioPrefsWidget extends Gtk.Grid {

    _init(params) {
        super._init(params);
        this.orientation = Gtk.Orientation.VERTICAL;
        this.margin = 12;
        this._settings = ExtensionUtils.getSettings();

        this._widgets = {};

        this._widgets.box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                            "margin-start": 20,
                            "margin-end": 20,
                            "margin-top": 10,
                            "margin-bottom": 20,
                            "spacing": 10
        });

        this._addTitleNotificationsSwitch();
        this._addShowTitleInPanelSwitch();
        this._addEnableMediaKeysSwitch();
	this._addShowVolumeAdjustmentSliderSwitch();
        this._addEnableSearchProviderSwitch();

        this.attach(this._widgets.box, 0, 0, 1, 1);
    }

    _addTitleNotificationsSwitch() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show title notifications"),
                                        "xalign": 0,
                                        "hexpand": true
        });
        this._widgets.titleNotificationsSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_TITLE_NOTIFICATION)});

        hbox.prepend(label);
        hbox.append(this._widgets.titleNotificationsSwitch);

        this._widgets.box.append(hbox);

        this._widgets.titleNotificationsSwitch.connect('notify::active', (button) => {
            this._settings.set_boolean(SETTING_TITLE_NOTIFICATION, button.get_active());
        });
    }

    _addShowTitleInPanelSwitch() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show title notification in the panel"),
                                        "xalign": 0,
                                        "hexpand": true
        });
        this._widgets.titleInPanelSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)});

        hbox.prepend(label);
        hbox.append(this._widgets.titleInPanelSwitch);

        this._widgets.box.append(hbox);

        this._widgets.titleInPanelSwitch.connect('notify::active', (button) => {
            this._settings.set_boolean(SETTING_SHOW_TITLE_IN_PANEL, button.get_active());
        });
    }

    _addEnableMediaKeysSwitch() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Enable Play/Stop Media Keys"),
                                        "xalign": 0,
                                        "hexpand": true
        });
        this._widgets.mediaKeySwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)});

        hbox.prepend(label);
        hbox.append(this._widgets.mediaKeySwitch);

        this._widgets.box.append(hbox);

        this._widgets.mediaKeySwitch.connect('notify::active', (button) => {
            this._settings.set_boolean(SETTING_USE_MEDIA_KEYS, button.get_active());
        });
    }

    _addShowVolumeAdjustmentSliderSwitch() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show volume adjustment slider in menu"),
                                        "xalign": 0,
                                        "hexpand": true
        });
        this._widgets.volumeAdjustmentSliderSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)});

        hbox.prepend(label);
        hbox.append(this._widgets.volumeAdjustmentSliderSwitch);

        this._widgets.box.append(hbox);

        this._widgets.volumeAdjustmentSliderSwitch.connect('notify::active', (button) => {
            this._settings.set_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER, button.get_active());
        });
    }

    _addEnableSearchProviderSwitch() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Enable as search provider for GNOME Shell"),
                                        "xalign": 0,
                                        "hexpand": true
        });
        this._widgets.searchProviderSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_ENABLE_SEARCH_PROVIDER)});

        hbox.prepend(label);
        hbox.append(this._widgets.searchProviderSwitch);

        this._widgets.box.append(hbox);

        this._widgets.searchProviderSwitch.connect('notify::active', (button) => {
            this._settings.set_boolean(SETTING_ENABLE_SEARCH_PROVIDER, button.get_active());
        });
    }
});

function init() {
    ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
    let widget = new RadioPrefsWidget();

    return widget;
}
