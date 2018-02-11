/*
    Copyright (C) 2018 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Search = imports.ui.search;
const St = imports.gi.St;
const Io = Extension.imports.io;
const MyE = Extension.imports.extension;
const Main = imports.ui.main;

const StoppedIcon = "gser-icon-stopped-symbolic";

var radioSearchProvider;

function enableProvider() {
    if (!radioSearchProvider) {
        radioSearchProvider = new RadioSearchProvider();
        Main.overview.viewSelector._searchResults._registerProvider(radioSearchProvider);
    }
}

function disableProvider() {
    if (radioSearchProvider) {
        Main.overview.viewSelector._searchResults._unregisterProvider(radioSearchProvider);
        radioSearchProvider = null;
    }
}

var RadioSearchProvider = new Lang.Class({
    Name: 'RadioSearchProvider',
    Extends: Search.SearchProvider,

    _init: function () {
        this.id = "RadioSearchProvider";
        this.title = "Internet Radio Search Provider";

        this.appInfo = {
                get_name: function () { return 'Internet Radio';},
                get_icon: function() {
                    Gtk.IconTheme.get_default().append_search_path(Extension.dir.get_child('icons').get_path());
                    return new St.Icon({
                        icon_name: StoppedIcon
                    }).get_gicon();
                },
                get_id: function() {return this.id;}
        };
    },

    getInitialResultSet: function (terms, callback) {
        let channels = Io.read().channels;
        this._results = channels.map(this._createProviderObject);
        this.getSubsearchResultSet(undefined, terms, callback);
    },

    getSubsearchResultSet: function (previous_results, terms, callback) {
        let search = terms.join(" ").toLowerCase();
           function containsSearch(candidate) {
             return candidate.name.toLowerCase().indexOf(search) !== -1;
           }
           function getId(candidate) {
             return candidate.id;
           };
        callback(this._results.filter(containsSearch).map(getId));
    },

    getResultMetas: function (ids, callback) {
        let resultMetas = this._results.filter(function (res) {
            return ids.indexOf(res.id) !== -1;
        });
        callback(resultMetas);
    },

    activateResult: function (id, terms, timestamp) {
        let result = this._results.filter(function(res) {
            return res.id === id;
        })[0];
        MyE.radioMenu._changeChannelById(result.id);
    },

    filterResults: function(results, max) {
        return results.slice(0, max);
    },

    _createProviderObject: function(channel) {
        return {
            id: channel.id,
            name: channel.name,
            description: channel.address,
            createIcon: function (size) {}
        };
    }

});
