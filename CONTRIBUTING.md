# Contributing

After doing any contribution, please, don't forget to add yourself as a copyright holder and to document any notable change in [CHANGELOG].

You'll need `libglib` and `gettext` installed on your system

## Building and installing from source

* download source from GitHub - clone repository or download zip
* from the `gnome-shell-extension-radio` directory: `sh build.sh -i`
* reload the shell using X:
  * press <kbd>Alt</kbd>+<kbd>F2</kbd>
  * write <kbd>r</kbd>
  * press <kbd>Enter</kbd>
* reload the extension on Wayland:
    `gnome-shell-extension-tool -r radio@hslbck.gmail.com`  
* enable via GNOME Tweak Tool

## Adding a new translation

* open your source folder
* run `make` in your source directory
* the file `radio@hslbck.gmail.com.pot` should be created in the `po` folder
* rename the file to `id.po` where `id` is the [ISO 3166] country code corresponding
* you're ready to go

[ISO 3166]: https://www.gnu.org/software/gettext/manual/gettext.html#Country-Codes
[CHANGELOG]: ./CHANGELOG.md
