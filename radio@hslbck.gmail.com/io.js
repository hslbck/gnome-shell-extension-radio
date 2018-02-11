/*
    Copyright (C) 2015-2018 hslbck <hslbck@gmail.com>
    Copyright (C) 2016 Niels Rune Brandt <nielsrune@hotmail.com>
    This file is distributed under the same license as the gnome-shell-extension-radio package.
*/
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Shell = imports.gi.Shell;

const FILE_NAME = 'channelList.json'
const DIR_NAME = '.gse-radio'

function read(){
	let dir_path = GLib.get_home_dir() + "/" + DIR_NAME ;
	create(dir_path);
	let file_path = GLib.get_home_dir() + "/" + DIR_NAME + "/" + FILE_NAME;
	let content;
	let channelList;
	try {
		content = Shell.get_file_contents_utf8_sync(file_path);
	} catch (e) {
		global.logError('Failed to load channelList.json: ' + e);
		return null;
	}
	// parse json file
	try {
		channelList = JSON.parse(content);
	} catch (e) {
		global.logError('Failed to parse channelList.json: ' + e);
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
			global.logError('Failed to create directory and/or file! ' + e);
		}
	} else {
		let file = dir.get_child(FILE_NAME);
		if (!file.query_exists(null)) {
			try {
				source_file.copy(file, Gio.FileCopyFlags.NONE, null, null);
			} catch (e) {
				global.logError('Failed to create file! ' + e);
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

		// Format output and write channels
		Shell.write_string_to_stream(out, "{ \"channels\":[\n");
		for (var i = 0; i < channels.length; i++) {
			Shell.write_string_to_stream(out, "\t");
			Shell.write_string_to_stream(out, JSON.stringify({
				id: channels[i].getId(),
				name: channels[i].getName(),
				address: channels[i].getUri(),
				favourite: channels[i].getFavourite(),
				encoding: channels[i].getEncoding()
			}, null, "\t"));
			// remove last comma
			if (i != channels.length - 1) {
				Shell.write_string_to_stream(out, ",");
			}
		}
		// write lastplayed channel
		Shell.write_string_to_stream(out, "\n],\n\n  \"lastplayed\":");
		Shell.write_string_to_stream(out, JSON.stringify({
			id: lastPlayed.getId(),
			name: lastPlayed.getName(),
			address: lastPlayed.getUri(),
			encoding: lastPlayed.getEncoding()
		}, null, "\t"));
		Shell.write_string_to_stream(out, "\n}");
		out.close(null);
	}
}
