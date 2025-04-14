# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

## [25] - 2025-04-14

- Update to GNOME 48

## [24] - 2024-08-10

- Update to GNOME 47

## [22] - 2023-12-21

- Update to GNOME 45
- Fix for search provider https://github.com/hslbck/gnome-shell-extension-radio/pull/202

## [21] - 2023-05-16

- Update to GNOME 44

## [20] - 2022-12-15

- Update to GNOME 43
- Fix input with leading spaces
- Move station management to prefs window
- Remove modal dialogs
- Update to libsoup3

## [19] - 2022-04-08

- Update to GNOME 42

## [18] - 2021-11-11

- Removed Makefile
- Add build.sh
- Updated documentation
- Update to GNOME 41
- Removed main loop source

## [15] - 2021-05-04

- Remove channel name in panelbar
- Update searchprovider
- Support GNOME 40 only
- Port preferences to GTK4
- Improve regex for channelcreator

## [14] - 2020-11-15

- Support for GNOME 3.36 and GNOME 3.38
- Search API update
- Styles updates

## [12] - 2019-09-25

## Added
- Support for GNOME 3.34
- Greek translation

## Changed

## Fixed
- #133 Fix volume slider for GNOME 3.34

## [11] - 2019-03-21

### Added
- Added domain to metadata
- Support for GNOME 3.32

### Changed
- Updated Turkish translation
- Updated egoFM and egoFM url
- Set support to GNOME 3.32 only
- Dropped convenience library
- Removed mainloop
- Dropped Lang.class

### Fixed
- #124 Missing panel icon

## [10] - 2018-09-18

## Added
- Support GNOME 3.30

## [9] - 2018-03-26

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
[22]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v22
[21]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v21
[20]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v20
[19]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v19
[18]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v18
[15]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v15
[14]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v14
[12]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v12
[11]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v11
[10]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v10
[9]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v9
[8]: https://github.com/hslbck/gnome-shell-extension-radio/releases/tag/v8
[7]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v7
[1.6]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.6
[1.4]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.4
[1.2]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.2
[1.0]: https://github.com/hslbck/gnome-shell-extension-radio/tree/v1.0
