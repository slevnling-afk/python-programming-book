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

## 模块三 · 项目一交互实训

[进入无人机函数飞行工坊](https://slevnling-afk.github.io/python-programming-book/_static/labs/function-flight/index.html)。模块三项目一末尾也有入口。

左侧 55 处 Python 填空，右侧三维无人机展示实际函数调用和返回数据。10 个关卡覆盖函数定义与调用、默认 `None`、布尔、数字、字符串及元组返回；姿态实验支持修改实参，改变模型俯仰、横滚、航向和高度。未填空在逐空预演中使用参考脚手架，全部填写后可完整运行。

源码位于 `docs/_static/labs/function-flight/`，由现有 Sphinx 构建复制并发布。Python 浏览器运行库已随项目保存，不依赖外部 CDN。第三方许可见该目录的 `vendor/SKULPT-LICENSE.txt`。运行验证：`node tests/function-flight-runtime.cjs`。

## 模块三 · 项目二交互实训

[进入无人机指令飞行实验室](https://slevnling-afk.github.io/python-programming-book/_static/labs/parameter-flight/index.html)。入口也位于模块三项目二末尾。

10 个任务用 Python 代码填空练习位置参数、关键字参数、默认参数、`*args` 与 `**kwargs`。学生可以改变坐标、高度、自旋圈数和 8 字航线圈数，编排航点巡航、环绕与返航；右侧模型、参数绑定和指令队列跟随实际执行结果。未填空在逐空预演中暂用参考值。

源码位于 `docs/_static/labs/parameter-flight/`，随现有 Sphinx / GitHub Pages 流程发布，浏览器 Python 运行库保存在本地。第三方许可见 `vendor/SKULPT-LICENSE.txt`。运行验证：`node tests/parameter-flight-runtime.cjs`。


## 模块三 · 项目三交互实训

[进入无人机任务计分飞行挑战](https://slevnling-afk.github.io/python-programming-book/_static/labs/scope-flight/index.html)。教材项目三末尾也有入口。

10 个代码填空任务覆盖局部变量、global、内嵌作用域、lambda 与递归。实际 Python 计算驱动升降、自旋、航点巡航、整圈与半圈 8 字、环绕和返航，并展示局部/全局/外层变量快照与递归调用层级。参考试飞不计通关且保留原稿。

源码：`docs/_static/labs/scope-flight/`。本地 Skulpt 运行库随网站发布。验证：`node tests/scope-flight-runtime.cjs` 与 `node tests/scope-flight-motion.cjs`。Windows 受限目录可给 Node 添加 `--preserve-symlinks --preserve-symlinks-main`。


## 模块三 · 项目四交互实训

[进入无人机模块组装飞行实验室](https://slevnling-afk.github.io/python-programming-book/_static/labs/module-flight/index.html)。教材项目四末尾也有入口。

10 个任务、65 处填空和 22 个文件页签练习模块导入、自建模块、包、导入缓存、标准库与第三方库。主程序与模块文件真实执行，实际计算结果驱动升降、自旋、航点、8 字、环绕和返航。工程可完整下载为 ZIP。

源码位于 `docs/_static/labs/module-flight/`。浏览器 CPython 运行环境 Pyodide 及 geopy 等固定版本资源随网站保存，校验与来源见 `vendor/MANIFEST.json`，许可见 vendor 文件及 wheel 内的许可文件。第三方库安装作用于网页练习环境，下载工程后可按命令在电脑上安装。运动验证：`node --preserve-symlinks --preserve-symlinks-main tests/module-flight-motion.cjs`；运行与浏览器验证见 `tests/module-flight-runtime.*`。
