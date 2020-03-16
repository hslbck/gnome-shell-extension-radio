/*
    Copyright (C) 2014-2019 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 x4lldux <x4lldux@vectron.io>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const St = imports.gi.St;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const GObject = imports.gi.GObject;
const Slider = imports.ui.slider;

// import custom files
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Player = Extension.imports.player;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const ChannelListDialog = Extension.imports.channelListDialog;
const SearchDialog = Extension.imports.searchDialog;
const Io = Extension.imports.io;
const TitleMenu = Extension.imports.titleMenu;
const RadioSearchProvider = Extension.imports.searchProvider;

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// timer for stream tag
const Interval = 10000; // 10 seconds
let timeoutId = 0;
let oldTagLabel = '';

// Settings
const SETTING_USE_MEDIA_KEYS = 'use-media-keys';
const SETTING_TITLE_NOTIFICATION = 'title-notification';
const SETTING_SHOW_TITLE_IN_PANEL = 'show-title-in-panel';
const SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER = 'show-volume-adjustment-slider';
const SETTING_VOLUME_LEVEL = 'volume-level';
const SETTING_ENABLE_SEARCH_PROVIDER = 'enable-search-provider';

// media keys
const BUS_NAME = 'org.gnome.SettingsDaemon.MediaKeys';
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
const Clipboard = St.Clipboard.get_default();

let RadioMenuButton = GObject.registerClass (
    class RadioMenuButton extends PanelMenu.Button {
    _init() {
    	super._init(0.0, Extension.metadata.name);

        // read settings
        this._settings = ExtensionUtils.getSettings();

        let hbox = new St.BoxLayout({
                   style_class: 'panel-status-menu-box'
       });

        this.iconStopped = Gio.icon_new_for_string(Extension.path + '/icons/gser-icon-stopped-symbolic.svg');
        this.iconPlaying = Gio.icon_new_for_string(Extension.path + '/icons/gser-icon-playing-symbolic.svg');

        // Icon for the Panel
        this.radioIcon = new St.Icon({
            gicon: this.iconStopped,
            style_class: 'system-status-icon'
        });

        hbox.add_actor(this.radioIcon);
        this.actor.add_actor(hbox);
        this.actor.add_style_class_name('panel-status-button');

        // get channels from json file
        this.channelList = Io.read();
        this.chas = this.channelList.channels;
        this.lastPlayed = this.channelList.lastplayed;
        let encoding = this.lastPlayed.hasOwnProperty('encoding') ? this.lastPlayed.encoding : null;
        let lastPlayedId = this.lastPlayed.hasOwnProperty('id') ? this.lastPlayed.id : null;

        // init last played channel
        // ToDo: hard to match
        this.lastPlayedChannel = new Channel.Channel(lastPlayedId, this.lastPlayed.name, this.lastPlayed.address, false, encoding);

        // init player
        this.player = null;

        // Box for the Control Elements
        this.controlsBox = new St.BoxLayout({
            name: 'controlsBox',
            style_class: 'control-box',
            width: 350
        });
        this.tagListBox = new St.BoxLayout({
            name: 'tagListBox',
            style_class: 'tag-list-box'
        });

        this.tagItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
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
        this.copyTagButton = new St.Button({
            style_class: 'datemenu-today-button copy-tag-button',
            can_focus: true
        });
        this.copyTagIcon = new St.Icon({
            icon_name: 'edit-copy-symbolic'
        });
        this.copyTagButton.set_child(this.copyTagIcon);
        this.copyTagButton.hide();
        this.tagListBox.add(this.tagListLabel);

        // Add ControlsBox to the Menu
        this.menu.box.add_child(this.controlsBox);
        this.tagItem.actor.add(this.tagListBox, {expand: false, x_fill: false});
        this.tagItem.actor.add(this.copyTagButton, {expand: false, y_fill: false});
        this.menu.addMenuItem(this.tagItem);

        // Connect the Button
        this.playButton.connect('clicked', this._onPlayButtonClicked.bind(this));
        this.copyTagButton.connect('clicked', this._copyTagToClipboard.bind(this));

        // PopupSeparator
        let separator1 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator1);

        // Init and add Channels to the PopupMenu
        this.helperChannelList = [];
        this._initChannels(this.chas);

        // create buttons for settings, list, add and search
        this._buildMenuItems();

        this.isPlaying = false;
        this.actor.connect('button-press-event', this._middleClick.bind(this));

        // media keys setting change
        this._settings.connect("changed::" + SETTING_USE_MEDIA_KEYS, () => {
            if (this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)) {
                this._registerMediaKeys();
            }
            else {
                this._disconnectMediaKeys();
            }
        });

        // title panel setting change
        this._settings.connect("changed::" + SETTING_SHOW_TITLE_IN_PANEL, () => {
            if (this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)) {
                TitleMenu.addToPanel();
            }
            else {
                TitleMenu.removeFromPanel();
            }
        });

        // Volume slider setting change
        this._settings.connect("changed::" + SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER, () => {
            if (this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)) {
                this._buildVolumeSlider(2);
            }
            else {
                this._destroyVolumeSlider();
            }
        });

        // search provider setting change
        this._settings.connect("changed::" + SETTING_ENABLE_SEARCH_PROVIDER, () => {
            if (this._settings.get_boolean(SETTING_ENABLE_SEARCH_PROVIDER)) {
                RadioSearchProvider.enableProvider();
            }
            else {
                RadioSearchProvider.disableProvider();
            }
        });

    }

    // search provider registration on startup
    _enableSearchProvider() {
        if (this._settings.get_boolean(SETTING_ENABLE_SEARCH_PROVIDER)) {
            RadioSearchProvider.enableProvider();
        }
    }

    // media keys for registration on startup
    _enableMediaKeys() {
        if (this._settings.get_boolean(SETTING_USE_MEDIA_KEYS)) {
            this._registerMediaKeys();
        }
    }

    _disableSearchProvider(){
        RadioSearchProvider.disableProvider();
    }

    _registerMediaKeys() {
        if (this._mediaKeysProxy) {
                this._mediaKeysProxy.GrabMediaPlayerKeysRemote('GSE Radio', 0);
        }
        else {
            new MediaKeysProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH,
                                        (proxy, error) => {
                                            if (error) {
                                                global.log(error.message);
                                                return;
                                            }
                                            this._mediaKeysProxy = proxy;
                                            this._proxyId = this._mediaKeysProxy.connectSignal('MediaPlayerKeyPressed', this._mediaKeysPressed.bind(this));
                                            this._mediaKeysProxy.GrabMediaPlayerKeysRemote('GSE Radio', 0);
                                        });

        }
    }

     _disconnectMediaKeys() {
         if (this._mediaKeysProxy) {
             this._mediaKeysProxy.ReleaseMediaPlayerKeysRemote("GSE Radio");
             if (this._proxyId) {
                 this._mediaKeysProxy.disconnectSignal(this._proxyId);
             }
             this._proxyId = 0;
             this._mediaKeysProxy = null;
         }
     }

    // handle play/stop media key events
    _mediaKeysPressed(sender, signal, parameters) {
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
     }

    // quick play option by middle click
    _middleClick(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        if (event.get_button() === 2) {
            this.menu.close();
            this._onPlayButtonClicked();
        }
    }

    // play button clicked
    _onPlayButtonClicked() {
        if (!this.isPlaying) {
            this._start();
        } else {
            this._stop();
        }
    }

    _copyTagToClipboard() {
        Clipboard.set_text(St.ClipboardType.CLIPBOARD, this.player._getTag());
    }

    _onVolumeSliderValueChanged(actor, event){
        if (this.player !== null) {
            this.player._setVolume(this.volumeSlider.value);
        }
    }

    // start streaming
    _start() {
        if (this.player === null) {
            this.player = new Player.Player(this.lastPlayedChannel);
        }
        this.player._start();
        if (this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL)) {
            TitleMenu.addToPanel();
        }
/*
        global.log("Source Bus Id: " + this.player._sourceBusId);
*/
        this.playLabel.set_text(this.player._getCurrentChannel().getName());
        this.radioIcon.set_gicon(this.iconPlaying);
        this._checkTitle(Interval);
        this.isPlaying = true;
        this.playButton.set_child(this.stopIcon);
    }

    // stop streaming
    _stop() {
        if (this.isPlaying && this.player !== null) {
            this.player._stop();
            TitleMenu.removeFromPanel();
        }
        this.radioIcon.set_gicon(this.iconStopped);
        this.tagListLabel.set_text("");
        this.copyTagButton.hide();
        this.isPlaying = false;
        this.playButton.set_child(this.playIcon);
    }

    // change channel to previous on the list
    _prev() {
        if (this.player !== null) {
            let currentChannel = this.player._getCurrentChannel();
            let channels = this.channelList.channels;
            let nextChannel = channels[channels.length - 1];
            for (var i=1; i < channels.length; i++) {
                if (channels[i].id == currentChannel.getId() && channels[i].address == currentChannel.getUri()) {
                    nextChannel = channels[i-1];
                    break;
                }
            }
            this._changeChannel(new Channel.Channel(nextChannel.id,nextChannel.name, nextChannel.address, false, nextChannel.encoding));
        }
    }

    // change channel to next on the list
    _next() {
        if (this.player !== null) {
            let currentChannel = this.player._getCurrentChannel();
            let channels = this.channelList.channels;
            let nextChannel = channels[0];
            for (var i=0; i < channels.length - 1; i++) {
                if (channels[i].id == currentChannel.getId() && channels[i].address == currentChannel.getUri()) {
                    nextChannel = channels[i+1];
                    break;
                }
            }
            this._changeChannel(new Channel.Channel(nextChannel.id,nextChannel.name, nextChannel.address, false, nextChannel.encoding));
        }
    }

    // change radio station
    _changeChannel(cha) {
        this._stop();
        if (this.player !== null) {
            this.player._changeChannel(cha);
        }
        this.lastPlayedChannel = cha;
        Io.write(this.helperChannelList, this.lastPlayedChannel);
        this._start();
    }

    _changeChannelById(id) {
        if (this.isPlaying && id === this.player._getCurrentChannel().getId()) {
            this._stop();
        }
        else {
            let channel = this._getChannelById(id);
            this._changeChannel(channel);
        }
    }

    // init channel and add channels to the PopupMenu
    _initChannels(chas) {
        for (var i in chas) {
            let encoding = chas[i].hasOwnProperty('encoding') ? chas[i].encoding : null;
            let id = chas[i].hasOwnProperty('id') ? chas[i].id : null;
            let channel = new Channel.Channel(id, chas[i].name, chas[i].address, chas[i].favourite, encoding);
            this.helperChannelList[i] = channel;
            if (chas[i].favourite) {
                this._addToFavourites(channel);
            }

        }
    }

    _addToFavourites(cha) {
        let contains = this._containsChannel(cha);
        if (contains) {
            let item = new PopupMenu.PopupMenuItem(cha.getName());
            item.actor.set_name(cha.getId());
            item.connect('activate', () => {
                this._changeChannel(cha);
            });
            this.menu.addMenuItem(item);
        }
    }

    _containsChannel(cha) {
        let contains = false;
        for (let i = 0; i < this.helperChannelList.length; i++) {
            if (this.helperChannelList[i].getId() === cha.getId()) {
                contains = true;
            }
        }
        return contains;
    }

    _getChannelById(id) {
        for (let i = 0; i < this.helperChannelList.length; i++) {
            if (this.helperChannelList[i].getId() === id) {
                return this.helperChannelList[i];
            }
        }
        return null;
    }

    _buildVolumeSlider(menuItemOffset) {
        // Add volume slider separator
        this.separator3 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator3, this.menu.numMenuItems - menuItemOffset);

        // Create volume slider box
        this.volumeSliderBox = new PopupMenu.PopupBaseMenuItem();
        this.volumeIcon = new St.Icon({ style_class: 'popup-menu-icon', icon_name: 'audio-speakers-symbolic' });
        this.volumeSlider = new Slider.Slider(Math.pow(this._settings.get_double(SETTING_VOLUME_LEVEL), 1/3));
        this.volumeSliderBox.actor.add(this.volumeIcon);
        this.volumeSliderBox.actor.add(this.volumeSlider.actor, { expand: true });

        // Connect sliders 'notify::value' handler
        this.volumeSlider.connect('notify::value', this._onVolumeSliderValueChanged.bind(this));

        // Add volume slider box
        this.menu.addMenuItem(this.volumeSliderBox,this.menu.numMenuItems - menuItemOffset);
    }

    _destroyVolumeSlider(){
        this.separator3.destroy();
        this.volumeIcon.destroy();
        this.volumeSlider.actor.destroy();
        this.volumeSliderBox.destroy();
    }

    _buildMenuItems() {
        // Add VolumeSliderBox to the PopupMenu on startup
        if (this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)) {
            this._buildVolumeSlider(0);
        }

        // PopupSeparator
        this.separator2 = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator2);

        this._buildMenuItemButtons();
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
    }

    _destroyMenuItems() {
        this._destroyMenuItemButtons();
        this.separator2.destroy();
        this.settingsItem.destroy();
        if (this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER)) {
    		this._destroyVolumeSlider();
        }
    }

    _buildMenuItemButtons() {
        this.settingsIcon = new St.Icon({
            icon_name: 'preferences-system-symbolic'
        });
        this.settingsButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.settingsButton.set_child(this.settingsIcon);
        this.settingsButton.connect('clicked', () => {
            this.menu.close();
            this._openPrefs();
        });

        this.channelListIcon = new St.Icon({
            icon_name: 'view-list-symbolic'
        });
        this.channelListButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.channelListButton.set_child(this.channelListIcon);
        this.channelListButton.connect('clicked', () => {
            this.menu.close();
            this.channelListDialog = new ChannelListDialog.ChannelListDialog();
            this.channelListDialog.open();
        });

        this.addChannelIcon = new St.Icon({
            icon_name: 'list-add-symbolic'
        });
        this.addChannelButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.addChannelButton.set_child(this.addChannelIcon);
        this.addChannelButton.connect('clicked', () => {
            this.menu.close();
            this.addChannelDialog = new AddChannelDialog.AddChannelDialog(null);
            this.addChannelDialog.open();
        });

        this.searchIcon = new St.Icon({
            icon_name: 'system-search-symbolic'
        });
        this.searchButton = new St.Button({
            style_class: 'system-menu-action',
            can_focus: true
        });
        this.searchButton.set_child(this.searchIcon);
        this.searchButton.connect('clicked', () => {
            this.menu.close();
            this.searchDialog = new SearchDialog.SearchDialog();
            this.searchDialog.open();
        });
    }

    _destroyMenuItemButtons() {
        this.settingsIcon.destroy();
        this.settingsButton.destroy();
        this.channelListIcon.destroy();
        this.channelListButton.destroy();
        this.addChannelIcon.destroy();
        this.addChannelButton.destroy();
        this.searchIcon.destroy();
        this.searchButton.destroy();
    }

    // get Favourites Menu Item
    _removeFromFavourites(cha) {
        let items = this.menu._getMenuItems();
        for (var i in items) {
            let item = items[i];
            if (item && item.actor.get_name() === cha.getId()) {
                item.destroy();
            }
        }
    }

    // create a new Channel
    _addChannel(cha) {
        this.helperChannelList.push(cha);
        Io.write(this.helperChannelList, this.lastPlayedChannel);
    }

    // Delete a Channel
    _deleteChannel(cha) {
        if (cha.getFavourite()) {
            this._removeFromFavourites(cha);
        }
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getId() === cha.getId()) {
                this.helperChannelList.splice(i, 1); // remove 1 element from the given index
                Io.write(this.helperChannelList, this.lastPlayedChannel);
            }
        }
    }

    _getHelperChannelList() {
            return this.helperChannelList;
    }

    // set new values for a specific channel
    _updateChannel(cha) {
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getId() === cha.getId()) {
                this.helperChannelList[i] = cha;
                Io.write(this.helperChannelList, this.lastPlayedChannel);
            }
        }
    }

    // timer to check the stream title
    _checkTitle(timeout) {
        if (timeoutId !== 0) {
            GLib.source_remove(timeoutId);
        }
        timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, timeout, this._setTagLabel.bind(this));
    }


    // update Title label
    _setTagLabel() {
        if (this.isPlaying && this.player !== null) {
            let tag = this.player._getTag();
            let tagWithLineBreaks = this.player._getTagWithLineBreaks();
            let channel = this.player._getCurrentChannel().getName();
            this.tagListLabel.set_text(tagWithLineBreaks);
            this.copyTagButton.show();
            this._enableTitleNotification(tagWithLineBreaks, channel);
            this._checkTitle(Interval);
            TitleMenu.updateTitle(channel, tag);
        }
    }

    _enableTitleNotification(tagLabel, senderLabel) {
        if (this._settings.get_boolean(SETTING_TITLE_NOTIFICATION) && tagLabel !== oldTagLabel) {
            oldTagLabel = tagLabel;
            let source = new MessageTray.Source("Radio", null);
            let notification = new MessageTray.Notification(source,
                                                tagLabel,
                                                senderLabel,{gicon: this.iconStopped});
            notification.setTransient(true);
            Main.messageTray.add(source);
            source.notify(notification);
        }
    }

    destroy() {
        if (timeoutId !== 0) {
            GLib.source_remove(timeoutId);
            timeoutId = 0;
        }
        if (this.player !== null) {
            this.player._disconnectSourceBus();
        }
    	super.destroy();
    }

    _openPrefs() {
        let _appSys = Shell.AppSystem.get_default();
        let _gsmPrefs = _appSys.lookup_app('org.gnome.Extensions.desktop');

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

var radioMenu;

function addToPanel() {
    radioMenu = new RadioMenuButton();
    Main.panel.addToStatusArea('radioMenu', radioMenu, 0, 'right');
    radioMenu._enableSearchProvider();
    radioMenu._enableMediaKeys();
}

function removeFromPanel() {
    radioMenu._stop();
    radioMenu._disconnectMediaKeys();
    radioMenu._disableSearchProvider();
    radioMenu.destroy();
}
