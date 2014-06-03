/* jshint esnext:true */
const St = imports.gi.St;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

// import for json file
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Gtk = imports.gi.Gtk;

// import for timer
const Mainloop = imports.mainloop;

// import custom files
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const PlayStream = Extension.imports.playStream;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const ChannelListDialog = Extension.imports.channelListDialog;

// translation support
const Convenience = Extension.imports.convenience;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// timer for stream tag
const Interval = 10000; // 10 seconds
let _timeoutId = 0;

const RadioMenuButton = new Lang.Class({
    Name: 'Radio Button',
    Extends: PanelMenu.Button,

    _init: function () {
        PanelMenu.Button.prototype._init.call(this, 0.5);

        // path for icon
        Gtk.IconTheme.get_default().append_search_path(Extension.dir.get_child('icons').get_path());
        // Icon for the Panel
        this.radioIcon = new St.Icon({
            icon_name: 'radio-icon-stopped-symbolic',
            style_class: 'system-status-icon indicator-icon',
            icon_size: 27,
        });
        this.actor.add_actor(this.radioIcon);
        this.actor.add_style_class_name('panel-status-button');

        // get channels from json file
        this.channelList = this._getChannels();
        this.chas = this.channelList.channels;
        this.lastPlayed = this.channelList.lastplayed;

        // init last played channel
        this.lastPlayedChannel = new Channel.Channel(this.lastPlayed.name, this.lastPlayed.address, false);

        // Initialize Pipeline with first entry
        this.playStream = new PlayStream.PlayStream(this.lastPlayedChannel);

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

        // Add Channel PopupMenu
        this.addChannel = new PopupMenu.PopupMenuItem(_("Add Channel"));
        this.addChannel.connect('activate', Lang.bind(this, function () {
            this.addChannelDialog = new AddChannelDialog.AddChannelDialog();
            this.addChannelDialog.open();
        }));

        this.menu.addMenuItem(this.addChannel);
    },


    // start streaming
    _start: function () {
        this.playStream.startPlaying();
        this.playLabel.set_text(this.playStream.getCurrentChannel().getName());
        this.radioIcon.set_icon_name('radio-icon-playing-symbolic');
        this._checkTitle(Interval);
        this.playButton.set_child(this.stopIcon);
        this.playButton.connect('clicked', Lang.bind(this, this._stop));
    },

    // stop streaming
    _stop: function () {
        this.playStream.stopPlaying();
        this.radioIcon.set_icon_name('radio-icon-stopped-symbolic');
        this.playButton.set_child(this.playIcon);
        this.playButton.connect('clicked', Lang.bind(this, this._start));
    },

    // change radio station
    _changeChannel: function (cha) {
        this._stop();
        this.playStream.changeChannel(cha);
        this.lastPlayedChannel = cha;
        this._writeChannels();
        this._start();
    },

    // return the channels defined in channelList.json
    _getChannels: function () {
        // Load Path and file
        let dir = Gio.file_new_for_path(Extension.path);
        let channelFile = dir.get_child('channelList.json');
        let content;
        try {
            content = Shell.get_file_contents_utf8_sync(channelFile.get_path());
        } catch (e) {
            global.logError('Failed to load channelList.json: ' + e);
            return null;
        }
        // parse json file
        try {
            this.channelList = JSON.parse(content);
        } catch (e) {
            global.logError('Failed to parse channelList.json: ' + e);
            return null;
        }
        return this.channelList;
    },

    // write channels to the channelList.json
    _writeChannels: function () {
        let dir = Gio.file_new_for_path(Extension.path);
        let channelFile = dir.get_child('channelList.json');

        let raw = channelFile.replace(null, false, Gio.FileCreateFlags.NONE, null);
        let out = Gio.BufferedOutputStream.new_sized(raw, 4096);

        // Format output and write helperChannelList
        Shell.write_string_to_stream(out, "{ \"channels\":[\n");
        for (var i = 0; i < this.helperChannelList.length; i++) {
            Shell.write_string_to_stream(out, "\t");
            Shell.write_string_to_stream(out, JSON.stringify({
                name: this.helperChannelList[i].getName(),
                address: this.helperChannelList[i].getUri(),
                favourite: this.helperChannelList[i].getFavourite()
            }, null, "\t"));
            // remove last comma
            if (i != this.helperChannelList.length - 1) {
                Shell.write_string_to_stream(out, ",");
            }
        }
        // write lastplayed channel
        Shell.write_string_to_stream(out, "\n],\n\n  \"lastplayed\":");
        Shell.write_string_to_stream(out, JSON.stringify({
            name: this.lastPlayedChannel.getName(),
            address: this.lastPlayedChannel.getUri()
        }, null, "\t"));
        Shell.write_string_to_stream(out, "\n}");
        out.close(null);
    },

    // init channel and add channels to the PopupMenu
    _initChannels: function (chas) {
        for (var i in chas) {
            let channel = new Channel.Channel(chas[i].name, chas[i].address, chas[i].favourite);
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
        this._writeChannels();
    },

    // Delete a Channel
    _deleteChannel: function (cha) {
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getName() === cha.getName()) {
                this.helperChannelList.splice(i, 1); // remove 1 element from the given index
                this._writeChannels();
            }
        }
    },

    // set new values for a specific channel
    _updateChannel: function (cha) {
        for (var i in this.helperChannelList) {
            if (this.helperChannelList[i].getName() === cha.getName()) {
                this.helperChannelList[i] = cha;
                this._writeChannels();
            }
        }
    },

    // timer to check the stream title
    _checkTitle: function (timeout) {
        if (_timeoutId !== 0) {
            Mainloop.source_remove(_timeoutId);

        }
        _timeoutId = Mainloop.timeout_add(timeout, Lang.bind(this, this._setTagLabel));
    },


    // update Title label	
    _setTagLabel: function () {
        let tagLabel = this.playStream.getTag();
        this.tagListLabel.set_text(tagLabel);
        this._checkTitle(Interval);
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
    if (_timeoutId !== 0) {
        Mainloop.source_remove(_timeoutId);
        _timeoutId = 0;
    }
    // stop playing before destruction
    // affects lock screen
    radioMenu._stop();
    radioMenu.destroy();
}