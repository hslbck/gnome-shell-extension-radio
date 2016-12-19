# Parts of this Makefile are from https://github.com/micheleg/dash-to-dock

EXTENSION_NAME := radio
UUID := $(EXTENSION_NAME)@hslbck.gmail.com
BUILD_DIR := $(PWD)/build
FILES := $(PWD)/$(UUID)/* $(PWD)/README.md $(PWD)/COPYING

ifeq ($(strip $(DESTDIR)),)
	INSTALLBASE := $(HOME)/.local
else
	INSTALLBASE := $(DESTDIR)/usr
endif

INSTALLBASE := $(INSTALLBASE)/share/gnome-shell/extensions
INSTALL_DIR := $(INSTALLBASE)/$(UUID)

ifdef VERSION
	VSTRING := _v$(VERSION)
else
	VERSION := $(shell git rev-parse HEAD)
	VSTRING :=
endif

default: install

all: install mrproper

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

build: $(BUILD_DIR)
	cp -r $(FILES) $(BUILD_DIR)
	glib-compile-schemas $(BUILD_DIR)/schemas/
	sed -i 's/"version": -1/"version": "$(VERSION)"/' $(BUILD_DIR)/metadata.json;

install: build
	rm -rf $(INSTALL_DIR)
	mkdir -p $(INSTALL_DIR)
	cp -r $(BUILD_DIR)/* $(INSTALL_DIR)

zip-file: build
	cd $(BUILD_DIR) ; \
	zip -qr "$(UUID)$(VSTRING).zip" .
	mv $(BUILD_DIR)/$(UUID)$(VSTRING).zip ./

mrproper:
	rm -rf $(BUILD_DIR)
