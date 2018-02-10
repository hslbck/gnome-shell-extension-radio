/*
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const RadioMenu = Extension.imports.radioMenu;

// ToDo: move to radio menu for settings
const RadioSearchProvider = Extension.imports.searchProvider;

var radioMenu;
var radioSearchProvider;

// init with translation support
function init() {
    Convenience.initTranslations("radio@hslbck.gmail.com");
}

// build and add the extension
function enable() {
    radioMenu = new RadioMenu.RadioMenuButton();
    Main.panel.addToStatusArea('radioMenu', radioMenu);

    if (!radioSearchProvider) {
        radioSearchProvider = new RadioSearchProvider.RadioSearchProvider();
        Main.overview.viewSelector._searchResults._registerProvider(radioSearchProvider);
    }
}

//  stop playing and destroy extension content
function disable() {
    // stop playing before destruction
    // affects lock screen
    if (radioSearchProvider) {
        Main.overview.viewSelector._searchResults._unregisterProvider(radioSearchProvider);
        radioSearchProvider = null;
    }
    radioMenu._stop();
    radioMenu._disconnectMediaKeys();
    radioMenu.destroy();
}
