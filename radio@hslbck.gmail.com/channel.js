/* jshint esnext:true */
const Lang = imports.lang;

const Channel = new Lang.Class({
    Name: 'Channel',

    _init: function (name, uri, favourite, encoding) {
        this._name = name;
        this._uri = uri;
        this._favourite = favourite;
        this._encoding = encoding;
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

    setEncoding: function (encoding) {
        this._encoding = encoding;
    },

    getName: function () {
        return this._name;
    },

    getUri: function () {
        return this._uri;
    },

    getFavourite: function () {
        return this._favourite;
    },

    getEncoding: function () {
        if(typeof this._encoding === 'undefined') {
            this.setEncoding(false);
        }

        if(typeof this._encoding === 'string') {
            return this._encoding.toLowerCase();
        } else {
            return this._encoding;
        }
    }
});
