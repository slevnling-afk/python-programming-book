


将claude模型映射到其他模型，比如deepseek模型，这里的通过修改
`D:\OneDrive\hnswzy_share\授课\python_programming_book_sphinx_template\.venv\Lib\site-packages\litellm\config.yaml`
以及~\.claude\settings.json文件实现

在虚拟环境下启动服务映射
输入命令：litellm --config .\.venv\Lib\site-packages\litellm\config.yaml --port 4000
再通过ctrl+shift+P输入>claude启动claude，不是直接在命令行启动claude，因为没有安装claude code


