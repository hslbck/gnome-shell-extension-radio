.PHONY: clean mrproper

EXTENSION_NAME := radio
UUID := $(EXTENSION_NAME)@hslbck.gmail.com

BUILD_DIR := $(PWD)/build

SRC_DIR := $(PWD)/$(UUID)
SCHEMAS_DIR := $(SRC_DIR)/schemas
PO_DIR := $(SRC_DIR)/po
LOCALE_DIR := $(SRC_DIR)/locale

FILES := $(SRC_DIR)/* $(PWD)/README.md $(PWD)/COPYING
COMPILED_SCHEMAS := $(SCHEMAS_DIR)/gschemas.compiled

PO_FILES := $(wildcard $(PO_DIR)/*.po)
MO_FILES := $(PO_FILES:$(PO_DIR)/%.po=$(LOCALE_DIR)/%/LC_MESSAGES/$(UUID).mo)
MO_DIR := $(PO_FILES:$(PO_DIR)/%.po=$(LOCALE_DIR)/%/LC_MESSAGES)

ifeq ($(strip $(DESTDIR)),)
	INSTALLBASE := $(HOME)/.local
else
	INSTALLBASE := $(DESTDIR)/usr
endif

INSTALLBASE := $(INSTALLBASE)/share/gnome-shell/extensions
INSTALL_DIR := $(INSTALLBASE)/$(UUID)

default: install clean

$(BUILD_DIR):
	mkdir -p $@

$(COMPILED_SCHEMAS): $(SCHEMAS_DIR)/org.gnome.shell.extensions.$(EXTENSION_NAME).gschema.xml
	glib-compile-schemas $(SCHEMAS_DIR)

$(LOCALE_DIR)/%/LC_MESSAGES:
	mkdir -p $@

$(LOCALE_DIR)/%/LC_MESSAGES/$(UUID).mo: $(PO_DIR)/%.po $(MO_DIR)
	msgfmt -c $< -o $@

build: $(BUILD_DIR) $(COMPILED_SCHEMAS) $(MO_FILES)
	cp -r $(FILES) $<

install: build
	rm -rf $(INSTALL_DIR)
	mkdir -p $(INSTALL_DIR)
	cp -r $(BUILD_DIR)/* $(INSTALL_DIR)

clean:
	rm -f $(COMPILED_SCHEMAS)
	rm -rf $(LOCALE_DIR)

mrproper: clean
	rm -rf $(BUILD_DIR)
