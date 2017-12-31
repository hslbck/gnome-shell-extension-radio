/*
    Copyright (C) 2015-2017 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
    Copyright (C) 2017-2018 Léo Andrès <leo@ndrs.fr>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
/**
 * player.js
 * setup the pipeline, start and stop the stream
 */
imports.gi.versions.Gst = '1.0';

const Lang = imports.lang;
const Gst = imports.gi.Gst;
const Gstpbutils = imports.gi.GstPbutils;
const Mainloop = imports.mainloop;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.extension;
const Convert = Extension.imports.convertCharset;
const Convenience = Extension.imports.convenience;

const SETTING_VOLUME_LEVEL = 'volume-level';

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

var Player = new Lang.Class({
    Name: 'Player',

    _init: function (channel) {
        Gst.init(null);

        this._currentChannel = channel;
        this._pipeline = new Gst.Pipeline({
            name: "Stream"
        });

	    //read settings
        this._settings = Convenience.getSettings();

        this._tag = "";
        this._setup();
    },

    _setup: function() {
        this._source = Gst.ElementFactory.make("playbin", "source");
        this._source.set_property("uri", this._currentChannel.getUri());

        this._source.set_property("volume", this._settings.get_double(SETTING_VOLUME_LEVEL) );
        this._pipeline.add(this._source);
        this._readTags();
    },

    _start: function() {
        this._pipeline.set_state(Gst.State.PLAYING);
    },

    _stop: function() {
        this._pipeline.set_state(Gst.State.NULL);
    },

    _changeChannel: function(channel) {
        this._currentChannel = channel;
        this._pipeline.remove(this._source);
        this._setup();
    },

    _setVolume: function(volume) {
        let level = Math.pow(volume, 3);
        if(this._source){
          this._source.set_property("volume", level);
        }
        this._settings.set_double(SETTING_VOLUME_LEVEL, level);
    },


    _readTags: function() {
        this._sourceBus = this._pipeline.get_bus();
        let sbus = this._sourceBus;
        this._sourceBus.add_signal_watch();
        this._sourceBusId = this._sourceBus.connect('message', Lang.bind(this, function(sbus, message) {
            if (message !== null) {
                this._onGstMessage(message);
            }
        }));
    },

    _onGstMessage: function(message) {
        switch (message.type) {
            case Gst.MessageType.ELEMENT:
                 if (Gstpbutils.is_missing_plugin_message(message)) {
                     let pluginDescription = Gstpbutils.missing_plugin_message_get_description(message);
                     MyE.radioMenu._stop();
                     MyE.radioMenu.playLabel.set_text(_("Missing plugin"));
                     global.log("Gstreamer plugin missing for " + pluginDescription);
                 }
                 break;
            case Gst.MessageType.TAG:
                let tagList = message.parse_tag();
                let tmp = tagList.get_string('title').toString();
                if (tmp.match('true')) {
                    switch (this._getCurrentChannel().getEncoding()) {
                        case "windows-1251":
                            this._tag = Convert.convertToUnicode("windows-1251", tmp.slice(5));
                            break;
                        case "windows-1252":
                            this._tag = Convert.convertToUnicode("windows-1252", tmp.slice(5));
                            break;
                        case "windows-1253":
                            this._tag = Convert.convertToUnicode("windows-1253", tmp.slice(5));
                            break;
                        case "windows-1257":
                            this._tag = Convert.convertToUnicode("windows-1257", tmp.slice(5));
                            break;
                        case "koi8-r":
                            this._tag = Convert.convertToUnicode("koi8-r", tmp.slice(5));
                            break;
                        case "koi8-u":
                            this._tag = Convert.convertToUnicode("koi8-u", tmp.slice(5));
                            break;
                         default:
                            this._tag = tmp.slice(5);
                            break;
                    }
                } else {
                    this._tag = "";
                }
                break;
            case Gst.MessageType.ERROR:
                MyE.radioMenu._stop();
                MyE.radioMenu.playLabel.set_text(_("Stream error"));
                break;
            case Gst.MessageType.EOS:
                MyE.radioMenu._stop();
                MyE.radioMenu.playLabel.set_text(_("End of stream"));
                break;
            default:
                break;
        }
    },

    _getTag: function() {
        return this._tag;
    },

    _getTagWithLineBreaks: function() {
        let tagArray = this._tag.trim().split(" ");
        let tmpTag = "";
        let splitIndex = 42;
        for (let i = 0; i < tagArray.length; i++) {
          if ((tmpTag.length + tagArray[i].length) >= splitIndex) {
            splitIndex += 42;
            tmpTag += "\n";
          }
          tmpTag += tagArray[i] + " ";
        }
        return tmpTag;
    },

    _getCurrentChannel: function() {
            return this._currentChannel;
    },

    _disconnectSourceBus: function() {
        if (this._sourceBusId) {
            this._sourceBus.disconnect(this._sourceBusId);
            this._sourceBusId = 0;
        }
    }
});
