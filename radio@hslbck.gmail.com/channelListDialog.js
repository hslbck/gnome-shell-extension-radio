/*
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Signals = imports.signals;
const St = imports.gi.St;
const ModalDialog = imports.ui.modalDialog;
const Util = imports.misc.util;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.extension;
const AddChannelDialog = Extension.imports.addChannelDialog;

// icons
const StoppedIcon = "gser-icon-stopped-symbolic";
const FavouriteEnabledIcon = 'starred-symbolic';
const FavouriteDisabledIcon = 'non-starred-symbolic';

let _selectedChannel;

var ChannelListDialog = new Lang.Class({
    Name: 'ChannelListDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function () {
        this.parent({
            styleClass: 'nm-dialog'
        });
        this._buildLayout();
        this._createChannelList();
    },

    _buildLayout: function () {
        // Set Header
        let headline = new St.BoxLayout({
            style_class: 'nm-dialog-header-hbox'
        });

        let icon = new St.Icon({
            style_class: 'nm-dialog-header-icon',
            icon_name: StoppedIcon
        });

        let titleBox = new St.BoxLayout({
            vertical: true
        });
        let title = new St.Label({
            style_class: 'nm-dialog-header',
            text: _("List of Channels")
        });
        let subtitle = new St.Label({
            style_class: 'nm-dialog-subheader',
            text: _("Manage your radio stations")
        });
        titleBox.add(title);
        titleBox.add(subtitle);

        headline.add(icon);
        headline.add(titleBox);

        this.contentLayout.style_class = 'nm-dialog-content';
        this.contentLayout.add(headline);

        // Create ScrollView and ItemBox
        this._stack = new St.Widget({
            layout_manager: new Clutter.BinLayout()
        });

        this._itemBox = new St.BoxLayout({
            vertical: true
        });
        this._scrollView = new St.ScrollView({
            style_class: 'nm-dialog-scroll-view'
        });
        this._scrollView.set_x_expand(true);
        this._scrollView.set_y_expand(true);
        this._scrollView.set_policy(Gtk.PolicyType.NEVER,
            Gtk.PolicyType.AUTOMATIC);
        this._scrollView.add_actor(this._itemBox);
        this._stack.add_child(this._scrollView);

        this.contentLayout.add(this._stack, {
            expand: true
        });

        // Cancel, Delete, Edit and Play Button
        this._cancelButton = this.addButton({
            action: Lang.bind(this, this.close),
            label: _("Cancel"),
            key: Clutter.Escape
        }, {
            x_align: St.Align.START
        });
        this._deleteButton = this.addButton({
            action: Lang.bind(this, this._delete),
            label: _("Delete")
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
        this._editButton = this.addButton({
            action: Lang.bind(this, this._edit),
            label: _("Edit")
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
        this._playButton = this.addButton({
            action: Lang.bind(this,
                this._play),
            label: _("Play"),
            key: Clutter.Return
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
        this._playButton.reactive = false;
        this._playButton.can_focus = false;
        this._deleteButton.reactive = false;
        this._deleteButton.can_focus = false;
        this._editButton.reactive = false;
        this._editButton.can_focus = false;
    },

    // Play the selected Radio Channel
    _play: function () {
        let cha = _selectedChannel;
        MyE.radioMenu._changeChannel(cha);
        this.close();
    },

    _delete: function () {
        let cha = _selectedChannel;
        MyE.radioMenu._deleteChannel(cha);
        this._itemBox.remove_child(cha.item.actor);
    },

    _edit: function () {
        let cha = _selectedChannel;
        this.close();
        this.addChannelDialog = new AddChannelDialog.AddChannelDialog(cha);
        this.addChannelDialog.open();
    },

    // Set the Selected Channel
    _selectChannel: function (cha) {
        this._playButton.reactive = true;
        this._playButton.can_focus = true;
        this._deleteButton.reactive = true;
        this._deleteButton.can_focus = true;
        this._editButton.reactive = true;
        this._editButton.can_focus = true;
        if (_selectedChannel) {
            _selectedChannel.item.actor.remove_style_pseudo_class('selected');
        }

        _selectedChannel = cha;

        if (_selectedChannel) {
            _selectedChannel.item.actor.add_style_pseudo_class('selected');
        }
    },

    _createChannelList: function () {
        var channelList = MyE.radioMenu._getHelperChannelList();
        for (var i in channelList) {
            this._createChannelListItem(channelList[i]);
        }
    },

    // Create Items for the Dialog
    _createChannelListItem: function (cha) {
        cha.item = new ChannelListDialogItem(cha);
        cha.item.connect('selected', Lang.bind(this, function () {
            Util.ensureActorVisibleInScrollView(this._scrollView, cha.item.actor);
            this._selectChannel(cha);
        }));
        this._itemBox.add_child(cha.item.actor);
    }
});


var ChannelListDialogItem = new Lang.Class({
    Name: 'ChannelListDialogItem',

    _init: function (cha) {
        let channel = cha;

        // Create Actor for ItemBox
        this.actor = new St.BoxLayout({
            style_class: 'nm-dialog-item',
            can_focus: true,
            reactive: true
        });
        this.actor.connect('key-focus-in', Lang.bind(this, function () {
            this.emit('selected');
        }));
        let action = new Clutter.ClickAction();
        action.connect('clicked', Lang.bind(this, function () {
            this.actor.grab_key_focus(); // needed for setting the correct focus
            _selectedChannel = channel;
        }));

        //  Set Channel Name
        let streaminfo = channel.getCodec() != null && channel.getBitrate() != null ? " (" + channel.getCodec() + " | " + channel.getBitrate() + " kbps)" : "";
        let title = channel.getName() + streaminfo;
        this._label = new St.Label({
            text: title
        });

        this._favouriteIcon = new St.Icon({
            style_class: 'nm-dialog-icon'
        });
        // Set Favourite Icon
        this._icons = new St.Button({
            style_class: 'nm-dialog-icons'
        });
        if (channel.getFavourite()) {
            this._favouriteIcon.set_icon_name(FavouriteEnabledIcon);
        } else {
            this._favouriteIcon.set_icon_name(FavouriteDisabledIcon);
        }

        // Set - unset Favourites
        this._icons.connect('clicked', Lang.bind(this, function () {
            if (channel.getFavourite()) {
                this._favouriteIcon.set_icon_name(FavouriteDisabledIcon);
                channel.setFavourite(false);
                MyE.radioMenu._updateChannel(channel);
                MyE.radioMenu._removeFromFavourites(channel);
            } else {
                this._favouriteIcon.set_icon_name(FavouriteEnabledIcon);
                channel.setFavourite(true);
                MyE.radioMenu._updateChannel(channel);
                MyE.radioMenu._destroyMenuItems();
                MyE.radioMenu._addToFavourites(channel);
                MyE.radioMenu._buildMenuItems();
            }
        }));
        this._icons.set_child(this._favouriteIcon);

        // Add Action, Label and Favourite icon to the Actor
        this.actor.add_action(action);
        this.actor.label_actor = this._label;
        this.actor.add(this._label, {
            x_align: St.Align.START
        });
        this.actor.add(this._icons, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
    },

});
Signals.addSignalMethods(ChannelListDialogItem.prototype);
