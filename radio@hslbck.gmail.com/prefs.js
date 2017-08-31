/*
    Copyright (C) 2016 - 2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Lang = imports.lang;

const SETTING_USE_MEDIA_KEYS = 'use-media-keys';
const SETTING_TITLE_NOTIFICATION = 'title-notification';
const SETTING_SHOW_TITLE_IN_PANEL = 'show-title-in-panel';
const SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER = 'show-volume-adjustment-slider';

const RadioPrefsWidget = new GObject.Class({
    Name: 'RadioPrefsWidget',
    GTypeName: 'RadioPrefsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
        this.parent(params);
        this.orientation = Gtk.Orientation.VERTICAL;
        this.margin = 12;
        this._settings = Convenience.getSettings();

        this._widgets = {};

        this._widgets.box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                            margin: 20,
                            margin_top: 10,
                            expand: true,
                             spacing: 10
        });

        this._addTitleNotificationsSwitch();
        this._addShowTitleInPanelSwitch();
        this._addEnableMediaKeysSwitch();
	this._addShowVolumeAdjustmentSliderSwitch();

        this.add(this._widgets.box);
    },

    _addTitleNotificationsSwitch: function() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show title notifications"),
                                        xalign: 0});
        this._widgets.titleNotificationsSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_TITLE_NOTIFICATION)});

        hbox.pack_start(label, true, true, 0);
        hbox.add(this._widgets.titleNotificationsSwitch);

        this._widgets.box.add(hbox);

        this._widgets.titleNotificationsSwitch.connect('notify::active', Lang.bind(this, function(button) {
            this._settings.set_boolean(SETTING_TITLE_NOTIFICATION, button.get_active());
        }));
    },

    _addShowTitleInPanelSwitch: function() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show title notification in the panel"),
                                        xalign: 0});
        this._widgets.titleInPanelSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)});

        hbox.pack_start(label, true, true, 0);
        hbox.add(this._widgets.titleInPanelSwitch);

        this._widgets.box.add(hbox);

        this._widgets.titleInPanelSwitch.connect('notify::active', Lang.bind(this, function(button) {
            this._settings.set_boolean(SETTING_SHOW_TITLE_IN_PANEL, button.get_active());
        }));
    },

    _addEnableMediaKeysSwitch: function() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Enable Play/Stop Media Keys"),
                                        xalign: 0});
        this._widgets.mediaKeySwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)});

        hbox.pack_start(label, true, true, 0);
        hbox.add(this._widgets.mediaKeySwitch);

        this._widgets.box.add(hbox);

        this._widgets.mediaKeySwitch.connect('notify::active', Lang.bind(this, function(button) {
            this._settings.set_boolean(SETTING_USE_MEDIA_KEYS, button.get_active());
        }));
    },

    _addShowVolumeAdjustmentSliderSwitch: function() {
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        let label = new Gtk.Label({label: _("Show volume adjustment slider in menu"),
                                        xalign: 0});
        this._widgets.volumeAdjustmentSliderSwitch = new Gtk.Switch({active: this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)});

        hbox.pack_start(label, true, true, 0);
        hbox.add(this._widgets.volumeAdjustmentSliderSwitch);

        this._widgets.box.add(hbox);

        this._widgets.volumeAdjustmentSliderSwitch.connect('notify::active', Lang.bind(this, function(button) {
            this._settings.set_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER, button.get_active());
        }));
    }
});

function init() {
    Convenience.initTranslations("radio@hslbck.gmail.com");
}

function buildPrefsWidget() {
    let widget = new RadioPrefsWidget();
    widget.show_all();

    return widget;
}
