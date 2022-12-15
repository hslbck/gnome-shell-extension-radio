/*
    Copyright (C) 2017 - 2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const MyE = Extension.imports.radioMenu;

let TitleMenuButton = GObject.registerClass (
    class TitleMenuButton extends PanelMenu.Button {

    _init() {
        super._init(0.0, Extension.metadata.name);

        this._titleInfo = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.add_actor(this._titleInfo);
        this.add_style_class_name('panel-status-button');
        this.connect('button-press-event', this._copyTagOnMiddleClick.bind(this));
    }

    _updateTitleInfo(channel, titleInfo) {
        this._titleInfo.set_text(titleInfo);
    }

    _copyTagOnMiddleClick(actor, event) {
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
        titleMenu = null;
    }
}

function updateTitle(channel, title) {
    if (titleMenu != null) {
        titleMenu._updateTitleInfo(channel, title);
    }
}
