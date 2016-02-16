/**
 * player.js
 * setup the pipeline, start and stop the stream
 */
imports.gi.versions.Gst = '1.0';

const Lang = imports.lang;
const Gst = imports.gi.Gst;
const Mainloop = imports.mainloop;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.extension;

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
        case Gst.MessageType.TAG:
            let tagList = message.parse_tag();
            let tmp = tagList.get_string('title').toString();
            if (tmp.match('true')) {
                tag = tmp.slice(5);
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

function getCurrentChannel() {
    return currentChannel;
}

function disconnectSourceBus(){
    if (sourceBusId) {
        sourceBus.disconnect(sourceBusId);
        sourceBusId = 0;
    }
}
