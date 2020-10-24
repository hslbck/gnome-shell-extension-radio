/*
    Copyright (C) 2018 Léo Andrès <leo@ndrs.fr>
    Copyright (C) 2019 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const ModalDialog = imports.ui.modalDialog;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Tweener = imports.tweener.tweener;

const DIALOG_GROW_TIME = 0.1;

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

// import to get m3u, pls files
const Soup = imports.gi.Soup;
const _httpSession = new Soup.SessionSync();

var ChannelCreator = GObject.registerClass(
  class ChannelCreator extends ModalDialog.ModalDialog {


    _buildErrorLayout () {

        this._errorBox = new St.BoxLayout({ style_class: 'run-dialog-error-box' });

        this.contentLayout.add_child(this._errorBox);

        let errorIcon = new St.Icon({ icon_name: 'dialog-error', icon_size: 24, style_class: 'run-dialog-error-icon' });

        this._errorBox.add_child(errorIcon);

        this._errorMessage = new St.Label({ style_class: 'run-dialog-error-label' });
        this._errorMessage.clutter_text.line_wrap = true;

        this._errorBox.add_child(this._errorMessage);

        this._errorBox.hide();
    }

    _showError(message) {

        this._errorMessage.set_text(message);

        if (!this._errorBox.visible) {

            let [errorBoxMinHeight, errorBoxNaturalHeight] = this._errorBox.get_preferred_height(-1);
            let parentActor = this._errorBox.get_parent();

            Tweener.addTween(parentActor,
              { height: parentActor.height + errorBoxNaturalHeight,
                time: DIALOG_GROW_TIME,
                transition: 'easeOutQuad',
                onComplete: () => {
                  parentActor.set_height(-1);
                  this._errorBox.show();
                }
            });
        }
    }

    // get the valid stream address
    _getStreamAddress(input) {
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
              else {
                this._showError(_("No server stream address found!"));
              }
          } else {
            this._showError(_("Invalid input stream address!"));
          }

            return;
        }
        return input; // case for valid stream address
    }
});
