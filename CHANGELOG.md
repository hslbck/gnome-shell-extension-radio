# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Added
- Italian translation
- Ukrainian translation
- #102 Copy title to clipboard
- add as search provider

### Changed
- #106 add ids to channels
- #100 improved error message handling and code cleanup
- #91 keep search dialog open after channel has been added
- #72 open channel list after edit
- Updated German translation
- Updated Danish translation
- Updated French translation

### Fixed
- #78 fix media keys for X.org, set supported GNOME version to 3.26
- Rebuild favourite list after channel edit
- Remove unused parameter for libsoup set_request
- #81 Replace hard-coded strings to allow translation

## [8] - 2017-11-10

### Added
- pt_BR translation

### Changed
- #70 delete channel is not closing the channellist window

### Fixed
- #75 fix extension on wayland and installed gstreamer-vaapi

## [7] - 2017-09-21

### Added
- Volume slider

### Changed
- Layout: removed submenu for favourite -> initial show, new button for the channellist

### Fixed
- #66 on search only add selection to favourites
- Mising plugin message

## [1.6] - 2017-03-28

### Added
- Charset field in channel dialog
- Change log
- Bulgarian, Portuguese and Spanish translations
- Charset support for Western European, Greek and Baltic
- Show title info in panel

### Changed
- French, German and Danish translations updated
- Documentation, licenses and copyright holders updated
- Theme improvements
- Update to GNOME 3.24

### Fixed
- Makefile
- Media key handling updated to fix logout
- Stop button issue #27

## [1.4] - 2016-12-29

### Added
- Russian translation
- Makefile

### Changed
- French translation updated
- All generated files (`.mo`, `.pot`) removed

### Fixed
- Prevent too large size for title and artist display

## [1.2] - 2016-09-27

### Added
- Browse function for https://www.radio-browser.info
- Title notifications
- Multimedia key support

## [1.0] - 2016-06-17

### Added
- First release

[Unreleased]: https://github.com/hslbck/gnome-shell-extension-radio/tree/master
[8]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v8
[7]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v7
[1.6]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.6
[1.4]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.4
[1.2]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.2
[1.0]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.0
