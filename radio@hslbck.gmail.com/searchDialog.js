/*
    Copyright (C) 2016-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const St = imports.gi.St;
const ModalDialog = imports.ui.modalDialog;
const ShellEntry = imports.ui.shellEntry;
const Util = imports.misc.util;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Soup = imports.gi.Soup;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const ChannelListDialog = Extension.imports.channelListDialog;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const MyE = Extension.imports.extension;

const _httpSession = new Soup.SessionAsync();
_httpSession.user_agent = "GSE Radio";
_httpSession.timeout = 10;
let _selectedChannel;

var SearchDialog = new Lang.Class({
    Name: 'SearchDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function () {
        this.parent({
            styleClass: 'nm-dialog'
        });
        this._buildLayout();
    },

    _buildLayout: function () {
        let headline = new St.BoxLayout({
            style_class: 'nm-dialog-header-hbox',
            vertical: true
        });

        let titleBox = new St.BoxLayout({
            vertical: false
        });
        let txt = _("Browse ");
        let uriTxt = "https://www.radio-browser.info";
        let title = new St.Label({
            style_class: 'nm-dialog-header',
            text: txt + " " + uriTxt
        });

        //this._pressedKey = null;

        this._searchEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._searchEntry);
        this._searchEntryText = this._searchEntry.clutter_text;
        this._searchEntryText.connect('key-press-event', Lang.bind(this, this._onKeyPressEvent));

        this.setInitialKeyFocus(this._searchEntryText);

        let searchButton = new St.Button({
            style_class: 'button custom-search-button',
            label: _("Search"),
            can_focus: true,
            reactive: true
        });
        searchButton.connect('clicked', Lang.bind(this, this._search));

        titleBox.add(this._searchEntry);
        titleBox.add(searchButton);

        headline.add(title);
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

        // Cancel and Add Channel Button
        this._cancelButton = this.addButton({
            action: Lang.bind(this, this.close),
            label: _("Cancel")
        }, {
            x_align: St.Align.START
        });
        this._addButton = this.addButton({
            action: Lang.bind(this, this._add),
            label: _("Add")
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
        this._addButton.reactive = false;
        this._addButton.can_focus = false;
    },

    _add: function() {
        if (_selectedChannel != null) {
            MyE.radioMenu._addChannel(_selectedChannel);
            if (_selectedChannel.getFavourite()) {
                MyE.radioMenu._destroyMenuItems();
                MyE.radioMenu._addToFavourites(_selectedChannel);
                MyE.radioMenu._buildMenuItems();
            }
        }
        this.close();
    },

    _search: function() {
        let searchDialog = this;
        let input = this._searchEntry.get_text();
        this._itemBox.remove_all_children();
        if (input != null && input.trim().length > 0) {
            let url = "http://www.radio-browser.info/webservice/json/stations/search"
            var message = Soup.Message.new('POST', url);
            var postParams = 'name=' + input + '&limit=15';
            message.set_request('application/x-www-form-urlencoded', 2, postParams, postParams.length);

            // async call
            _httpSession.queue_message(message, function(_httpSession, message) {
                if ( message.status_code === 200) {
                    let response = message.response_body.data;
                    let jsonResponse = JSON.parse(response);
                    if (jsonResponse.length > 0) {
                        for (var i = 0; i<jsonResponse.length; i++) {
                            searchDialog._createChannel(jsonResponse[i]);
                        }
                    } else {
                        searchDialog._addMessage(_("No radio station found!"));
                    }
                } else {
                    let txt = _("Server returned status code");
                    searchDialog._addMessage(txt + " " + message.status_code);
                }
            });
        } else {
            searchDialog._addMessage(_("Search input was empty!"));
        }
    },

    _createChannel: function(jsonObject) {
        // only add playable stations
        if (jsonObject.lastcheckok == 1) {
            let name = jsonObject.name;
            let url = jsonObject.url;
            let streamAddress = AddChannelDialog.getStreamAddress(url);
            let channel = new Channel.Channel(name, streamAddress, false, false);
            this._createChannelListItem(channel);
        }
    },

    _addMessage: function(message) {
        let messageLabel = new St.Label({
            style_class: 'nm-dialog-header',
            text: message
        });
        this._itemBox.add_child(messageLabel);
    },

    // Set the Selected Channel
    _selectChannel: function (cha) {
        this._addButton.reactive = true;
        this._addButton.can_focus = true;
        if (_selectedChannel) {
            _selectedChannel.item.actor.remove_style_pseudo_class('selected');
        }

        _selectedChannel = cha;

        if (_selectedChannel) {
            _selectedChannel.item.actor.add_style_pseudo_class('selected');
        }
    },

    _createChannelListItem: function (cha) {
        cha.item = new ChannelListDialog.ChannelListDialogItem(cha);
        cha.item.connect('selected', Lang.bind(this, function () {
            Util.ensureActorVisibleInScrollView(this._scrollView, cha.item.actor);
            this._selectChannel(cha);
        }));
        this._itemBox.add_child(cha.item.actor);
    },

    _onKeyPressEvent: function(object, event) {
       let keyPressed = event.get_key_symbol();
       if (keyPressed == Clutter.KEY_Return || keyPressed == Clutter.KEY_KP_Enter || keyPressed == Clutter.KEY_ISO_Entern){
           this._search();
       }
       if (keyPressed == Clutter.KEY_Escape){
           this.close();
       }
   }
});
