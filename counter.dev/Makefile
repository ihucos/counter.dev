uv = uv run --with pelican --with yasha --with markdown

HELP_MD_FILES := $(wildcard cms/content/help/*.md)
HELP_HTML_FILES := $(patsubst cms/content/help/%.md,static_generated/help/%.html,$(HELP_MD_FILES))

PAGES_MD_FILES := $(wildcard cms/content/pages/*.md)
PAGES_HTML_FILES := $(patsubst cms/content/pages/%.md,static_generated/pages/%.html,$(PAGES_MD_FILES))

all: $(HELP_HTML_FILES) $(PAGES_HTML_FILES) static_generated/blog

static_generated/blog: cms/templates/blog/* $(shell find cms/content/posts)
	mkdir -p static_generated/blog
	cd cms/.pelican && $(uv) pelican content
	touch static_generated/blog # mark as done

static_generated/help/%.html: cms/content/help/%.md cms/templates/ext.py cms/templates/help.html
	mkdir -p static_generated/help
	$(uv) yasha -o $@ --file $< --extensions cms/templates/ext.py cms/templates/help.html

static_generated/pages/%.html: cms/content/pages/%.md cms/templates/pages.html
	mkdir -p static_generated/pages
	$(uv) yasha -o $@  --file $< --extensions cms/templates/ext.py cms/templates/pages.html

.PHONY: clean all
clean:
	rm -rf static_generated
