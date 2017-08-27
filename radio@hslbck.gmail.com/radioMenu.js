/*
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 x4lldux <x4lldux@vectron.io>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const St = imports.gi.St;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Slider = imports.ui.slider;

// import for timer
const Mainloop = imports.mainloop;

// import custom files
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Player = Extension.imports.player;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const ChannelListDialog = Extension.imports.channelListDialog;
const SearchDialog = Extension.imports.searchDialog;
const Io = Extension.imports.io;
const TitleMenu = Extension.imports.titleMenu;

// translation support
const Convenience = Extension.imports.convenience;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// timer for stream tag
const Interval = 10000; // 10 seconds
let timeoutId = 0;
let oldTagLabel = '';

// icons
const PlayingIcon = "gser-icon-playing-symbolic";
const StoppedIcon = "gser-icon-stopped-symbolic";

// Settings
const SETTING_USE_MEDIA_KEYS = 'use-media-keys';
const SETTING_TITLE_NOTIFICATION = 'title-notification';
const SETTING_SHOW_TITLE_IN_PANEL = 'show-title-in-panel';
const SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER = 'show-volume-adjustment-slider';
const SETTING_VOLUME_LEVEL = 'volume-level';

// media keys
const BUS_NAME = 'org.gnome.SettingsDaemon';
const OBJECT_PATH = '/org/gnome/SettingsDaemon/MediaKeys';
const MediaKeysInterface = '<node> \
  <interface name="org.gnome.SettingsDaemon.MediaKeys"> \
    <method name="ReleaseMediaPlayerKeys"> \
      <arg name="application" type="s" direction="in"/> \
    </method> \
    <method name="GrabMediaPlayerKeys"> \
      <arg name="application" type="s" direction="in"/> \
      <arg name="time" type="u" direction="in"/> \
    </method> \
    <signal name="MediaPlayerKeyPressed"> \
      <arg type="s"/> \
      <arg type="s"/> \
    </signal> \
  </interface> \
</node>';
const MediaKeysProxy = Gio.DBusProxy.makeProxyWrapper(MediaKeysInterface);

const RadioMenuButton = new Lang.Class({
    Name: 'Radio Button',
    Extends: PanelMenu.Button,

    _init: function () {
    	this.parent(0.0, Extension.metadata.name);

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
            style_class: 'control-box',
            width: 350
        });
        this.tagListBox = new St.BoxLayout({
            name: 'tagListBox',
            style_class: 'control-box',
            width: 350
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
        this.playButton.connect('clicked', Lang.bind(this, this._onPlayButtonClicked));

        // PopupSeparator
        let separator1 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator1);

        // Init and add Channels to the PopupMenu
        this.helperChannelList = [];
        this._initChannels(this.chas);
	
	// Add VolumeSliderBox to the PopupMenu on startup
        if (this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)) {
		this._buildVolumeSlider(0);
        }

        // create buttons for settings, list, add and search
        this._buildMenuItems();

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
                this._disconnectMediaKeys();
            }
        }));

        // title panel setting change
        this._settings.connect("changed::" + SETTING_SHOW_TITLE_IN_PANEL, Lang.bind(this, function() {
            if (this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)) {
                TitleMenu.addToPanel();
            }
            else {
                TitleMenu.removeFromPanel();
            }
        }));

        // Volume slider setting change
        this._settings.connect("changed::" + SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER, Lang.bind(this, function() {
            if (this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)) {
                this._buildVolumeSlider(2);
            }
            else {
                this._destroyVolumeSlider();
            }
        }));

    },

    _registerMediaKeys: function() {
        if (this._mediaKeysProxy) {
                this._mediaKeysProxy.GrabMediaPlayerKeysRemote('GSE Radio', 0);
        }
        else {
            new MediaKeysProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH,
                                        Lang.bind(this, function(proxy, error) {
                                            if (error) {
                                                global.log(error.message);
                                                return;
                                            }
                                            this._mediaKeysProxy = proxy;
                                            this._proxyId = this._mediaKeysProxy.connectSignal('MediaPlayerKeyPressed', Lang.bind(this, this._mediaKeysPressed));
                                            this._mediaKeysProxy.GrabMediaPlayerKeysRemote('GSE Radio', 0);
                                        }));

        }
    },

     _disconnectMediaKeys: function() {
         if (this._mediaKeysProxy) {
             this._mediaKeysProxy.ReleaseMediaPlayerKeysRemote("GSE Radio");
             if (this._proxyId) {
                 this._mediaKeysProxy.disconnectSignal(this._proxyId);
             }
             this._proxyId = 0;
             this._mediaKeysProxy = null;
         }
     },

    // handle play/stop media key events
    _mediaKeysPressed: function(sender, signal, parameters) {
        let [app, key] = parameters;
        // global.log("Received key: " + _key);
        if (key == 'Play') {
            this._onPlayButtonClicked();
        }
        else if (key == 'Stop') {
            this._stop();
        }
        else if (key == 'Previous') {
            this._prev();
        }
        else if (key == 'Next') {
            this._next();
        }
     },

    // quick play option by middle click
    _middleClick: function(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        if (event.get_button() === 2) {
            this.menu.close();
            this._onPlayButtonClicked();
        }
    },

    // play button clicked
    _onPlayButtonClicked: function () {
        if (!this.isPlaying) {
            this._start();
        } else {
            this._stop();
        }
    },

    _onVolumeSliderValueChanged: function(slider, value, property){
    	Player.setVolume(value);
    },

    // start streaming
    _start: function () {
        Player.start(this.lastPlayedChannel);
        if (this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)) {
            TitleMenu.addToPanel();
        }
/*
        global.log("Source Bus Id: " + this.player._sourceBusId);
*/
        this.playLabel.set_text(Player.getCurrentChannel().getName());
        this.radioIcon.set_icon_name(PlayingIcon);
        this._checkTitle(Interval);
        this.isPlaying = true;
        this.playButton.set_child(this.stopIcon);
    },

    // stop streaming
    _stop: function () {
        if (this.isPlaying) {
            Player.stop();
            TitleMenu.removeFromPanel();
        }
        this.radioIcon.set_icon_name(StoppedIcon);
        this.tagListLabel.set_text("");
        this.isPlaying = false;
        this.playButton.set_child(this.playIcon);
    },

    // change channel to previous on the list
    _prev: function () {
        let currentChannel = Player.getCurrentChannel();
        let channels = this.channelList.channels;
        let nextChannel = channels[0];
        for (var i=0; i < channels.length; i++) {
           if (channels[i].name == currentChannel.getName() && channels[i].address == currentChannel.getUri()) {
              if (i == 0) { i = channels.length; }
              nextChannel = channels[i-1];
              break;
           }
        }
        this._changeChannel(new Channel.Channel(nextChannel.name, nextChannel.address, false, nextChannel.encoding));
    },

    // change channel to next on the list
    _next: function () {
        let currentChannel = Player.getCurrentChannel();
        let channels = this.channelList.channels;
        let nextChannel = channels[0];
        for (var i=0; i < channels.length; i++) {
           if (channels[i].name == currentChannel.getName() && channels[i].address == currentChannel.getUri()) {
              if (i+1 == channels.length) { i=-1; }
              nextChannel = channels[i+1];
              break;
           }
        }
        this._changeChannel(new Channel.Channel(nextChannel.name, nextChannel.address, false, nextChannel.encoding));
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

    _addToFavourites: function (cha) {
        let contains = this._containsChannel(cha);
        if (contains) {
            let item = new PopupMenu.PopupMenuItem(cha.getName());
            item.connect('activate', Lang.bind(this, function () {
                this._changeChannel(cha);
            }));
            this.menu.addMenuItem(item);
        }
    },

    _containsChannel: function (cha) {
        let contains = false;
        for (let i = 0; i < this.helperChannelList.length; i++) {
            if (this.helperChannelList[i].getName() === cha.getName()) {
                contains = true;
            }
        }
        return contains;
    },

    _buildVolumeSlider: function(menuItemOffset){
	// Add volume slider separator
	this.separator3 = new PopupMenu.PopupSeparatorMenuItem();
	this.menu.addMenuItem(this.separator3, this.menu.numMenuItems - menuItemOffset);
	
	// Create volume slider box
	this.volumeSliderBox = new PopupMenu.PopupBaseMenuItem();
	this.volumeIcon = new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'audio-speakers-symbolic' });
	this.volumeSlider = new Slider.Slider(Math.pow(this._settings.get_double(SETTING_VOLUME_LEVEL), 1/3));
	this.volumeSliderBox.actor.add(this.volumeIcon);
	this.volumeSliderBox.actor.add(this.volumeSlider.actor, { expand: true });
	
	// Connect sliders 'value-changed' handler
        this.volumeSlider.connect('value-changed', Lang.bind(this, this._onVolumeSliderValueChanged));

	// Add volume slider box 
	this.menu.addMenuItem(this.volumeSliderBox,this.menu.numMenuItems - menuItemOffset);
    },

    _destroyVolumeSlider: function(){
	this.separator3.destroy();
	this.volumeIcon.destroy();
	this.volumeSlider.actor.destroy();
	this.volumeSliderBox.destroy();
    },

    _buildMenuItems: function() {
        this._buildMenuItemButtons();

        // PopupSeparator
        this.separator2 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator2);

        // settings, add channel and search item
        this.settingsItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        });
        this.settingsItem.actor.add(this.settingsButton, {expand: true, x_fill: false});
        this.settingsItem.actor.add(this.channelListButton, {expand: true, x_fill: false});
        this.settingsItem.actor.add(this.addChannelButton, {expand: true, x_fill: false});
        this.settingsItem.actor.add(this.searchButton, {expand: true, x_fill: false});
        this.menu.addMenuItem(this.settingsItem);
    },

    _destroyMenuItems: function() {
        this._destroyMenuItemButtons();
        this.separator2.destroy();
        this.settingsItem.destroy();
    },

    _buildMenuItemButtons: function() {
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
            this._openPrefs();
        }));

        this.channelListIcon = new St.Icon({
            icon_name: 'view-list-symbolic'
        });
        this.channelListButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.channelListButton.set_child(this.channelListIcon);
        this.channelListButton.connect('clicked', Lang.bind(this, function () {
            this.menu.close();
            this.channelListDialog = new ChannelListDialog.ChannelListDialog(this);
            for (var i in this.helperChannelList) {
                this.channelListDialog._createChannelListItem(this.helperChannelList[i]);
            }
            this.channelListDialog.open();
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

        this.searchIcon = new St.Icon({
            icon_name: 'system-search-symbolic'
        });
        this.searchButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.searchButton.set_child(this.searchIcon);
        this.searchButton.connect('clicked', Lang.bind(this, function () {
            this.menu.close();
            this.searchDialog = new SearchDialog.SearchDialog();
            this.searchDialog.open();
        }));
    },

    _destroyMenuItemButtons: function() {
        this.settingsIcon.destroy();
        this.settingsButton.destroy();
        this.channelListIcon.destroy();
        this.channelListButton.destroy();
        this.addChannelIcon.destroy();
        this.addChannelButton.destroy();
        this.searchIcon.destroy();
        this.searchButton.destroy();
    },

    // get Favourites Menu Item
    _removeFromFavourites: function (cha) {
        let items = this.menu._getMenuItems();
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
        if (this.isPlaying) {
            let tag = Player.getTag();
            let tagWithLineBreaks = Player.getTagWithLineBreaks();
            let channel = Player.getCurrentChannel().getName();
            this.tagListLabel.set_text(tagWithLineBreaks);
            this._enableTitleNotification(tagWithLineBreaks, channel);
            this._checkTitle(Interval);
            TitleMenu.updateTitle(channel, tag);
        }
    },

    _enableTitleNotification: function(tagLabel, senderLabel) {
        if (this._settings.get_boolean(SETTING_TITLE_NOTIFICATION) && tagLabel !== oldTagLabel) {
            oldTagLabel = tagLabel;
            let source = new MessageTray.Source("Radio", StoppedIcon);
            let notification = new MessageTray.Notification(source,
                                                tagLabel,
                                                senderLabel);
            notification.setTransient(true);
            Main.messageTray.add(source);
            source.notify(notification);
        }
    },

    destroy: function () {
        if (timeoutId !== 0) {
            Mainloop.source_remove(timeoutId);
            timeoutId = 0;
        }
        Player.disconnectSourceBus();
    	this.parent();
    },

    _openPrefs: function () {
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
});
