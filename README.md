## GNOME Shell Extension Radio

A GNOME Shell extension for listening to internet radio streams.

![screenshot01]

### Features

* supports GNOME Shell 3.34 - for older versions see [releases]
* manage internet radio streams
* middle click to start/stop last played station
* Cyrillic tag support - see [charset conversion]
* support for multimedia keys: play / stop, cycle through stations via next / prev
* show tags in the panel or via notification
* search online radio directory [radio-browser]
* separate volume slider
* copy title to clipboard via button in the radio menu or via middle click on the panel title  
* Show radio stations as search results in GNOME overview  

### Installation

Prerequisites: GStreamer plugins are installed.

* install from your distribution's package manager:
  * ArchLinux: [gnome-shell-extension-radio-git] from [AUR]
* install from [GNOME Shell extension website]
* build and install from source, see [CONTRIBUTING]

### Charset conversion

Radio station streams may include tags - track artist and title.

If tags are not served in `UTF-8` encoding, non-latin characters may be printed as garbage characters and must be converted to `UTF-8` to make sense.

A specific source charset can optionally be set upon adding or editing each channel.

Unfortunately, charsets cannot be reliably determined automatically. Finding the right source charset for a channel's tags are therefore a matter of guessing - or guessing again. A tool like [2cyr/decode] may come useful.

Currently, this extension supports conversion of the following charsets:

* **windows-1251** - Russian, Bulgarian, Serbian Cyrillic and Macedonian
* **windows-1252** - Western European / Latin 1
* **windows-1253** - Greek
* **windows-1257** - Baltic
* **koi8-r** - Russian
* **koi8-u** - Ukrainian

### Contributing

See [CONTRIBUTING].

### License

Copyright © 2014-2019 hslbck.

GNOME Shell Extension Radio is published under the `GPL-3+` license, see [COPYING] for details.

[releases]: https://github.com/hslbck/gnome-shell-extension-radio/releases
[charset conversion]: #charset-conversion
[screenshot01]: https://raw.githubusercontent.com/hslbck/gnome-shell-extension-radio/master/radio-extension.png
[GNOME Shell extension website]: https://extensions.gnome.org/extension/836/internet-radio/
[gnome-shell-extension-radio-git]: https://aur.archlinux.org/packages/gnome-shell-extension-radio-git/
[AUR]: https://aur.archlinux.org
[radio-browser]: https://www.radio-browser.info/
[2cyr/decode]: https://2cyr.com/decode/
[CONTRIBUTING]: ./CONTRIBUTING.md
[COPYING]: ./COPYING

[//]: # (Following lines are only about this file.)
[//]: # (Copyright © 2014-2018 hslbck <hslbck@gmail.com>)
[//]: # (Copyright © 2016-2017 Léo Andrès <leo@ndrs.fr>)
[//]: # (This file is distributed under the same license as the gnome-shell-extension-radio package.)
