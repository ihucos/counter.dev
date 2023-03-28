from jinja_markdown import MarkdownExtension
import jinja2
import os
import re

def helplink(file):
    with open(os.path.join("templates/pages/help", file), 'r') as f:
        content = f.read()
    match = re.search(r'{% *block +title *%}(.+?){% *endblock *%}', content, re.DOTALL)
    assert match, "No title block found for " + file
    title = match.group(1).strip()
    url = os.path.join("/pages/help", file)
    return "[{}]({})".format(title, url)

jinja2.filters.FILTERS['helplink'] = helplink
