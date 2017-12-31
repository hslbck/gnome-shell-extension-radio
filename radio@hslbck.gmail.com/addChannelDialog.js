/*
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const St = imports.gi.St;
const ModalDialog = imports.ui.modalDialog;
const ShellEntry = imports.ui.shellEntry;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const ChannelListDialog = Extension.imports.channelListDialog;
const MyE = Extension.imports.extension;
const Convert = Extension.imports.convertCharset;
const Tweener = imports.ui.tweener;

const DIALOG_GROW_TIME = 0.1;

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// import to get m3u, pls files
const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionSync();

let oldChannel = null;

var AddChannelDialog = new Lang.Class({
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

        // entry for optional tag text charset conversion
        let charset = new St.Label({
            style_class: 'run-dialog-label',
            text: _("Charset (optional)")
        });
        this.contentLayout.add(charset, {
            y_align: St.Align.START
        });
        this._charsetEntry = new St.Entry({
            style_class: 'run-dialog-entry',
            can_focus: true
        });
        ShellEntry.addContextMenu(this._charsetEntry);
        this._charsetEntry.label_actor = charset;
        this._charsetEntryText = this._charsetEntry.clutter_text;
        this.contentLayout.add(this._charsetEntry, {
            y_align: St.Align.START
        });

        // set values when editing a channel
        this._setTextValues();

        // set focus on the name entry
        this.setInitialKeyFocus(this._nameEntryText);

        this._disconnectButton = this.addButton({
            action: Lang.bind(this, this._closeDialog),
            label: _("Cancel"),
            key: Clutter.Escape
        });

        let connectLabel = oldChannel != null ? _("Save") : _("Add");

        this._connectButton = this.addButton({
            action: Lang.bind(this, this._createChannel),
            label: connectLabel,
            key: Clutter.Return
        }, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END
        });

        this._errorBox = new St.BoxLayout({ style_class: 'run-dialog-error-box' });

        this.contentLayout.add(this._errorBox, { expand: true });

        let errorIcon = new St.Icon({ icon_name: 'dialog-error', icon_size: 24, style_class: 'run-dialog-error-icon' });

        this._errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });


        this._errorMessage = new St.Label({ style_class: 'run-dialog-error-label' });
        this._errorMessage.clutter_text.line_wrap = true;

        this._errorBox.add(this._errorMessage, { expand: true,
                                                 y_align: St.Align.MIDDLE,
                                                 y_fill: false });

        this._errorBox.hide();
    },

    _setTextValues: function () {
        if (oldChannel != null) {
            this._nameEntry.set_text(oldChannel.getName());
            this._addressEntry.set_text(oldChannel.getUri());
            if(oldChannel.getEncoding() !== false) {
                this._charsetEntry.set_text(oldChannel.getEncoding());
            }
        }
    },

    // create a new channel
    _createChannel: function () {

        let inputName = this._nameEntry.get_text();
        let inputStream = this._getStreamAddress(this._addressEntry.get_text());

        if (inputStream) {
          let inputCharset = false;
          if (this._charsetEntry.get_text() !== "") {
              inputCharset = Convert.validate(this._charsetEntry.get_text().toLowerCase());
          }
          let newChannel = new Channel.Channel(inputName, inputStream, false, inputCharset);
          if (oldChannel != null) {
              if (oldChannel.getFavourite()){
                  newChannel.setFavourite(oldChannel.getFavourite());
              }
              MyE.radioMenu._deleteChannel(oldChannel);
          }
          MyE.radioMenu._addChannel(newChannel);
          if (newChannel.getFavourite()){
              MyE.radioMenu._destroyMenuItems();
              MyE.radioMenu._addToFavourites(newChannel);
              MyE.radioMenu._buildMenuItems();
          }
          this._closeDialog();
        }
    },

    _showError: function(message) {

        this._errorMessage.set_text(message);

        if (!this._errorBox.visible) {

            let [errorBoxMinHeight, errorBoxNaturalHeight] = this._errorBox.get_preferred_height(-1);
            let parentActor = this._errorBox.get_parent();

            Tweener.addTween(parentActor,
              { height: parentActor.height + errorBoxNaturalHeight,
                time: DIALOG_GROW_TIME,
                transition: 'easeOutQuad',
                onComplete: Lang.bind(this, function() {
                  parentActor.set_height(-1);
                  this._errorBox.show();
                })
            });
        }
    },

    _closeDialog: function() {
        this.close();
        if (oldChannel != null) {
            this.channelListDialog = new ChannelListDialog.ChannelListDialog();
            this.channelListDialog.open();
        }
    },

    // get the valid stream address
    _getStreamAddress: function(input) {
        let regexp = /\.(m3u|m3u8|pls)/i;

        // test for m3u / pls
        if (input.search(regexp) != -1) {

            // get file
            var message = Soup.Message.new('GET', input);

            if (message != null) {
              _httpSession.send_message(message);

              // request ok
              if (message.status_code === 200) {
                  let content = message.response_body.data;
                  let contentLines = content.split('\n');
                  // look for stream url
                  for (var line in contentLines) {
                      if (contentLines[line].search(/http:/i) != -1) {
                          // get url
                          return contentLines[line].slice((contentLines[line].search(/http:/))) //, contentLines[line].search(/\n/));
                      }
                  }
              }
              this._showError(_("Invalid server answer"));
          } else {
            this._showError(_("Invalid input"));
          }

            return;
        }

        return input; // case for valid stream address
    }
});
