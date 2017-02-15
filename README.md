## GNOME Shell Extension Radio

A GNOME Shell extension for listening to internet radio streams. Current version support GNOME Shell 3.18, 3.20 and 3.22 - for older versions see releases.

![screenshot01]

### Installation

Prerequisites: GStreamer plugins are installed.

##### Using GNOME Shell extension webpage

Install from [GNOME Shell extension webpage].

##### Arch Linux

Install [gnome-shell-extension-radio-git] from [AUR].

##### Manual

You'll need the `glib-compile-schemas` and `msgfmt` commands on your system, available through `libglib` and `gettext`, then:

* download source from github (clone repository or download zip)
* from the `gnome-shell-extension-radio` directory:
  * for a user only installation: `make && make install`
  * for a system-wide installation: `make && sudo make install DESTDIR=/`
* reload the shell using X:
  * press <kbd>Alt</kbd>+<kbd>F2</kbd>
  * write <kbd>r</kbd>
  * press <kbd>Enter</kbd>
* enable via GNOME Tweak Tool

### Features

* manage radio station list
* mark stations as favourites
* middle click to start/stop last played station
* cyrillic tag support (see below)
* support for multimedia keys
  * play / stop
  * next / prev cycles through the channels list
* support for title notification
* search online radio directory [radio-browser]

### Charset convertion

Radio station streams may include tags - track artist and title.

If tags are not served in `UTF-8` encoding, non-latin characters may be printed as garbage characters and must be converted to `UTF-8` to make sense.

A specific source charset can optionally be set upon adding or editing each channel.

Unfortunately, charsets cannot be reliably determined automatically. Finding the right source charset for a channel's tags are therefore a matter of guessing - or guessing again. A tool like [2cyr/decode] may come useful.

Currently, this extension supports conversion of the following charsets:

* **windows-1251** - Russian, Bulgarian, Serbian Cyrillic and Macedonian
* **koi8-r** - Russian
* **koi8-u** - Ukrainian

### Contributing

See [CONTRIBUTING].

### License

Copyright (C) 2014-2017 hslbck.

GNOME Shell Extension Radio is published under the `GPL-3+` license, see [COPYING] for details.

[screenshot01]: https://raw.githubusercontent.com/hslbck/gnome-shell-extension-radio/master/radio-extension.png
[GNOME Shell extension webpage]: https://extensions.gnome.org/extension/836/internet-radio/
[gnome-shell-extension-radio-git]: https://aur.archlinux.org/packages/gnome-shell-extension-radio-git/
[AUR]: https://aur.archlinux.org
[radio-browser]: https://www.radio-browser.info/
[2cyr/decode]: https://2cyr.com/decode/
[CONTRIBUTING]: ./CONTRIBUTING.md
[COPYING]: ./COPYING
