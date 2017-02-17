## GNOME Shell Extension Radio
* Extension for listening to internet radio streams
* Supports GNOME Shell 3.18, 3.20 and 3.22 (older versions see releases)

A GNOME Shell extension for listening to internet radio streams.

![screenshot01]

### Features

* support GNOME Shell 3.18, 3.20 and 3.22 - for older versions see [releases]
* manage radio station list
* mark stations as favourites
* middle click to start/stop last played station
* cyrillic tag support - see [charset conversion]
* support for multimedia keys
  * play / stop
  * next / prev cycles through the channels list
* support for title notification
* search online radio directory [radio-browser]

### Installation
Prerequisites: GStreamer plugins are installed
##### Using gnome shell extension webpage
https://extensions.gnome.org/extension/836/internet-radio/
##### Manual

Prerequisites: GStreamer plugins are installed.

* install from your distribution's package manager:
  * ArchLinux: [gnome-shell-extension-radio-git] from [AUR]
* install from [GNOME Shell extension website]
* build and install from source, see [CONTRIBUTING]

### Charset convertion
Radio station streams may include tags (track artist and title).

Radio station streams may include tags - track artist and title.

If tags are not served in `UTF-8` encoding, non-latin characters may be printed as garbage characters and must be converted to `UTF-8` to make sense.

A specific source charset can optionally be set upon adding or editing each channel.

Unfortunately, charsets cannot be reliably determined automatically. Finding the right source charset for a channel's tags are therefore a matter of guessing - or guessing again. A tool like [2cyr/decode] may come useful.

Currently, this extension supports conversion of the following charsets:
* **windows-1251** - Russian, Bulgarian, Serbian Cyrillic, Macedonian
* **windows-1252** - Western European / Latin 1
* **windows-1253** - Greek
* **windows-1257** - Baltic
* **koi8-r** - Russian
* **koi8-u** - Ukrainian

### Translation
* Open your source folder
* Run `make build` in your source directory
* The file `radio@hslbck.gmail.com.pot` should be created in the `po` folder

### Contributing

See [CONTRIBUTING].

### License
GNOME Shell Extension Radio  
Copyright (C) 2014 - 2017  hslbck

Copyright (C) 2014-2017 hslbck.

GNOME Shell Extension Radio is published under the `GPL-3+` license, see [COPYING] for details.

[releases]: https://github.com/hslbck/gnome-shell-extension-radio/releases
[charset conversion]: #charset-convertion
[screenshot01]: https://raw.githubusercontent.com/hslbck/gnome-shell-extension-radio/master/radio-extension.png
[GNOME Shell extension website]: https://extensions.gnome.org/extension/836/internet-radio/
[gnome-shell-extension-radio-git]: https://aur.archlinux.org/packages/gnome-shell-extension-radio-git/
[AUR]: https://aur.archlinux.org
[radio-browser]: https://www.radio-browser.info/
[2cyr/decode]: https://2cyr.com/decode/
[CONTRIBUTING]: ./CONTRIBUTING.md
[COPYING]: ./COPYING
