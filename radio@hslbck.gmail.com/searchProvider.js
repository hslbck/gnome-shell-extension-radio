/*
    Copyright (C) 2018 hslbck <hslbck@gmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Search = imports.ui.search;
const St = imports.gi.St;

const StoppedIcon = "gser-icon-stopped-symbolic";

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
        this._results = ["byte"];
        callback(this._results);
    },

    getSubsearchResultSet: function (previous_results, terms, results) {

    },

    getResultMetas: function (ids, callback) {
        // let resultMetas = this._results.filter(function (res) {
        //     return ids.indexOf(res.id) !== -1;
        // });
        let resultMetas =  [{id: 'byte', name: 'Byte FM', description: 'Test', path: 'path', createIcon: function (size){}}];
        callback(resultMetas);
    },

    activateResult: function (id, terms, timestamp) {

    },

    filterResults: function(results, max) {
        return results.slice(0, max);
    },

});
