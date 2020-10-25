/*
    Copyright (C) 2016-2019 hslbck <hslbck@gmail.com>
    Copyright (C) 2016-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const ShellEntry = imports.ui.shellEntry;
const Util = imports.misc.util;
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Soup = imports.gi.Soup;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const ChannelListDialog = Extension.imports.channelListDialog;
const Channel = Extension.imports.channel;
const AddChannelDialog = Extension.imports.addChannelDialog;
const MyE = Extension.imports.radioMenu;
const ChannelCreator = Extension.imports.channelCreator;

const RADIO_BROWSER_API = 'http://all.api.radio-browser.info/json/servers';

let _selectedChannel;
let _httpSession;
let _server

var SearchDialog = GObject.registerClass(
  class SearchDialog extends ChannelCreator.ChannelCreator {

    _init() {
        super._init({
            styleClass: 'nm-dialog'
        });
        _httpSession = new Soup.Session({
            user_agent: 'GSE Radio',
            timeout: 10
        });
        this._setServer();
        this._buildLayout();
    }

        _setServer() {
            if (!_server) {
                let message = Soup.Message.new('GET', RADIO_BROWSER_API);

                if (message != null) {

                    // async call
                    _httpSession.queue_message(message, function (_httpSession, message) {
                        if (message.status_code === 200) {
                            let response = message.response_body.data;
                            let jsonResponse = JSON.parse(response);
                            if (jsonResponse.length > 0) {
                                _server = jsonResponse[Math.floor(Math.random() * jsonResponse.length)].name;
                            } else {
                                global.log("radio@ : No radio server api!");
                            }
                        } else {
                            let txt = _("Server returned status code");
                            searchDialog._addMessage(txt + " " + message.status_code);
                        }
                    });
                }
            }
        }

    _buildLayout() {
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
            style_class: 'custom-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._searchEntry);
        this._searchEntryText = this._searchEntry.clutter_text;
        this._searchEntryText.connect('key-press-event', this._onKeyPressEvent.bind(this));

        this.setInitialKeyFocus(this._searchEntryText);

        let searchButton = new St.Button({
            style_class: 'button custom-search-button',
            label: _("Search"),
            can_focus: true,
            reactive: true
        });
        searchButton.connect('clicked', this._search.bind(this));

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

        this.contentLayout.add_child(this._stack);

        // Cancel and Add Channel Button
        this._cancelButton = this.addButton({
            action: this.close.bind(this),
            label: _("Cancel")
        }, {
            x_align: St.Align.START
        });
        this._addButton = this.addButton({
            action: this._add.bind(this),
            label: _("Add")
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
        this._addButton.reactive = false;
        this._addButton.can_focus = false;

        this._buildErrorLayout();
    }

    _add() {
        if (_selectedChannel != null) {
            _selectedChannel.setBitrate(null);
            _selectedChannel.setCodec(null);
            MyE.radioMenu._addChannel(_selectedChannel);
            if (_selectedChannel.getFavourite()) {
                MyE.radioMenu._destroyMenuItems();
                MyE.radioMenu._addToFavourites(_selectedChannel);
                MyE.radioMenu._buildMenuItems();
            }
            this._itemBox.remove_all_children();
            this._addMessage(_("Station added:") + " " + _selectedChannel.getName());
            this._addButton.reactive = false;
            this._addButton.can_focus = false;
        }
    }

    _search() {
        let searchDialog = this;
        let input = this._searchEntry.get_text();
        this._itemBox.remove_all_children();
        if (input != null && input.trim().length > 0) {
            let url = "http://" + _server + "/json/stations/byname/" + input;
            var message = Soup.Message.new('POST', url);
            var postParams = 'name=' + input + '&limit=15';
            message.set_request('application/x-www-form-urlencoded', Soup.MemoryUse.COPY, postParams);

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
    }

    _createChannel(jsonObject) {
        // only add playable stations
        if (jsonObject.lastcheckok == 1) {
            let name = jsonObject.name;
            let url = jsonObject.url;
            let bitrate = jsonObject.bitrate;
            let codec = jsonObject.codec;
            let streamAddress = this._getStreamAddress(url);
            if (streamAddress) {
              let channel = new Channel.Channel(null, name, streamAddress, true, false);
              channel.setCodec(codec);
              channel.setBitrate(bitrate);
              this._createChannelListItem(channel);
              this._errorBox.hide();
            }
        }
    }

    _addMessage(message) {
        let messageLabel = new St.Label({
            style_class: 'nm-dialog-header',
            text: message
        });
        this._itemBox.add_child(messageLabel);
    }

    // Set the Selected Channel
    _selectChannel(cha) {
        this._addButton.reactive = true;
        this._addButton.can_focus = true;
        if (_selectedChannel) {
            _selectedChannel.item.actor.remove_style_pseudo_class('selected');
        }

        _selectedChannel = cha;

        if (_selectedChannel) {
            _selectedChannel.item.actor.add_style_pseudo_class('selected');
        }
    }

    _createChannelListItem (cha) {
        cha.item = new ChannelListDialog.ChannelListDialogItem(cha);
        cha.item.connect('selected', () => {
            Util.ensureActorVisibleInScrollView(this._scrollView, cha.item.actor);
            this._selectChannel(cha);
        });
        this._itemBox.add_child(cha.item.actor);
    }

    _onKeyPressEvent(object, event) {
       let keyPressed = event.get_key_symbol();
       if (keyPressed == Clutter.KEY_Return || keyPressed == Clutter.KEY_KP_Enter || keyPressed == Clutter.KEY_ISO_Entern){
           this._search();
       } else if (keyPressed == Clutter.KEY_Escape){
           this.close();
       }
   }
});
