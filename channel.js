/* jshint esnext:true */
const Lang = imports.lang;

const Channel = new Lang.Class({
    Name: 'Channel',

    _init: function (name, uri, favourite) {
        this._name = name;
        this._uri = uri;
        this._favourite = favourite;
    },

    setName: function (name) {
        this._name = name;
    },

    setUri: function (uri) {
        this._uri = uri;
    },

    setFavourite: function (favourite) {
        this._favourite = favourite;
    },

    getName: function () {
        return this._name;
    },

    getUri: function () {
        return this._uri;
    },

    getFavourite: function () {
        return this._favourite;
    }
});
