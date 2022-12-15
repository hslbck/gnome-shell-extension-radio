/*
    Copyright (C) 2018-2022 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const {Gtk, Gdk, Gio, St} = imports.gi;
const Search = imports.ui.search;
const Io = Extension.imports.io;
const MyE = Extension.imports.radioMenu;
const Main = imports.ui.main;

var radioSearchProvider;

function enableProvider() {
    if (!radioSearchProvider) {
        radioSearchProvider = new RadioSearchProvider();
        Main.overview._overview.controls._searchController._searchResults._registerProvider(radioSearchProvider);
    }
}

function disableProvider() {
    if (radioSearchProvider) {
        Main.overview._overview.controls._searchController._searchResults._unregisterProvider(radioSearchProvider);
        radioSearchProvider = null;
    }
}

var RadioSearchProvider = class RadioSearchProvider {

    constructor() {
        this.appInfo = Gio.AppInfo.get_default_for_uri_scheme('http');
        this.appInfo.get_name = () => {
            return 'Internet Radio';
        };
        this.appInfo.get_icon = () => {
            return Gio.icon_new_for_string(Extension.path + '/icons/gser-icon-stopped-symbolic.svg');
        };
    }

    getInitialResultSet(terms, callback) {
        let channels = Io.read().channels;
        this._results = channels.map(this._createProviderObject);
        this.getSubsearchResultSet(undefined, terms, callback);
    }

    getSubsearchResultSet(previous_results, terms, callback) {
        let search = terms.join(" ").toLowerCase();
        function containsSearch(candidate) {
            return candidate.name.toLowerCase().indexOf(search) !== -1;
        }
        function getId(candidate) {
            return candidate.id;
        };
        callback(this._results.filter(containsSearch).map(getId));
    }

    getResultMetas(ids, callback) {
        let resultMetas = this._results.filter(function (res) {
            return ids.indexOf(res.id) !== -1;
        });
        callback(resultMetas);
    }

    activateResult(id, terms, timestamp) {
        let result = this._results.filter(function (res) {
            return res.id === id;
        })[0];
        MyE.radioMenu._changeChannelById(result.id);
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
