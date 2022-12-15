/*
    Copyright (C) 2015-2022 hslbck <hslbck@gmail.com>
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

const Gst = imports.gi.Gst;
const Gstpbutils = imports.gi.GstPbutils;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.radioMenu;
const Convert = Extension.imports.convertCharset;

const SETTING_VOLUME_LEVEL = 'volume-level';

// translation support
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;

var Player = class Player {

    constructor(channel) {
        Gst.init(null);

        this._currentChannel = channel;
        this._pipeline = new Gst.Pipeline({
            name: "Stream"
        });

	    //read settings
        this._settings = ExtensionUtils.getSettings();

        this._tag = "";
        this._setup();
    }

    _setup() {
        this._source = Gst.ElementFactory.make("playbin", "source");
        this._source.set_property("uri", this._currentChannel.getUri());

        this._source.set_property("volume", this._settings.get_double(SETTING_VOLUME_LEVEL) );
        this._pipeline.add(this._source);
        this._readTags();
    }

    _start() {
        this._pipeline.set_state(Gst.State.PLAYING);
    }

    _stop() {
        this._pipeline.set_state(Gst.State.NULL);
    }

    _changeChannel(channel) {
        this._currentChannel = channel;
        this._pipeline.remove(this._source);
        this._setup();
    }

    _setVolume(volume) {
        let level = Math.pow(volume, 3);
        if(this._source){
          this._source.set_property("volume", level);
        }
        this._settings.set_double(SETTING_VOLUME_LEVEL, level);
    }


    _readTags() {
        this._sourceBus = this._pipeline.get_bus();
        let sbus = this._sourceBus;
        this._sourceBus.add_signal_watch();
        this._sourceBusId = this._sourceBus.connect('message', (sbus, message) => {
            if (message !== null) {
                this._onGstMessage(message);
            }
        });
    }

    _onGstMessage(message) {
        switch (message.type) {
            case Gst.MessageType.ELEMENT:
                 if (Gstpbutils.is_missing_plugin_message(message)) {
                     let pluginDescription = Gstpbutils.missing_plugin_message_get_description(message);
                     MyE.radioMenu._stop();
                     MyE.radioMenu.playMenuItem.label.set_text(_("Missing plugin") + ": " + pluginDescription);
                     log("Gstreamer plugin missing for " + pluginDescription);
                 }
                 break;
            case Gst.MessageType.TAG:
                let tagList = message.parse_tag();
                let tags = {
                    artist: tagList.get_string('artist').toString(),
                    title: tagList.get_string('title').toString(),
                }
                for (let tag in tags) {
                    const tagValue = tags[tag]
                    if (tagValue.match('true')) {
                        switch (this._getCurrentChannel().getEncoding()) {
                            case "windows-1251":
                                tags[tag] = Convert.convertToUnicode("windows-1251", tagValue.slice(5));
                                break;
                            case "windows-1252":
                                tags[tag] = Convert.convertToUnicode("windows-1252", tagValue.slice(5));
                                break;
                            case "windows-1253":
                                tags[tag] = Convert.convertToUnicode("windows-1253", tagValue.slice(5));
                                break;
                            case "windows-1257":
                                tags[tag] = Convert.convertToUnicode("windows-1257", tagValue.slice(5));
                                break;
                            case "koi8-r":
                                tags[tag] = Convert.convertToUnicode("koi8-r", tagValue.slice(5));
                                break;
                            case "koi8-u":
                                tags[tag] = Convert.convertToUnicode("koi8-u", tagValue.slice(5));
                                break;
                             default:
                                tags[tag] = tagValue.slice(5);
                                break;
                        }
                    } else {
                        tags[tag] = "";
                    }
                }
                const artistStr = tags.artist ? tags.artist + " - " : ""
                const titleStr = tags.title
                this._tag = artistStr + titleStr
                break;
            case Gst.MessageType.ERROR:
                MyE.radioMenu._stop();
                MyE.radioMenu.playMenuItem.label.set_text(_("Streaming error! Please check provided url"));
                break;
            case Gst.MessageType.EOS:
                MyE.radioMenu._stop();
                MyE.radioMenu.playMenuItem.label.set_text(_("End of stream"));
                break;
            default:
                break;
        }
    }

    _getTag() {
        return this._tag;
    }

    _getTagWithLineBreaks() {
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
    }

    _getCurrentChannel() {
            return this._currentChannel;
    }

    _disconnectSourceBus() {
        if (this._sourceBusId) {
            this._sourceBus.disconnect(this._sourceBusId);
            this._sourceBusId = 0;
        }
    }
};
