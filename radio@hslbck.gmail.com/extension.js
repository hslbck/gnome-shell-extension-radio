/*
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const RadioMenu = Extension.imports.radioMenu;

let radioMenu;

// init with translation support
function init() {
    Convenience.initTranslations("radio@hslbck.gmail.com");
}

// build and add the extension
function enable() {
    radioMenu = new RadioMenu.RadioMenuButton();
    Main.panel.addToStatusArea('radioMenu', radioMenu);
}

//  stop playing and destroy extension content
function disable() {
    // stop playing before destruction
    // affects lock screen
    radioMenu._stop();
    radioMenu._disconnectMediaKeys();
    radioMenu._destroy();
}
