/*
    Copyright (C) 2014-2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const RadioMenu = Extension.imports.radioMenu;

// init with translation support
function init() {
    ExtensionUtils.initTranslations();
}

// build and add the extension
function enable() {
    RadioMenu.addToPanel();
}

//  stop playing and destroy extension content
function disable() {
    RadioMenu.removeFromPanel();
}
