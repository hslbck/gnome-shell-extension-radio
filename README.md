## GNOME Shell Extension Radio

A GNOME Shell extension for listening to internet radio streams.

![screenshot01]

### Features

* Supports GNOME Shell 3.36 and 3.38 - for older versions see [releases]
* Manage internet radio streams
* Middle click to start/stop last played station
* Cyrillic tag support - see [charset conversion]
* Support for multimedia keys: play / stop, cycle through stations via next / prev
* Show tags in the panel or via notification
* Search online radio directory [radio-browser]
* Separate volume slider
* Copy title to clipboard via button in the radio menu or via middle click on the panel title  
* Show radio stations as search results in GNOME overview  

### Installation

Prerequisites: GStreamer plugins are installed.

* Install from [GNOME Shell extension website]
* Build and install from source, see [CONTRIBUTING]

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

Copyright © 2014-2020 hslbck.

GNOME Shell Extension Radio is published under the `GPL-3+` license, see [COPYING] for details.

[releases]: https://github.com/hslbck/gnome-shell-extension-radio/releases
[charset conversion]: #charset-conversion
[screenshot01]: https://raw.githubusercontent.com/hslbck/gnome-shell-extension-radio/master/radio-extension.png
[GNOME Shell extension website]: https://extensions.gnome.org/extension/836/internet-radio/
[radio-browser]: https://www.radio-browser.info/
[2cyr/decode]: https://2cyr.com/decode/
[CONTRIBUTING]: ./CONTRIBUTING.md
[COPYING]: ./COPYING

[//]: # (Following lines are only about this file.)
[//]: # (Copyright © 2014-2018 hslbck <hslbck@gmail.com>)
[//]: # (Copyright © 2016-2017 Léo Andrès <leo@ndrs.fr>)
[//]: # (This file is distributed under the same license as the gnome-shell-extension-radio package.)
