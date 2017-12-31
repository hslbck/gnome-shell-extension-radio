/* jshint esnext:true */
/*
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2014-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Lang = imports.lang;

var Channel = new Lang.Class({
    Name: 'Channel',

    _init: function (name, uri, favourite, encoding) {
        this._name = name;
        this._uri = uri;
        this._favourite = favourite;
        this._encoding = encoding;
        this._bitrate = null;
        this._codec = null;
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

    setBitrate: function(bitrate) {
        this._bitrate = bitrate;
    },

    getBitrate: function() {
        return this._bitrate;
    },

    setCodec: function(codec) {
        this._codec = codec;
    },

    getCodec: function() {
        return this._codec;
    },

    getEncoding: function () {

        if(typeof this._encoding === 'string') {
            return this._encoding.toLowerCase();
        } else if(typeof this._encoding === 'undefined') {
              this.setEncoding(false);
        }

        return this._encoding;
    }
});
