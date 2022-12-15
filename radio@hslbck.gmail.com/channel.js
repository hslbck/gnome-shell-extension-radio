/* jshint esnext:true */
/*
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2014-2022 hslbck <hslbck@gmail.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

var Channel = class Channel {

    constructor(id, name, uri, favourite, encoding) {
        this._id = id !== null && id !== undefined ? id : generateId();
        this._name = name;
        this._uri = uri;
        this._favourite = favourite;
        this._encoding = encoding;
        this._bitrate = null;
        this._codec = null;
    }

    setName(name) {
        this._name = name;
    }

    setUri(uri) {
        this._uri = uri;
    }

    setFavourite(favourite) {
        this._favourite = favourite;
    }

    setEncoding(encoding) {
        this._encoding = encoding;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    getUri() {
        return this._uri;
    }

    getFavourite() {
        return this._favourite;
    }

    setBitrate(bitrate) {
        this._bitrate = bitrate;
    }

    getBitrate() {
        return this._bitrate;
    }

    setCodec(codec) {
        this._codec = codec;
    }

    getCodec() {
        return this._codec;
    }

    getEncoding() {

        if(typeof this._encoding === 'string') {
            return this._encoding.toLowerCase();
        } else if(typeof this._encoding === 'undefined') {
              this.setEncoding(false);
        }

        return this._encoding;
    }
};

function generateId () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
}
