/* jshint esnext:true */
const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;

// import for timer
const Mainloop = imports.mainloop;

// import custom files
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Player = Extension.imports.player;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const ChannelListDialog = Extension.imports.channelListDialog;
const Io = Extension.imports.io;

// translation support
const Convenience = Extension.imports.convenience;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// timer for stream tag
const Interval = 10000; // 10 seconds
let timeoutId = 0;

// icons
const PlayingIcon = "gser-icon-playing-symbolic";
const StoppedIcon = "gser-icon-stopped-symbolic";

// Settings
const SETTING_USE_MEDIA_KEYS = 'use-media-keys';

const RadioMenuButton = new Lang.Class({
    Name: 'Radio Button',
    Extends: PanelMenu.Button,

    _init: function () {
    	this.parent(0.0, Extension.name);

        // read settings
        this._settings = Convenience.getSettings();

        // path for icon
        Gtk.IconTheme.get_default().append_search_path(Extension.dir.get_child('icons').get_path());

        // Icon for the Panel
        this.radioIcon = new St.Icon({
            icon_name: StoppedIcon,
            style_class: 'system-status-icon'
        });


        this.actor.add_actor(this.radioIcon);
        this.actor.add_style_class_name('panel-status-button');

        // get channels from json file
        this.channelList = Io.read();
        this.chas = this.channelList.channels;
        this.lastPlayed = this.channelList.lastplayed;

        // init last played channel
        this.lastPlayedChannel = new Channel.Channel(this.lastPlayed.name, this.lastPlayed.address, false, this.lastPlayed.encoding);

        // init player
        this.player = new Player.Player(this.lastPlayedChannel);

        // Box for the Control Elements
        this.controlsBox = new St.BoxLayout({
            name: 'controlsBox',
            style_class: 'control-box'
        });
        this.tagListBox = new St.BoxLayout({
            name: 'tagListBox',
            style_class: 'control-box'
        });

        // Play and Stop Button Images
        this.playIcon = new St.Icon({
            icon_name: 'media-playback-start-symbolic'
        });
        this.stopIcon = new St.Icon({
            icon_name: 'media-playback-stop-symbolic'
        });

        // Play - Stop Button
        this.playButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });

        // Set the Icon of the Button
        this.playButton.set_child(this.playIcon);

        // Currently Played Label
        this.playLabel = new St.Label({
            text: "Radio",
            style_class: 'play-label'
        });

        // Add Button to the BoxLayout
        this.controlsBox.add(this.playButton);
        this.controlsBox.add(this.playLabel);

        // tagListlabel
        this.tagListLabel = new St.Label({
            text: ""
        });
        this.tagListBox.add(this.tagListLabel);

        // Add ControlsBox to the Menu
        this.menu.box.add_child(this.controlsBox);
        this.menu.box.add_child(this.tagListBox);

        // Connect the Button
        this.playButton.connect('clicked', Lang.bind(this, this._start));

        // PopupSeparator
        let separator1 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator1);

        // Channel SubMenus
        this.favourites = new PopupMenu.PopupSubMenuMenuItem(_("Favourites"));

        // Init and add Channels to the PopupMenu
        this.helperChannelList = [];
        this._initChannels(this.chas);

        this.allChannels = new PopupMenu.PopupMenuItem(_("Channels"));
        this.allChannels.connect('activate', Lang.bind(this, function () {
            this.channelListDialog = new ChannelListDialog.ChannelListDialog(this);
            for (var i in this.helperChannelList) {
                this.channelListDialog._createChannelListItem(this.helperChannelList[i]);
            }
            this.channelListDialog.open();
        }));

        // Add PopupMenuItems to the menu
        this.menu.addMenuItem(this.favourites);
        this.menu.addMenuItem(this.allChannels);

        // PopupSeparator
        let separator2 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator2);

        // settings and add channel item
        this.settingsItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        });
        this.settingsIcon = new St.Icon({
            icon_name: 'preferences-system-symbolic'
        });
        this.settingsButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.settingsButton.set_child(this.settingsIcon);
        this.settingsButton.connect('clicked', Lang.bind(this, function() {
            this.menu.close();
            openPrefs();
        }));

        this.addChannelIcon = new St.Icon({
            icon_name: 'list-add-symbolic'
        });
        this.addChannelButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.addChannelButton.set_child(this.addChannelIcon);
        this.addChannelButton.connect('clicked', Lang.bind(this, function () {
            this.menu.close();
            this.addChannelDialog = new AddChannelDialog.AddChannelDialog();
            this.addChannelDialog.open();
        }));
        this.settingsItem.actor.add(this.settingsButton, {expand: true, x_fill: false});
        this.settingsItem.actor.add(this.addChannelButton, {expand: true, x_fill: false});
        this.menu.addMenuItem(this.settingsItem);

        this.isPlaying = false;
        this.actor.connect('button-press-event', Lang.bind(this, this._middleClick));

        // media keys for registration on startup
        if (this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)) {
            this._registerMediaKeys();
        }

        // media keys setting change
        this._settings.connect("changed::" + SETTING_USE_MEDIA_KEYS, Lang.bind(this, function() {
            if (this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)) {
                this._registerMediaKeys();
            }
            else {
                if (this.proxyId) {
                    this.proxy.disconnect(this.proxyId);
                }
            }
        }));
    },

    _registerMediaKeys: function() {
        this.proxy = Gio.DBusProxy.new_sync(Gio.bus_get_sync(Gio.BusType.SESSION, null),
                                        Gio.DBusProxyFlags.NONE,
                                        null,
                                        'org.gnome.SettingsDaemon',
                                        '/org/gnome/SettingsDaemon/MediaKeys',
                                        'org.gnome.SettingsDaemon.MediaKeys',
                                        null);
        this.proxy.call_sync('GrabMediaPlayerKeys',
                         GLib.Variant.new('(su)', 'Music'),
                         Gio.DBusCallFlags.NONE,
                         -1,
                            null);
        this.proxyId = this.proxy.connect('g-signal', Lang.bind(this, this._handleMediaKeys));
    },

    // handle play/stop media key events
    _handleMediaKeys: function(proxy, sender, signal, parameters) {
        if (signal != 'MediaPlayerKeyPressed') {
            global.log ('Received an unexpected signal \'%s\' from media player'.format(signal));
            return;
        }

        let key = parameters.get_child_value(1).get_string()[0];
        if (key == 'Play') {
            if (!this.isPlaying) {
                this._start();
            } else {
                this._stop();
            }
        }
        else if (key == 'Stop') {
            this._stop();
        }
     },

    // quick play option by middle click
    _middleClick: function(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        if (event.get_button() === 2) {
            this.menu.close();
            if (!this.isPlaying) {
                this._start();
            } else {
                this._stop();
            }
        }
    },

    // start streaming
    _start: function () {
        Player.start(this.lastPlayedChannel);
/*
        global.log("Source Bus Id: " + this.player._sourceBusId);
*/
        this.playLabel.set_text(Player.getCurrentChannel().getName());
        this.radioIcon.set_icon_name(PlayingIcon);
        this._checkTitle(Interval);
        this.isPlaying = true;
        this.playButton.set_child(this.stopIcon);
        this.playButton.connect('clicked', Lang.bind(this, this._stop));
    },

    // stop streaming
    _stop: function () {
        Player.stop();
        this.radioIcon.set_icon_name(StoppedIcon);
        this.tagListLabel.set_text("");
        this.isPlaying = false;
        this.playButton.set_child(this.playIcon);
        this.playButton.connect('clicked', Lang.bind(this, this._start));
    },

    // change radio station
    _changeChannel: function (cha) {
        this._stop();
        Player.changeChannel(cha);
        this.lastPlayedChannel = cha;
        Io.write(this.helperChannelList, this.lastPlayedChannel);
        this._start();
    },

    // init channel and add channels to the PopupMenu
    _initChannels: function (chas) {
        for (var i in chas) {
            let channel = new Channel.Channel(chas[i].name, chas[i].address, chas[i].favourite, chas[i].encoding);
            this.helperChannelList[i] = channel;
            if (chas[i].favourite) {
                this._addToFavourites(channel);
            }

        }
    },

    // adds radio station to the favourites submenu
    _addToFavourites: function (cha) {
        let item = new PopupMenu.PopupMenuItem(cha.getName());
        item.connect('activate', Lang.bind(this, function () {
            this._changeChannel(cha);
        }));
        this.favourites.menu.addMenuItem(item);
    },

    // get Favourites Menu Item
    _removeFromFavourites: function (cha) {
        let items = this.favourites.menu._getMenuItems();
        for (var i in items) {
            let item = items[i];
            if (item.label) {
                let _label = item.label.get_text();
                if (_label === cha.getName())
                    item.destroy();
            }
        }
    },


    // create a new Channel
    _addChannel: function (cha) {
        this.helperChannelList.push(cha);
        Io.write(this.helperChannelList, this.lastPlayedChannel);
    },

    // Delete a Channel
    _deleteChannel: function (cha) {
        if (cha.getFavourite()) {
            this._removeFromFavourites(cha);
        }
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getName() === cha.getName()) {
                this.helperChannelList.splice(i, 1); // remove 1 element from the given index
                Io.write(this.helperChannelList, this.lastPlayedChannel);
            }
        }
    },

    // set new values for a specific channel
    _updateChannel: function (cha) {
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getName() === cha.getName()) {
                this.helperChannelList[i] = cha;
                Io.write(this.helperChannelList, this.lastPlayedChannel);
            }
        }
    },

    // timer to check the stream title
    _checkTitle: function (timeout) {
        if (timeoutId !== 0) {
            Mainloop.source_remove(timeoutId);
        }
        timeoutId = Mainloop.timeout_add(timeout, Lang.bind(this, this._setTagLabel));
    },


    // update Title label
    _setTagLabel: function () {
        let tagLabel = Player.getTag();
        this.tagListLabel.set_text(tagLabel);
        this._checkTitle(Interval);
    },

    destroy: function () {
        if (timeoutId !== 0) {
            Mainloop.source_remove(timeoutId);
            timeoutId = 0;
        }
        Player.disconnectSourceBus();
        if (this.proxyId) {
            this.proxy.disconnect(this.proxyId);
        }
    	this.parent();
    }
});

let radioMenu;

// init with translation support
function init() {
    Convenience.initTranslations("radio@hslbck.gmail.com");
}

// build and add the extension
function enable() {
    radioMenu = new RadioMenuButton();
    Main.panel.addToStatusArea('radioMenu', radioMenu);
}

//  stop playing and destroy extension content
function disable() {
    // stop playing before destruction
    // affects lock screen
    radioMenu._stop();
    radioMenu.destroy();
}

// open preferences RadioPrefsWidget
function openPrefs() {
    let _appSys = Shell.AppSystem.get_default();
    let _gsmPrefs = _appSys.lookup_app('gnome-shell-extension-prefs.desktop');

    if (_gsmPrefs.get_state() == _gsmPrefs.SHELL_APP_STATE_RUNNING) {
        _gsmPrefs.activate();
    } else {
        let info = _gsmPrefs.get_app_info();
        let timestamp = global.display.get_current_time_roundtrip();
        let metadata = Extension.metadata;
        info.launch_uris([metadata.uuid], global.create_app_launch_context(timestamp, -1));
    }
}
