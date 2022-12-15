/*
	Copyright (C) 2016 - 2022 hslbck <hslbck@gmail.com>
	Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
	This file is distributed under the same license as the gnome-shell-extension-radio package.
*/

imports.gi.versions.Soup = "3.0";

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("radio@hslbck.gmail.com");
const _ = Gettext.gettext;
const Io = Extension.imports.io;
const Soup = imports.gi.Soup;
const Convert = Extension.imports.convertCharset;

const SETTING_USE_MEDIA_KEYS = 'use-media-keys';
const SETTING_TITLE_NOTIFICATION = 'title-notification';
const SETTING_SHOW_TITLE_IN_PANEL = 'show-title-in-panel';
const SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER = 'show-volume-adjustment-slider';
const SETTING_ENABLE_SEARCH_PROVIDER = 'enable-search-provider';
const SETTING_STATION_ACTION = 'station-action';

const ACTION_ENABLE = "enable";
const ACTION_DISABLE = "disable";
const ACTION_DELETE = "delete";
const ACTION_CREATE = "create";
const ACTION_EDIT = "edit";

const RADIO_BROWSER_API = 'http://all.api.radio-browser.info/json/servers';

let _httpSession;
let _server;
let _stationPane;
let _generalPane;
let _searchPane;

var RadioPrefsWidget = GObject.registerClass(
	class RadioPrefsWidget extends Gtk.Notebook {
		_init() {
			super._init();

			_httpSession = new Soup.Session({
				user_agent: 'GSE Radio',
            	timeout: 10
			});

			_stationPane = new StationPane();
			this.append_page(_stationPane, new Gtk.Label({ label: _('Stations') }));

			_generalPane = new GeneralPane();
			this.append_page(_generalPane, new Gtk.Label({ label: _('Features') }));

			_searchPane = new SearchPane();
			this.append_page(_searchPane, new Gtk.Label({ label: _('New') }));
		}
	}
);

var StationPane = GObject.registerClass(
	class StationPane extends Gtk.ScrolledWindow {
		_init() {
			super._init({
				hscrollbar_policy: Gtk.PolicyType.NEVER,
				vexpand: true,
			});
			this._settings = ExtensionUtils.getSettings();

			let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
			this.set_child(box);

			let listBox = new Gtk.Box({
				orientation: Gtk.Orientation.VERTICAL,
				"margin-start": 36,
				"margin-end": 36,
				"margin-top": 36,
				"margin-bottom": 36,
				"spacing": 10
			});

			this._list = new Gtk.ListBox({
				selection_mode: Gtk.SelectionMode.NONE,
				valign: Gtk.Align.START,
				halign: Gtk.Align.FILL,
				show_separators: true,
				hexpand: true
			});

			this._list.get_style_context().add_class('frame');

			listBox.append(this._list);
			box.append(listBox);

			this._createStations();
		}

		_createStations() {
			this.jsonfile = Io.read();
			let stations = this.jsonfile.channels;
			for (var i in stations) {
				this._addStation(stations[i]);
			}
		}

		_addStation(station) {
			const row = new StationRow(station, this._settings);
			this._list.append(row);
		}
	}
);

const StationRow = GObject.registerClass(
	class StationRow extends Gtk.ListBoxRow {
		_init(station, settings) {
			const grid = new Gtk.Grid({
				margin_top: 12,
				margin_bottom: 12,
				margin_start: 12,
				margin_end: 12,
			});
			grid.set_column_spacing(12);

			super._init({
				activatable: false,
				child: grid,
			});

			const label = new Gtk.Label({
				label: station.name,
				halign: Gtk.Align.START,
				hexpand: true,
			});
			grid.attach(label, 0, 0, 2, 1);

			const deleteButton = new Gtk.Button({
				valign: Gtk.Align.CENTER,
				icon_name: 'user-trash-symbolic',
			});
			deleteButton.get_style_context().add_class('circular');
			deleteButton.connect('clicked', () => {
				settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_DELETE }));
				this.get_parent().remove(this);
			});

			const editButton = new Gtk.Button({
				valign: Gtk.Align.CENTER,
				icon_name: 'document-edit-symbolic',
			});
			editButton.get_style_context().add_class('circular');
			editButton.connect('clicked', () => {
				let dialog = new CreateDialog(this.get_root(), station);
				dialog.connect('response', (dlg, response_id) => {
					if (response_id === Gtk.ResponseType.YES) {
						let newStation = dlg._getStation();
						settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_DELETE }));
						label.set_text(newStation.name);
						station = newStation;
						settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_EDIT }));
					}
					dialog.destroy();
				});
				dialog.show();
			});

			const favouriteSwitch = new Gtk.Switch({
				valign: Gtk.Align.CENTER,
				active: station.favourite,
			});
			favouriteSwitch.connect('notify::active', (button) => {
				station.favourite = button.get_active();
				let actionValue = button.get_active() ? ACTION_ENABLE : ACTION_DISABLE;
				settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: actionValue }));
			});

			grid.attach_next_to(deleteButton, label, Gtk.PositionType.RIGHT, 1, 1);
			grid.attach_next_to(editButton, deleteButton, Gtk.PositionType.RIGHT, 1, 1);
			grid.attach_next_to(favouriteSwitch, editButton, Gtk.PositionType.RIGHT, 1, 1);
		}
	}
);

var CreateDialog = GObject.registerClass(
	class CreateDialog extends Gtk.Dialog {
		_init(parent, station) {
			this.sta = station;

			let dialogTitle = _("Create");
			let createButtonText = _("Add");
			if (station) {
				dialogTitle = _("Edit");
				createButtonText = _("Save");
			}

			super._init({
				default_width: 450,
				modal: false,
				transient_for: parent,
				title: dialogTitle,
				use_header_bar: true
			});

			this.add_button(_('Close'), Gtk.ResponseType.CANCEL);
			this.createButton = this.add_button(createButtonText, Gtk.ResponseType.YES);
			if (!station) {
				this.createButton.set_sensitive(false);
			}
			this.set_default_response(Gtk.ResponseType.YES);

			let labelVbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, "spacing": 5, homogeneous: true });
			let entryVbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, "spacing": 5, "hexpand": true });
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, "spacing": 10, });

			//let nameHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, "spacing": 10, });
			let nameLabel = new Gtk.Label({
				label: _("Name"),
				"xalign": 0
			});

			this.nameEntry = new Gtk.Entry({
				buffer: new Gtk.EntryBuffer(),
				"hexpand": true
			});

			this.nameEntry.connect('changed', () => {
				this._updateButton();
			});

			labelVbox.append(nameLabel);
			entryVbox.append(this.nameEntry);

			//let streamHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, "spacing": 10, });
			let streamLabel = new Gtk.Label({
				label: _("URL"),
				"xalign": 0
			});

			this.streamEntry = new Gtk.Entry({
				buffer: new Gtk.EntryBuffer(),
				"hexpand": true
			});

			this.streamEntry.connect('changed', () => {
				this._updateButton();
			});

			labelVbox.append(streamLabel);
			entryVbox.append(this.streamEntry);

			//let charsetHbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, "spacing": 10, });
			let charsetLabel = new Gtk.Label({
				label: _("Charset (optional)"),
				"xalign": 0
			});

			this.charsetEntry = new Gtk.Entry({
				buffer: new Gtk.EntryBuffer(),
				"hexpand": true
			});

			labelVbox.append(charsetLabel);
			entryVbox.append(this.charsetEntry);

			hbox.append(labelVbox);
			hbox.append(entryVbox);

			if (station) {
				this.nameEntry.get_buffer().text = station.name;
				this.streamEntry.get_buffer().text = station.address;
				if (station.encoding !== false) {
					this.charsetEntry.get_buffer().text = station.encoding;
				}
			}

			let contentArea = this.get_content_area();
			contentArea.set_orientation(Gtk.Orientation.VERTICAL);
			contentArea.set_margin_start(20);
			contentArea.set_margin_end(20);
			contentArea.set_margin_top(20);
			contentArea.set_margin_bottom(20);
			contentArea.set_spacing(5);
			contentArea.set_homogeneous(true);
			contentArea.append(hbox);
		}

		_updateButton() {
			if (this.streamEntry.text_length > 0 && this.nameEntry.text_length > 0) {
				this.createButton.sensitive = true;
			} else {
				this.createButton.sensitive = false;
			}
		}

		_getStation() {
			let inputId = (this.sta && this.sta.id) ? this.sta.id : generateId();
			let inputFavourite = (this.sta) ? this.sta.favourite : true;
			let inputName = this.nameEntry.get_text();
			let inputStream = getStreamAddress(this.streamEntry.get_text());
			let inputCharset = false;

			if (inputStream) {
				if (this.charsetEntry.get_text() !== "") {
					inputCharset = Convert.validate(this.charsetEntry.get_text().toLowerCase());
				}
			}
			return {
				id: inputId,
				name: inputName,
				address: inputStream,
				favourite: inputFavourite,
				encoding: inputCharset
			}
		}
	});


var SearchPaneRow = GObject.registerClass(
	class SearchPaneRow extends Gtk.ListBoxRow {
		_init(apiStation, settings) {
			const grid = new Gtk.Grid({
				margin_top: 6,
				margin_bottom: 6,
				margin_start: 6,
				margin_end: 6,
			});
			grid.set_column_spacing(6);

			super._init({
				child: grid,
			});

			const name = new Gtk.Label({
				label: apiStation.name,
				halign: Gtk.Align.START,
				hexpand: true,
			});

			const bitrate = new Gtk.Label({
				label: apiStation.bitrate + "kb/s",
				halign: Gtk.Align.START,
			});

			const codec = new Gtk.Label({
				label: apiStation.codec,
				halign: Gtk.Align.START,
			});

			const addButton = new Gtk.Button({
				valign: Gtk.Align.CENTER,
				icon_name: 'list-add-symbolic',
			});
			addButton.get_style_context().add_class('circular');
			addButton.connect('clicked', () => {
				let station = this._transform(apiStation);
				settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_CREATE }));
				_stationPane._addStation(station);
			});

			grid.attach(name, 0, 0, 2, 1);
			grid.attach_next_to(bitrate, name, Gtk.PositionType.RIGHT, 1, 1);
			grid.attach_next_to(codec, bitrate, Gtk.PositionType.RIGHT, 1, 1);
			grid.attach_next_to(addButton, codec, Gtk.PositionType.RIGHT, 1, 1);
		}

		_transform(apiStation) {
			return {
				id: generateId(),
				name: apiStation.name,
				address: apiStation.url_resolved,
				favourite: true,
				encoding: false,
			}
		}
	}
);

var SearchPane = GObject.registerClass(
	class SearchPane extends Gtk.ScrolledWindow {
		_init() {
			super._init({
				hscrollbar_policy: Gtk.PolicyType.NEVER,
				vexpand: true,
			});
			let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
			this.set_child(box);

			this._settings = ExtensionUtils.getSettings();
			this._setServer();

			let createBox = new Gtk.Box({
				orientation: Gtk.Orientation.VERTICAL,
				"margin-start": 36,
				"margin-end": 36,
				"margin-top": 36,
				"margin-bottom": 10,
				"spacing": 10,
				halign: Gtk.Align.START
			});

			let createLabel = new Gtk.Label({
				label: _("Add a new radio station"),
				halign: Gtk.Align.START,
			});

			let createButton = new Gtk.Button({
				halign: Gtk.Align.START,
				hexpand: false,
				label: _('Add')
			});

			createButton.connect('clicked', () => {
				let dialog = new CreateDialog(this.get_root(), null);
				dialog.connect('response', (dlg, response_id) => {
					if (response_id === Gtk.ResponseType.YES) {
						let station = dlg._getStation();
						_stationPane._addStation(station);
						this._settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_CREATE }));
					}
					dialog.destroy();
				});
				dialog.show();
			});

			createBox.append(createLabel);
			createBox.append(createButton);
			box.append(createBox);

			let labelBox = new Gtk.Box({
				orientation: Gtk.Orientation.HORIZONTAL,
				"spacing": 10,
				"margin-start": 36,
				"margin-end": 36,
				"margin-top": 18,
				"margin-bottom": 0
			});

			let searchLabel = new Gtk.Label({
				label: _("Find radio stations online"),
				halign: Gtk.Align.START,
			});

			labelBox.append(searchLabel);
			box.append(labelBox);

			this.searchEntry = new Gtk.Entry({
				buffer: new Gtk.EntryBuffer(),
				"hexpand": true,
				placeholder_text: _("Station name")
			});

			let searchButton = new Gtk.Button({
				halign: Gtk.Align.CENTER,
				hexpand: false,
				label: _('Search')
			});

			let hbox = new Gtk.Box({
				orientation: Gtk.Orientation.HORIZONTAL,
				"spacing": 10,
				"margin-start": 36,
				"margin-end": 36,
				"margin-top": 10,
				"margin-bottom": 36,
			});

			hbox.append(this.searchEntry);
			hbox.append(searchButton);

			this.searchList = new Gtk.Box({
				orientation: Gtk.Orientation.VERTICAL,
				"margin-start": 36,
				"margin-end": 36,
				"margin-top": 0,
				"margin-bottom": 36,
				"spacing": 10,
			});

			searchButton.connect('clicked', () => this._createSearchResult(this.searchList));
			this.searchEntry.connect('activate', () => this._createSearchResult(this.searchList));

			box.append(hbox);
			box.append(this.searchList);
		}

		_setServer() {
			if (!_server) {
				let message = Soup.Message.new('GET', RADIO_BROWSER_API);

				_httpSession.send_and_read_async(
					message,
					GLib.PRIORITY_DEFAULT,
					null,
					(_httpSession, result) => {
						if (message.get_status() === Soup.Status.OK) {
							let bytes = _httpSession.send_and_read_finish(result);
							let decoder = new TextDecoder('utf-8');
							let response = decoder.decode(bytes.get_data());
							let jsonResponse = JSON.parse(response);
							if (jsonResponse.length > 0) {
								_server = jsonResponse[Math.floor(Math.random() * jsonResponse.length)].name;
							} else {
								log("radio@: No radio server api!");
							}
						} else {
							let txt = "radio@: Server returned status code";
							log(txt + " " + message.get_status);
						}
					}
				);
			}
		}


		_createSearchResult() {
			if (this.searchListBox) {
				this.searchList.remove(this.searchListBox);
			}

			this.searchListBox = new Gtk.ListBox({
				selection_mode: Gtk.SelectionMode.NONE,
				valign: Gtk.Align.START,
				halign: Gtk.Align.FILL,
				show_separators: true,
				hexpand: true
			});
			this.searchListBox.get_style_context().add_class('frame');

			this._search(this.searchListBox, this._settings);

			this.searchList.append(this.searchListBox);
		}

		_search(searchListBox, settings) {
			let input = this.searchEntry.get_text();
			if (input != null && input.trim().length > 0) {

				let params = {
					name: input,
					limit: '10'
				};

				let message = Soup.Message.new_from_encoded_form(
					'POST',
					"http://" + _server + "/json/stations/byname/" + input,
					Soup.form_encode_hash(params)
				);

				_httpSession.send_and_read_async(
					message,
					GLib.PRIORITY_DEFAULT,
					null,
					(_httpSession, result) => {
						if (message.get_status() === Soup.Status.OK) {
							let bytes = _httpSession.send_and_read_finish(result);
							let decoder = new TextDecoder('utf-8');
							let response = decoder.decode(bytes.get_data());
							let jsonResponse = JSON.parse(response);
							if (jsonResponse.length > 0) {
								for (var i = 0; i < jsonResponse.length; i++) {
									let row = new SearchPaneRow(jsonResponse[i], settings);
									searchListBox.append(row);
								}
							} else {
								log("radio@ : json response is empty!");
							}
						} else {
							let txt = "raido@ :Server returned status code";
							log(txt + " " + message.get_status());
						}
					}
				);
			}
		}
	}
);

var GeneralPane = GObject.registerClass(
	class GeneralPane extends Gtk.Grid {

		_init(params) {
			super._init(params);
			this.orientation = Gtk.Orientation.VERTICAL;
			this.margin = 12;
			this._settings = ExtensionUtils.getSettings();

			this._widgets = {};

			this._widgets.box = new Gtk.Box({
				orientation: Gtk.Orientation.VERTICAL,
				"margin-start": 20,
				"margin-end": 20,
				"margin-top": 10,
				"margin-bottom": 20,
				"spacing": 10
			});

			this._addTitleNotificationsSwitch();
			this._addShowTitleInPanelSwitch();
			this._addEnableMediaKeysSwitch();
			this._addShowVolumeAdjustmentSliderSwitch();
			this._addEnableSearchProviderSwitch();

			this.attach(this._widgets.box, 0, 0, 1, 1);
		}

		_addTitleNotificationsSwitch() {
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
			let label = new Gtk.Label({
				label: _("Show title notifications"),
				"xalign": 0,
				"hexpand": true
			});
			this._widgets.titleNotificationsSwitch = new Gtk.Switch({ active: this._settings.get_boolean(SETTING_TITLE_NOTIFICATION) });

			hbox.prepend(label);
			hbox.append(this._widgets.titleNotificationsSwitch);

			this._widgets.box.append(hbox);

			this._widgets.titleNotificationsSwitch.connect('notify::active', (button) => {
				this._settings.set_boolean(SETTING_TITLE_NOTIFICATION, button.get_active());
			});
		}

		_addShowTitleInPanelSwitch() {
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
			let label = new Gtk.Label({
				label: _("Show title notification in the panel"),
				"xalign": 0,
				"hexpand": true
			});
			this._widgets.titleInPanelSwitch = new Gtk.Switch({ active: this._settings.get_boolean(SETTING_SHOW_TITLE_IN_PANEL) });

			hbox.prepend(label);
			hbox.append(this._widgets.titleInPanelSwitch);

			this._widgets.box.append(hbox);

			this._widgets.titleInPanelSwitch.connect('notify::active', (button) => {
				this._settings.set_boolean(SETTING_SHOW_TITLE_IN_PANEL, button.get_active());
			});
		}

		_addEnableMediaKeysSwitch() {
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
			let label = new Gtk.Label({
				label: _("Enable Play/Stop Media Keys"),
				"xalign": 0,
				"hexpand": true
			});
			this._widgets.mediaKeySwitch = new Gtk.Switch({ active: this._settings.get_boolean(SETTING_USE_MEDIA_KEYS) });

			hbox.prepend(label);
			hbox.append(this._widgets.mediaKeySwitch);

			this._widgets.box.append(hbox);

			this._widgets.mediaKeySwitch.connect('notify::active', (button) => {
				this._settings.set_boolean(SETTING_USE_MEDIA_KEYS, button.get_active());
			});
		}

		_addShowVolumeAdjustmentSliderSwitch() {
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
			let label = new Gtk.Label({
				label: _("Show volume adjustment slider in menu"),
				"xalign": 0,
				"hexpand": true
			});
			this._widgets.volumeAdjustmentSliderSwitch = new Gtk.Switch({ active: this._settings.get_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER) });

			hbox.prepend(label);
			hbox.append(this._widgets.volumeAdjustmentSliderSwitch);

			this._widgets.box.append(hbox);

			this._widgets.volumeAdjustmentSliderSwitch.connect('notify::active', (button) => {
				this._settings.set_boolean(SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER, button.get_active());
			});
		}

		_addEnableSearchProviderSwitch() {
			let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
			let label = new Gtk.Label({
				label: _("Enable as search provider for GNOME Shell"),
				"xalign": 0,
				"hexpand": true
			});
			this._widgets.searchProviderSwitch = new Gtk.Switch({ active: this._settings.get_boolean(SETTING_ENABLE_SEARCH_PROVIDER) });

			hbox.prepend(label);
			hbox.append(this._widgets.searchProviderSwitch);

			this._widgets.box.append(hbox);

			this._widgets.searchProviderSwitch.connect('notify::active', (button) => {
				this._settings.set_boolean(SETTING_ENABLE_SEARCH_PROVIDER, button.get_active());
			});
		}
	});

function getStreamAddress(input) {
	input = input.trim();
	let regexp = /\.(m3u|m3u8|pls)/i;

	if (input.search(regexp) != -1) {

		let message = Soup.Message.new('GET', input);

		let bytes = _httpSession.send_and_read(message, null);
		let decoder = new TextDecoder('utf-8');
		let content = decoder.decode(bytes.get_data());

		let contentLines = content.split('\n');
		for (var line in contentLines) {
			if (contentLines[line].search(/https?:/i) != -1) {
				return contentLines[line].slice((contentLines[line].search(/http/)));
			}
		}
	}
	return input;
}

function generateId() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function init() {
	ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
	return new RadioPrefsWidget();
}
