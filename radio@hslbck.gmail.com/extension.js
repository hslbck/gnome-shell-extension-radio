/*
    Copyright (C) 2014-2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as RadioMenu from './radioMenu.js'

export default class RadioExt extends Extension {
    constructor(metadata) {
        super(metadata);
        this.initTranslations();
    }
    // build and add the extension
    enable() {
        RadioMenu.addToPanel(this);
    }

    //  stop playing and destroy extension content
    disable() {
        RadioMenu.removeFromPanel();
    }
}
