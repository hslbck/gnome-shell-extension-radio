/* jshint esnext:true */
/**
 * playStream.js
 * setup the pipeline and start/stop the stream
 */

imports.gi.versions.Gst = '1.0';

const Lang = imports.lang;
const Gst = imports.gi.Gst;
const Mainloop = imports.mainloop;

// custom libraries
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Channel = Extension.imports.channel;
const MyE = Extension.imports.extension;


Gst.init(null, 0);


const PlayStream = new Lang.Class({
    Name: 'Play Stream',

    _init: function (channel) {
        this._channel = channel;
        this._setupPipeline();
        this.tag = "";
    },

    _setupPipeline: function () {
        this._pipeline = new Gst.Pipeline({
            name: "Stream"
        });
        this._source = Gst.ElementFactory.make("playbin", "source");
        this._source.set_property("uri", this._channel._uri);
        this._pipeline.add(this._source);
        // read Tags
        this._sourceBus = this._pipeline.get_bus();
        this._sourceBus.add_signal_watch();
        this._sourceBus.connect('message', Lang.bind(this, function (_sourceBus, message) {
            if (message !== null) {
                this._onMessageReceived(message);
            }
        }));
    },

    startPlaying: function () {
        this._pipeline.set_state(Gst.State.PLAYING);
    },

    stopPlaying: function () {
        this._pipeline.set_state(Gst.State.NULL);
    },

    changeChannel: function (cha) {
        this._channel = cha;
        this._pipeline.remove(this._source);
        this._source = Gst.ElementFactory.make("playbin", "source");
        this._source.set_property("uri", this._channel._uri);
        this._pipeline.add(this._source);
        // read Tags
        this._sourceBus = this._pipeline.get_bus();
        this._sourceBus.add_signal_watch();
        this._sourceBus.connect('message', Lang.bind(this, function (_sourceBus, message) {
            if (message !== null) {
                this._onMessageReceived(message);
            }
        }));
    },

    getCurrentChannel: function () {
        return this._channel;
    },

    _onMessageReceived: function (message) {
        this.localMsg = message;
        let msg = message.type;
        switch (msg) {

        case Gst.MessageType.TAG:
            let tagList = message.parse_tag();
            let tmp = tagList.get_string('title').toString();
            if (tmp.match('true')) {
                this.tag = tmp.slice(5);
            }
            break;
        case Gst.MessageType.ERROR:
            MyE.radioMenu._stop();
            MyE.radioMenu.playLabel.set_text("Stream Error");
            break;
        case Gst.MessageType.EOS:
            MyE.radioMenu._stop();
            MyE.radioMenu.playLabel.set_text("End of Stream");
            break;
        }
    },

    getTag: function () {
        return this.tag;
    }
});