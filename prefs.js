const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Lang = imports.lang;

const SETTING_USE_MEDIA_KEYS = 'use-media-keys';

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

        this._addEnableMediaKeysSwitch();

        this.add(this._widgets.box);
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
