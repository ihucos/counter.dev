import jinja2
from jinja2 import Markup
import subprocess
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

def markdown_filter(text):
    return subprocess.check_output(['markdown'], input=text.encode()).decode()

# ChatGPT emmited junk
class MarkdownExtension(jinja2.ext.Extension):
    tags = set(['markdown'])

    def __init__(self, environment):
        super(MarkdownExtension, self).__init__(environment)
        environment.filters['markdown'] = markdown_filter

    def parse(self, parser):
        lineno = next(parser.stream).lineno
        body = parser.parse_statements(['name:endmarkdown'], drop_needle=True)
        return jinja2.nodes.CallBlock(
            self.call_method('_render_markdown', [], lineno=lineno),
            [], [], body, lineno=lineno
        )

    def _render_markdown(self, caller):
        return Markup(markdown_filter(caller()))
