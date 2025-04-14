#!/bin/bash

# Script to build the extension zip and install the package
#
# This Script is released under GPL v3 license
# Copyright (C) 2021 hslbck

# Original script by Javad Rahmatzadeh for https://gitlab.gnome.org/jrahmatzadeh/just-perfection/-/blob/main/scripts/build.sh



set -e

echo "Packing extension ..."
gnome-extensions pack radio@hslbck.gmail.com \
	--force \
	--extra-source="icons" \
	--extra-source="channel.js" \
	--extra-source="channelList.json" \
	--extra-source="convertCharset.js" \
	--extra-source="io.js" \
	--extra-source="player.js" \
	--extra-source="radioMenu.js" \
	--extra-source="searchDialog.js" \
	--extra-source="searchProvider.js" \
	--extra-source="titleMenu.js" \
	--extra-source="../COPYING" 
	
echo "Packing done!"

while getopts i flag; do
    case $flag in

        i)  gnome-extensions install --force \
            radio@hslbck.gmail.com.shell-extension.zip && \
            echo "Extension radio@hslbck.gmail.com is installed. Please restart GNOME Shell." || \
            { echo "ERROR: Could not install extension!"; exit 1; };;

        *)  echo "ERROR: Invalid flag!"
            echo "Use '-i' to install the extension to your system."
            echo "To just build it, run the script without any flag."
            exit 1;;
    esac
done

