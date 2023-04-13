import jinja2
import subprocess
import os
import re
import os
import json

import re


def markdown_render(text):
    return subprocess.check_output(["markdown"], input=text.encode()).decode()


def renderstr(stri, **data):
    from jinja2 import Environment, BaseLoader

    rtemplate = Environment(loader=BaseLoader).from_string(stri)
    return rtemplate.render(**data)


def get_title(file_path):
    with open(file_path, "r") as file:
        contents = file.read()
        match = re.search(r"^#\s+(.*)$", contents, re.MULTILINE)
        if match:
            return match.group(1)
        return "*no title found ({})*".format(file_path)


def page_attr(file_path, attr):
    with open(file_path, "r") as file:
        contents = file.read()
        match = re.search(r"<!--(.*?)-->", contents, re.MULTILINE | re.DOTALL)
        if match:
            m = match.group(1)
            return json.loads(m)[attr]
        return "*no attributes found ({})*".format(file_path)

def help_content(file):
    return markdown_render(renderstr(open(file).read()))

def page_content(file):
    return markdown_render(renderstr(open(file).read()))

def help_title(file):
    return get_title(file)

jinja2.filters.FILTERS["help_content"] = help_content
jinja2.filters.FILTERS["help_title"] = help_title

jinja2.filters.FILTERS["page_attr"] = page_attr
jinja2.filters.FILTERS["page_content"] = page_content

def helplink(fname):
    title = get_title(os.path.join("content/help", fname))
    html_name = fname.split('.')[0] + ".html"
    return "[{}]({})".format(title, html_name)


jinja2.filters.FILTERS["helplink"] = helplink

# ChatGPT emmited junk
class MarkdownExtension(jinja2.ext.Extension):
    tags = set(["markdown"])

    def __init__(self, environment):
        super(MarkdownExtension, self).__init__(environment)
        environment.filters["markdown"] = markdown_render

    def parse(self, parser):
        lineno = next(parser.stream).lineno
        body = parser.parse_statements(["name:endmarkdown"], drop_needle=True)
        return jinja2.nodes.CallBlock(
            self.call_method("_render_markdown", [], lineno=lineno),
            [],
            [],
            body,
            lineno=lineno,
        )

    def _render_markdown(self, caller):
        return markdown_render(caller())
