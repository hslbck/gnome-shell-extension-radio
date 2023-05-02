/*
    Copyright (C) 2014-2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const RadioMenu = Me.imports.radioMenu;
const Prefs = Me.imports.prefs;

// init with translation support
function init(meta) {
   ExtensionUtils.initTranslations();
   return new Extension();
}

class Extension {
  constructor() {
      this._sessionId = null;
      this._radioIsOn = false;
  }

  _onSessionModeEvent(session) {
    if (session.currentMode === 'user' || session.parentMode === 'user') {
      if(Prefs._settings.get_boolean(Prefs.SETTING_PLAY_AFTER_LOCK) === false){
        //radio was removed so add it again
        this.show();
        //radio was playing and resume is set
        if(Prefs._settings.get_boolean(Prefs.SETTING_RESUME_AFTER_UNLOCK) === true
          && this._radioIsOn === true){
          RadioMenu._onPlayButtonClicked();
        }
      }
    } else if (session.currentMode === 'unlock-dialog') {
      if(Prefs._settings.get_boolean(Prefs.SETTING_PLAY_AFTER_LOCK) === false){
        this._radioIsOn = RadioMenu.isPlaying
        this.hide();
      }
    }
  }

  // build and add the extension
  enable() {
    //register session events
    if(this._sessionId == null){
        this._sessionId = Main.sessionMode.connect('updated',
           this._onSessionModeEvent.bind(this));
    }
    this.show();
  }

  //  stop playing and destroy extension content
  disable() {
    this.hide();
  }
  show(){
    RadioMenu.addToPanel();
  }

  hide(){
    RadioMenu.removeFromPanel();
  }
}




