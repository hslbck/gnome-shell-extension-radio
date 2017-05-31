/*
    Copyright (C) 2015-2016 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
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

Gst.init(null, 0);

let tag = "";
let currentChannel;
let pipeline;
let source;
let sourceBus;
let sourceBusId;

const Player = new Lang.Class({
    Name: 'Player',

    _init: function (channel) {
        currentChannel = channel;
        pipeline = new Gst.Pipeline({
            name: "Stream"
        });
        setup();
    }
});

function start() {
    pipeline.set_state(Gst.State.PLAYING);
}

function stop() {
    pipeline.set_state(Gst.State.NULL);
}

function changeChannel(channel) {
    currentChannel = channel;
    pipeline.remove(source);
    setup();
}

function setup(){
    source = Gst.ElementFactory.make("playbin", "source");
    source.set_property("uri", currentChannel.getUri());
    pipeline.add(source);
    readTags();
}

function readTags(){
    sourceBus = pipeline.get_bus();
    sourceBus.add_signal_watch();
    sourceBusId = sourceBus.connect('message', Lang.bind(this, function(sourceBus, message) {
        if (message !== null) {
            onGstMessage(message);
        }
    }));
}

function onGstMessage(message) {
    switch (message.type) {
        case Gst.MessageType.ELEMENT:
             if (Gstpbutils.is_missing_plugin_message(message)) {
                 let pluginDescription = Gstpbutils.missing_plugin_message_get_description(message);
                 MyE.radioMenu._stop();
                 MyE.radioMenu.playLabel.set_text("Missing plugin");
                 global.log("Gstreamer plugin missing for " + pluginDescription);
             }
             break;
        case Gst.MessageType.TAG:
            let tagList = message.parse_tag();
            let tmp = tagList.get_string('title').toString();
            if (tmp.match('true')) {
                switch (getCurrentChannel().getEncoding()) {
                    case "windows-1251":
                        tag = Convert.convertToUnicode("windows-1251", tmp.slice(5));
                        break;
                    case "windows-1252":
                        tag = Convert.convertToUnicode("windows-1252", tmp.slice(5));
                        break;
                    case "windows-1253":
                        tag = Convert.convertToUnicode("windows-1253", tmp.slice(5));
                        break;
                    case "windows-1257":
                        tag = Convert.convertToUnicode("windows-1257", tmp.slice(5));
                        break;
                    case "koi8-r":
                        tag = Convert.convertToUnicode("koi8-r", tmp.slice(5));
                        break;
                    case "koi8-u":
                        tag = Convert.convertToUnicode("koi8-u", tmp.slice(5));
                        break;
                     default:
                        tag = tmp.slice(5);
                        break;
                }
            } else {
                tag = "";
            }
            break;
        case Gst.MessageType.ERROR:
            MyE.radioMenu._stop();
            MyE.radioMenu.playLabel.set_text("Stream error");
            break;
        case Gst.MessageType.EOS:
            MyE.radioMenu._stop();
            MyE.radioMenu.playLabel.set_text("End of stream");
            break;
        default:
            break;
    }
}

function getTag(){
    return tag;
}

function getTagWithLineBreaks() {
    let tagArray = tag.trim().split(" ");
    let tmpTag = "";
    let splitIndex = 42;
    for (let i = 0; i < tagArray.length; i++) {
        if ((tmpTag.length + tagArray[i].length) < splitIndex) {
            tmpTag = tmpTag + tagArray[i] + " ";
        }
        else {
            splitIndex = splitIndex + 42;
            tmpTag = tmpTag + "\n" + tagArray[i] + " " ;
        }
    }
    return tmpTag;
}

function getCurrentChannel() {
    return currentChannel;
}

function disconnectSourceBus(){
    if (sourceBusId) {
        sourceBus.disconnect(sourceBusId);
        sourceBusId = 0;
    }
}
