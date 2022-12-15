/*
    Copyright (C) 2015-2022 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const ByteArray = imports.byteArray;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const FILE_NAME = 'channelList.json'
const DIR_NAME = '.gse-radio'

function getFile() {
	let dir_path = GLib.get_home_dir() + "/" + DIR_NAME ;
	create(dir_path);
	let file_path = GLib.get_home_dir() + "/" + DIR_NAME + "/" + FILE_NAME;
	return Gio.file_new_for_path(file_path);
}

function read(){
	let file = getFile();
	let content;
	let success;
	let channelList;
	try {
		[success, content] = file.load_contents(null);
	} catch (e) {
		logError(e, 'radio@hslbck.gmail.com: Failed to load channelList.json: ');
		return null;
	}
	// parse json file
	try {
		channelList = JSON.parse(ByteArray.toString(content));
	} catch (e) {
		logError(e, 'radio@hslbck.gmail.com: Failed to parse channelList.json:');
		return null;
	}
	return channelList;
}

// create channelList file in home directory
// ~/.gse-radio/channelList.json
function create(dir_path) {
	let dir = Gio.file_new_for_path(dir_path);
	let source_file = Gio.file_new_for_path(Extension.path).get_child(FILE_NAME);
	if (!dir.query_exists(null)) {
		try {
			dir.make_directory(null);
			let file = dir.get_child(FILE_NAME);
			source_file.copy(file, Gio.FileCopyFlags.NONE, null, null);
		} catch (e) {
			logError(e, 'radio@hslbck.gmail.com: Failed to create directory and/or file! ');
		}
	} else {
		let file = dir.get_child(FILE_NAME);
		if (!file.query_exists(null)) {
			try {
				source_file.copy(file, Gio.FileCopyFlags.NONE, null, null);
			} catch (e) {
				logError(e, 'radio@hslbck.gmail.com: Failed to create file! ');
			}
		}
	}
}


function write(channels, lastPlayed) {
	if (channels != null && channels.length > 0) {
		let filepath = GLib.get_home_dir() + "/" + DIR_NAME + "/" + FILE_NAME;
		let file = Gio.file_new_for_path(filepath);
		let raw = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
		let out = Gio.BufferedOutputStream.new_sized(raw, 4096);
		let dout = Gio.DataOutputStream.new(out);

		// Format output and write channels
		dout.put_string("{ \"channels\":[\n", null);
		for (var i = 0; i < channels.length; i++) {
			dout.put_string("\t", null);
			dout.put_string(JSON.stringify({
				id: channels[i].getId(),
				name: channels[i].getName(),
				address: channels[i].getUri(),
				favourite: channels[i].getFavourite(),
				encoding: channels[i].getEncoding()
			}, null, "\t"), null);
			// remove last comma
			if (i != channels.length - 1) {
				dout.put_string(",", null);
			}
		}
		// write lastplayed channel
		dout.put_string("\n],\n\n  \"lastplayed\":", null);
		dout.put_string(JSON.stringify({
			id: lastPlayed.getId(),
			name: lastPlayed.getName(),
			address: lastPlayed.getUri(),
			encoding: lastPlayed.getEncoding()
		}, null, "\t"), null);
		dout.put_string("\n}", null);
		dout.close(null);
	}
}
