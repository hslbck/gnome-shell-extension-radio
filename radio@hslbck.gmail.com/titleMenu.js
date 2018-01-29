/*
    Copyright (C) 2017 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Main = imports.ui.main;
const St = imports.gi.St;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const MyE = Extension.imports.extension;

var TitleMenuButton = new Lang.Class({
    Name: 'Title Button',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, Extension.metadata.name);

        this._titleInfo = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.actor.add_actor(this._titleInfo);
        this.actor.add_style_class_name('panel-status-button');
        this.actor.connect('button-press-event', Lang.bind(this, this._copyTagOnMiddleClick));
    },

    _updateTitleInfo: function (channel, titleInfo) {
        this._titleInfo.set_text(channel + ": " + titleInfo);
    },

    _copyTagOnMiddleClick: function (actor, event) {
        // left click === 1, middle click === 2, right click === 3
        if (event.get_button() === 2) {
            MyE.radioMenu._copyTagToClipboard();
        }
    }
});

let titleMenu;

function addToPanel() {
    titleMenu = new TitleMenuButton();
    Main.panel.addToStatusArea('titleMenu', titleMenu, 0, 'right');
}

function removeFromPanel() {
    if (titleMenu != null) {
        titleMenu.destroy();
    }
}

function updateTitle(channel, title) {
    if (titleMenu != null) {
        titleMenu._updateTitleInfo(channel, title);
    }
}
