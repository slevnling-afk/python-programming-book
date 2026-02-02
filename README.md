# Python 程序设计书（Sphinx + MyST）模板

这是一套“同一份源文件 → 输出 HTML 电子书 + PDF（印刷稿）”的最小可用模板。

## 1) 安装（Windows / macOS / Linux 通用）
1. 安装 Python 3.10+（建议 3.11/3.12）
2. 在本项目根目录打开终端，创建虚拟环境并安装依赖：

### Windows (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
```

### macOS / Linux (bash/zsh)
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install -r requirements.txt
```

## 2) 构建 HTML 电子版
```bash
cd docs
sphinx-build -b html . _build/html
```
打开：`docs/_build/html/index.html`

## 3) 构建 PDF（用于印刷）
你需要先安装 LaTeX 引擎（任选其一）：
- Windows：MiKTeX
- macOS：MacTeX
- Linux：TeX Live

然后执行：
```bash
cd docs
sphinx-build -b latex . _build/latex
```

进入 latex 输出目录并编译（两种方式任选其一）：

### 方式 A：latexmk（推荐）
```bash
cd _build/latex
latexmk -xelatex -interaction=nonstopmode -halt-on-error python_programming_book.tex
```

### 方式 B：手动 xelatex（至少两次）
```bash
cd _build/latex
xelatex python_programming_book.tex
xelatex python_programming_book.tex
```

生成的 PDF 在：`docs/_build/latex/`

## 4) 写作入口
- 目录入口：`docs/index.md`
- 章节示例：`docs/chapters/*.md`
- 练习与答案折叠示例：`docs/exercises/01-exercises.md`
- 参考文献：`docs/references.bib` + `docs/references.md`
- 术语表：`docs/glossary.md`

## 5) 常见定制
- 主题/布局：`docs/conf.py` 里的 `html_theme_options`
- 代码块风格：`docs/conf.py` 里的 `pygments_style`、`copybutton_*`
- PDF 字体/纸张：`docs/conf.py` 里的 `latex_engine`、`latex_elements`
- 自定义 CSS：`docs/_static/custom.css`

祝写书顺利！