/*
	Copyright (C) 2016 - 2022 hslbck <hslbck@gmail.com>
	Copyright (C) 2017 Justinas Narusevicius <github@junaru.com>
	This file is distributed under the same license as the gnome-shell-extension-radio package.
*/


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Io from './io.js';
import Soup from 'gi://Soup?version=3.0';
import * as Convert from './convertCharset.js';

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
let _window;
let _grpStations;
let _grpSearchResults;
let _pageSearch;
let _searchEntry;
let _extensionPath;

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

function createStations(page)
{
	_grpStations = new Adw.PreferencesGroup();
	
	const jsonfile = Io.read();
	let stations = jsonfile.channels;
	for (var i in stations) {
		addStation(stations[i]);
	}

	page.add(_grpStations);
}
function addStation(station)
{
	const act = new Adw.ActionRow();
	act.title = station.name;

	const deleteButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'user-trash-symbolic',
	});
	deleteButton.get_style_context().add_class('circular');
	deleteButton.connect('clicked', () => {
		_window._settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_DELETE }));
		_grpStations.remove(act);
	});
	act.add_suffix(deleteButton);
	const editButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'document-edit-symbolic',
	});
	editButton.get_style_context().add_class('circular');
	editButton.connect('clicked', () => {
		let dialog = new CreateDialog(_window, station);
		dialog.connect('response', (dlg, response_id) => {
			if (response_id === Gtk.ResponseType.YES) {
				let newStation = dlg._getStation();
				_window._settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_DELETE }));
				act.title = newStation.name;
				station = newStation;
				_window._settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_EDIT }));
			}
			dialog.destroy();
		});
		dialog.show();
	});
	act.add_suffix(editButton);

	const favouriteSwitch = new Gtk.Switch({
		valign: Gtk.Align.CENTER,
		active: station.favourite,
	});
	favouriteSwitch.connect('notify::active', (button) => {
		station.favourite = button.get_active();
		let actionValue = button.get_active() ? ACTION_ENABLE : ACTION_DISABLE;
		_window._settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: actionValue }));
	});
	act.add_suffix(favouriteSwitch);

	_grpStations.add(act);
}

function addFeature(grp, label, setting)
{
	const sr = new Adw.SwitchRow();

	sr.title = label;
	sr.set_active(_window._settings.get_boolean(setting));

	sr.connect('notify::active', (button) => {
		_window._settings.set_boolean(setting, button.get_active());
	});
	
	grp.add(sr);
}
function createAllFeatures(page)
{
	const gprFeatures = new Adw.PreferencesGroup();

	addFeature(gprFeatures, _("Show title notifications"), SETTING_TITLE_NOTIFICATION);
	addFeature(gprFeatures, _("Enable Play/Stop Media Keys"), SETTING_USE_MEDIA_KEYS);
	addFeature(gprFeatures, _("Show title notification in the panel"), SETTING_SHOW_TITLE_IN_PANEL);
	addFeature(gprFeatures, _("Show volume adjustment slider in menu"), SETTING_SHOW_VOLUME_ADJUSTMENT_SLIDER);
	addFeature(gprFeatures, _("Enable as search provider for GNOME Shell"), SETTING_ENABLE_SEARCH_PROVIDER);

	page.add(gprFeatures);
}
function createSearchResult()
{
	if(_grpSearchResults) {
		_pageSearch.remove(_grpSearchResults);
	}

	_grpSearchResults = new Adw.PreferencesGroup();
	_grpSearchResults.title = _("Search Results");
	_pageSearch.add(_grpSearchResults);

	search(_grpSearchResults, _window._settings);	
}

function search(grp, settings) {
	let input = _searchEntry.get_text();
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
							addSearchRow(grp, jsonResponse[i], settings);
						}
					} else {
						log("radio@ : json response is empty!");
					}
				} else {
					let txt = "raido@ :Server" + _server + " returned status code";
					log(txt + " " + message.get_status());
					_server = null;
					setServer();
				}
			}
		);
	}
}
function addSearchRow(grp, apiStation, settings)
{
	const act = new Adw.ActionRow();
	act.title = apiStation.name;

	let subtitle = "url: "+apiStation.url+"\n"
		       +"codec: "+apiStation.codec+"\n"
		       +"bitrate: "+apiStation.bitrate+"kb/s\n";
	act.subtitle = subtitle;

	const addButton = new Gtk.Button({
				valign: Gtk.Align.CENTER,
				icon_name: 'list-add-symbolic',
			});
	addButton.get_style_context().add_class('circular');
	addButton.connect('clicked', () => {
		let station = transform(apiStation);
		settings.set_string(SETTING_STATION_ACTION, JSON.stringify({ station, action: ACTION_CREATE }));
		addStation(station);
	});
	act.add_suffix(addButton);

	const favicon = apiStation.favicon;
	let img = null; 
	if(favicon && !favicon.endsWith('/')) {
		try
		{
			const file = Gio.File.new_for_uri(favicon);
			const iconTexture = Gdk.Texture.new_from_file(file);
			if(iconTexture) {
				img = Gtk.Image.new_from_paintable(iconTexture);
			}
		}
		catch(error)
		{
			log(error);
		}
	}
	if(!img)
	{
		let gicon = Gio.icon_new_for_string(_extensionPath + '/icons/gser-icon-stopped-symbolic.svg');
		img = Gtk.Image.new_from_gicon(gicon); 
	}
	if(img) {
		act.add_prefix(img);
	}	
	grp.add(act);
}

function createSearch(page)
{
	_grpSearchResults = null;
	_pageSearch = page;
	const grp = new Adw.PreferencesGroup();
	grp.title = _("Search");
 	_searchEntry = new Gtk.Entry({
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
			
	searchButton.connect('clicked', () => createSearchResult());
	_searchEntry.connect('activate', () => createSearchResult());

	hbox.append(_searchEntry);
	hbox.append(searchButton);

	grp.add(hbox);	
	page.add(grp);
}

function setServer() {
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
					log(txt + " " + message.get_status());
				}
			}
		);
	}
}
function transform(apiStation) {
	return {
		id: generateId(),
		name: apiStation.name,
		address: apiStation.url_resolved,
		favourite: true,
		encoding: false,
	}
}
export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();
	_extensionPath = this.metadata.path;
	this.initTranslations();
	_window = window;

	_httpSession = new Soup.Session({
		user_agent: 'GSE Radio',
		timeout: 10
	});

	setServer();

	const pageStations = new Adw.PreferencesPage();
	pageStations.title = _("Stations");
	createStations(pageStations);
	
	const pageFeatures = new Adw.PreferencesPage();
	pageFeatures.title = _("Features");
	createAllFeatures(pageFeatures);

	const pageSearch = new Adw.PreferencesPage();
	pageSearch.title = _("New");
	createSearch(pageSearch);

	window.add(pageStations);
	window.add(pageFeatures);
	window.add(pageSearch);
    }
}