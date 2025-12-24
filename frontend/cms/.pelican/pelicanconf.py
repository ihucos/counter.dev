#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = "Irae Hueck Costa"
SITENAME = "Counter blog"
SITEURL = "/blog"

THEME = "counter"

PATH = "content"

OUTPUT_PATH = "../out/blog"

TIMEZONE = "Europe/Berlin"

DEFAULT_LANG = "en"

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
LINKS = (
    ("Pelican", "http://getpelican.com/"),
    ("Python.org", "http://python.org/"),
    ("Jinja2", "http://jinja.pocoo.org/"),
    ("You can modify those links in your config file", "#"),
)

# Social widget
SOCIAL = (
    ("You can add links in your config file", "#"),
    ("Another social link", "#"),
)

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
# RELATIVE_URLS = True


import re
import unidecode


def slugify(text):
    text = str(text)
    text = unidecode.unidecode(text).lower()
    return re.sub(r"[\W_]+", "-", text)

def readtime(text):
    WPM = 180
    text = str(text)
    words = len(text.replace('\n', ' ').split())
    return round(words / WPM) or 1


JINJA_FILTERS = {"slugify": slugify, "readtime": readtime}
