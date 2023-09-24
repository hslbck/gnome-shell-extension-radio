/*
    Copyright (C) 2018-2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

import Gio from 'gi://Gio';
import * as Search from 'resource:///org/gnome/shell/ui/search.js';
import * as Io from './io.js';
import * as RadioMenu from './radioMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
var radioSearchProvider;
var Extension;

export function enableProvider(extensionObject) {
	Extension = extensionObject;
    if (!radioSearchProvider) {
        radioSearchProvider = new RadioSearchProvider(RadioMenu.radioMenu);
        Main.overview._overview.controls._searchController._searchResults._registerProvider(radioSearchProvider);
    }
}

export function disableProvider() {
    if (radioSearchProvider) {
        Main.overview._overview.controls._searchController._searchResults._unregisterProvider(radioSearchProvider);
        radioSearchProvider = null;
    }
}

var RadioSearchProvider = class RadioSearchProvider {

    constructor(radioMenu) {
        this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('http');
        this.appInfo.get_name = () => {
            return 'Internet Radio';
        };
        this.appInfo.get_icon = () => {
            return Gio.icon_new_for_string(Extension.path + '/icons/gser-icon-stopped-symbolic.svg');
        };
        this.radioMenu = radioMenu;
    }

    getInitialResultSet(terms, cancellable = null) {
        let channels = Io.read().channels;
        this._results = channels.map(this._createProviderObject);
	    return new Promise(res => res(this._results));
    }

    getSubsearchResultSet(previous_results, terms, cancellable = null) {
        let search = terms.join(" ").toLowerCase();
        function containsSearch(candidate) {
            return candidate.name.toLowerCase().indexOf(search) !== -1;
        }
        function getId(candidate) {
            return candidate.id;
        };
        return new Promise(res => res(this._results.filter(containsSearch).map(getId)));
    }

    getResultMetas(ids, cancellable = null) {
        let resultMetas = this._results.filter(function (res) {
            return ids.indexOf(res.id) !== -1;
        });
        return new Promise(res => res(resultMetas));
    }

    activateResult(id, terms, timestamp) {
        let result = this._results.filter(function (res) {
            return res.id === id;
        })[0];
        this.radioMenu._changeChannelById(result.id);
    }

    filterResults(results, max) {
        return results.slice(0, max);
    }

    _createProviderObject(channel) {
        return {
            id: channel.id,
            name: channel.name,
            description: channel.address,
            createIcon: function (size) { }
        };
    }

};
