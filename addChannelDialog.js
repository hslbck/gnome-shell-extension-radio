const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const ModalDialog = imports.ui.modalDialog;
const ShellEntry = imports.ui.shellEntry;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.extension;

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// import to get m3u, pls files
const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionSync();

let oldChannel = null;

const AddChannelDialog = new Lang.Class({
    Name: 'AddChannelDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function (channel) {
        oldChannel = channel;
        this.parent({
            styleClass: 'run-dialog'
        });
        this._buildLayout();
    },

    _buildLayout: function () {

        // Entry for the name of the channel
        let name = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Channel Name")
        });
        this.contentLayout.add(name, {
            y_align: St.Align.START
        });
        this._nameEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._nameEntry);
        this._nameEntry.label_actor = name;
        this._nameEntryText = this._nameEntry.clutter_text;
        this.contentLayout.add(this._nameEntry, {
            y_align: St.Align.START
        });

        // entry for the stream address of the channel
        let address = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Stream Address")
        });
        this.contentLayout.add(address, {
            y_align: St.Align.START
        });
        this._addressEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._addressEntry);
        this._addressEntry.label_actor = address;
        this._addressEntryText = this._addressEntry.clutter_text;
        this.contentLayout.add(this._addressEntry, {
            y_align: St.Align.START
        });

        // set values when editing a channel
        this._setTextValues();

        // set focus on the name entry
        this.setInitialKeyFocus(this._nameEntryText);

        this._disconnectButton = this.addButton({
            action: Lang.bind(this, this.close),
            label: _("Cancel"),
            key: Clutter.Escape
        });
        this._connectButton = this.addButton({
            action: Lang.bind(this, this._createChannel),
            label: _("Add"),
            key: Clutter.Return
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });
    },

    _setTextValues: function () {
        if (oldChannel != null) {
            this._nameEntry.set_text(oldChannel.getName());
            this._addressEntry.set_text(oldChannel.getUri());
        }
    },

    // create a new channel
    _createChannel: function () {
        let inputName = this._nameEntry.get_text();
        let inputStream = this._getStreamAddress(this._addressEntry.get_text());
        let newChannel = new Channel.Channel(inputName, inputStream, false, false);
        if (oldChannel != null) {
            if (oldChannel.getFavourite()){
                newChannel.setFavourite(oldChannel.getFavourite());
                MyE.radioMenu._removeFromFavourites(oldChannel);
                MyE.radioMenu._addToFavourites(newChannel);
            }
            MyE.radioMenu._deleteChannel(oldChannel);
        }
        MyE.radioMenu._addChannel(newChannel);
        this.close();
    },

    // get the valid stream address
    _getStreamAddress: function (input) {
        let streamAddress;
        let regexp = /\.(m3u|m3u8|pls)/i;

        // test for m3u / pls
        if (input.search(regexp) != -1) {

            // get file
            var message = Soup.Message.new('GET', input);
            _httpSession.send_message(message);
            // request ok
            if (message.status_code === 200) {
                let content = message.response_body.data;
                let contentLines = content.split('\n');
                // look for stream url
                for (var line in contentLines) {
                    if (contentLines[line].search(/http:/i) != -1) {
                        // get url
                        streamAddress = contentLines[line].slice((contentLines[line].search(/http:/))) //, contentLines[line].search(/\n/));
                        break;  // break on the first occurrence
                    }
                }
            }
        } else {
            streamAddress = input; // case for valid stream address
        }
        return streamAddress;
    }

});
