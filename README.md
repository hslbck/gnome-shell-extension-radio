## Gnome Shell Extension Radio
* Extension for listening to internet radio streams
* Supports Gnome-Shell 3.14, 3.16, 3.18 and 3.20

![alt text](https://raw.githubusercontent.com/hslbck/gnome-shell-extension-radio/master/radio-extension.png)

### Installation
Prerequisites: gstreamer plugins are installed
##### Using gnome shell extension webpage
https://extensions.gnome.org/extension/836/internet-radio/
##### Manual
* Download source from github (clone repository or download zip)
* Copy sources to ~/.local/share/gnome-shell/extensions/radio@hslbck.gmail.com
* Reload the shell: Press `Alt+F2` write `r` and press `Enter`  
* Enable via Gnome Tweak Tool

### Features
* Manage radio station list
* Mark stations as favourites
* Middle click to start/stop last played station
* Cyrillic tag support (nielsrune): Usage description in pull request comment https://github.com/hslbck/gnome-shell-extension-radio/pull/18

### Notice when updating this extension - Preventing loss of configured channels
* With the latest commit the `channelList.json` file is being moved to the home directory
* Currently only update through sources (github download) is affected, not an update through the extension webpage!
* Before installing the new version make a backup of your `channelList.json`
* `channelList.json` can be found in the directory ~/.local/share/gnome-shell/extensions/radio@hslbck.gmail.com
* Replace the extension and reload the gnome-shell
* A new directory `~/.gse-radio` is created with a copy of the default `channelList.json`
* Replace this `channelList.json` with your backup
* On future updates your configured  channels aren't replaced anymore

### Credits
nielsrune  
##### Translations
Chinese: gmg137  
Danish: nielsrune   
French: narzb  
Turkish: marjinal1st  

### License
Gnome Shell Extension Radio  
Copyright (C) 2014 - 2016  hslbck

Gnome Shell Extension Radio is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

Gnome Shell Extension Radio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
