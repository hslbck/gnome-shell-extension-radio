/*
    Copyright (C) 2017 - 2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St'; 
import GObject from 'gi://GObject'; 
import Clutter from 'gi://Clutter'; 

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

let TitleMenuButton = GObject.registerClass (
    class TitleMenuButton extends PanelMenu.Button {

    _init(extensionObject) {
        super._init(0.0, extensionObject.metadata.name);

        this._titleInfo = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.add_actor(this._titleInfo);
        this.add_style_class_name('panel-status-button');
        this.connect('button-press-event', this._copyTagOnMiddleClick.bind(this));
        this.extensionObject = extensionObject;
    }

    _updateTitleInfo(channel, titleInfo) {
        this._titleInfo.set_text(titleInfo);
    }

    _copyTagOnMiddleClick(actor, event) {
        // left click === 1, middle click === 2, right click === 3
        if (event.get_button() === 2) {
            this.extensionObject.radioMenu._copyTagToClipboard();
        }
    }
});

let titleMenu;

export function addToPanel(extensionObject) {
    titleMenu = new TitleMenuButton(extensionObject);
    Main.panel.addToStatusArea('titleMenu', titleMenu, 0, 'right');
}

export function removeFromPanel() {
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
