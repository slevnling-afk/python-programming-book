# Configuration file for the Sphinx documentation builder.
# -*- coding: utf-8 -*-

from __future__ import annotations

project = "Python 程序设计"
author = "（slevn）"
copyright = f"2025, {author}"
release = "0.1"

# --- General configuration ---
extensions = [
    "myst_parser",                # MyST Markdown 支持
    "sphinx_design",              # dropdown/卡片等组件（用于练习题/答案折叠）
    "sphinx_copybutton",          # 代码一键复制按钮
    "sphinxcontrib.bibtex",       # 参考文献与引用
    "sphinx.ext.autosectionlabel" # 章节自动生成标签，方便交叉引用
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# --- MyST (Markdown) configuration ---
myst_enable_extensions = [
    "colon_fence",     # 支持 ::: 指令（admonition / dropdown / bibliography 等）
    "deflist",         # 定义列表
    "linkify",         # 自动把裸链接变成可点击链接
    "substitution",    # 变量替换（可选）
]
myst_heading_anchors = 3  # 自动为 1~3 级标题生成锚点
myst_url_schemes = ("http", "https", "mailto")

# --- Bibliography (sphinxcontrib-bibtex) ---
bibtex_bibfiles = ["references.bib"]
bibtex_reference_style = "author_year"  # 更像学术书：作者-年份

# --- HTML output ---
html_theme = "sphinx_book_theme"
html_title = project
html_static_path = ["_static"]
html_css_files = ["custom.css"]

# 主题选项（可按需改）
html_theme_options = {
    "repository_url": "https://github.com/yourname/yourbook",
    "use_repository_button": True,
    "use_edit_page_button": True,
    "use_issues_button": True,
    "home_page_in_toc": True,
    "show_toc_level": 2,
    "navigation_with_keys": True,
}

# 让“编辑此页”按钮知道你的文档路径（如不需要可删除）
html_context = {
    "github_user": "yourname",
    "github_repo": "yourbook",
    "github_version": "main",
    "doc_path": "docs",
}

# --- Code blocks / Pygments ---
highlight_language = "python"
pygments_style = "default"  # 可改：friendly / monokai / autumn 等

# sphinx-copybutton：忽略提示符（如 >>> 或 $）
copybutton_prompt_text = r">>> |\.\.\. |\$ "
copybutton_prompt_is_regexp = True

# --- LaTeX / PDF output (for printing) ---
latex_engine = "xelatex"   # 对中文更友好（可在 Windows/Mac/Linux 配合合适字体）

latex_documents = [
    ("index", "python_programming_book.tex", project, author, "manual"),
]

latex_elements = {
    "papersize": "a4paper",
    "pointsize": "11pt",
    # 如写中文，建议开启 xeCJK，并指定你机器上存在的字体名称
    "preamble": r"""
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{float}

% --- Chinese (optional) ---
\usepackage{xeCJK}
% Windows 常见：SimSun, SimHei, Microsoft YaHei
% macOS 常见：PingFang SC, Songti SC, Heiti SC
% Linux 常见：Noto Serif CJK SC, Noto Sans CJK SC
\setCJKmainfont{SimSun}
\setCJKsansfont{Microsoft YaHei}
""",
    # 目录更“教材化”
    "tableofcontents": r"\tableofcontents\clearpage",
}

# 让章节标题更紧凑一点（可按需调整）
latex_show_urls = "footnote"
