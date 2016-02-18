const Gio = imports.gi.Gio;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Shell = imports.gi.Shell;

const FILE_NAME = 'channelList.json'

function read(){
	let dir = Gio.file_new_for_path(Extension.path);
	let file = dir.get_child(FILE_NAME);
	let content;
	let channelList;
	try {
		content = Shell.get_file_contents_utf8_sync(file.get_path());
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

function write(channels, lastPlayed) {
	if (channels != null && channels.length > 0) {
		let dir = Gio.file_new_for_path(Extension.path);
		let file = dir.get_child(FILE_NAME);
		let raw = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
		let out = Gio.BufferedOutputStream.new_sized(raw, 4096);

		// Format output and write channels
		Shell.write_string_to_stream(out, "{ \"channels\":[\n");
		for (var i = 0; i < channels.length; i++) {
			Shell.write_string_to_stream(out, "\t");
			Shell.write_string_to_stream(out, JSON.stringify({
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
			name: lastPlayed.getName(),
			address: lastPlayed.getUri(),
			encoding: lastPlayed.getEncoding()
		}, null, "\t"));
		Shell.write_string_to_stream(out, "\n}");
		out.close(null);
	}
}
