(model5)=

# 模块五：文件操作

---

# 5.1 项目一：无人机“飞行日志读取与摘要器”——文件基本操作

**项目简介**

> 本项目先在当前目录生成一份示例飞行日志 `flight_log.txt`（便于课堂统一复现），随后分别使用 `read()`、`readline()`、`readlines()` 与“循环逐行读取”四种方式读取同一文件，并输出对比结果。最后对日志进行简单统计：总行数、包含告警的行数、首行与末行内容，形成一份可核对的摘要输出。

**项目定位**

> 本项目定位为“文件读操作入门”的核心训练。通过一个脚本完成：理解文本文件与二进制文件的区别；掌握绝对路径/相对路径；掌握 `open()` 与 `with open()`；掌握四种文本读取方式并能对比其适用场景。

**需求分析**

> 脚本 `uav_log_reader.py` 需要完成以下功能：
> - 准备一个文本日志文件 `flight_log.txt`（若不存在则写入示例内容）
> - 解释文件操作三步骤：打开→操作→关闭；说明文本文件/二进制文件差异
> - 说明绝对路径与相对路径，并打印当前示例采用的路径
> - 展示 `open()` 与 `with open()` 两种写法（强调关闭文件的重要性）
> - 使用四种方式读取文本：`read()`、`readline()`、`readlines()`、循环逐行读取
> - 生成并输出《飞行日志摘要》：总行数、告警行数、首行、末行

**项目代码**

```python

# uav_log_reader.py
# 项目一：无人机“飞行日志读取与摘要器”（文件读操作基础）

# ----------------------------
# 日志文件准备
# ----------------------------
log_file = "flight_log.txt"  # 相对路径：当前脚本同目录

sample_lines = [
    "2025-12-24 09:00:00,UAV-07,BATT=98,ALT=0,OK\n",
    "2025-12-24 09:00:05,UAV-07,BATT=97,ALT=5,OK\n",
    "2025-12-24 09:00:10,UAV-07,BATT=95,ALT=12,OK\n",
    "2025-12-24 09:00:15,UAV-07,BATT=92,ALT=18,ALARM:GPS_WEAK\n",
    "2025-12-24 09:00:20,UAV-07,BATT=90,ALT=20,OK\n",
    "2025-12-24 09:00:25,UAV-07,BATT=88,ALT=18,ALARM:LOW_BATT\n",
    "2025-12-24 09:00:30,UAV-07,BATT=87,ALT=10,OK\n",
]

# 用 with open 写入示例日志（文本写入模式 w）
with open(log_file, "w", encoding="utf-8") as f:
    # 写入多行文本
    f.writelines(sample_lines)

print("=== 无人机飞行日志读取与摘要器 ===")
print("日志文件：", log_file)
print("----------------------------------")

# ----------------------------
# 文件基本操作说明（打开→操作→关闭）
# ----------------------------
print("【文件操作三步骤】打开 -> 操作 -> 关闭")
print("文本文件：以字符方式读写（如 .txt .csv）")
print("二进制文件：以字节方式读写（如 图片/视频/模型文件）")
print("路径说明：log_file 使用相对路径（脚本所在目录）")
print("----------------------------------")

# ----------------------------
#  open() 方式读取（手动关闭）
# ----------------------------
print("【方式A】open() + read()（读完整个文件）")
f = open(log_file, "r", encoding="utf-8")  # 打开文件
content = f.read()                          # 读取全部内容（字符串）
f.close()                                   # 关闭文件（重要！）

# 输出前 80 个字符，避免屏幕过长
print("read() 前80字符：", content[:80].replace("\n", "\\n"))
print("----------------------------------")

# ----------------------------
# with open() 方式读取（自动关闭）
# ----------------------------
print("【方式B】with open() + readline()（读一行）")
with open(log_file, "r", encoding="utf-8") as f:
    first_line = f.readline()  # 只读一行
print("readline() 读取到的首行：", first_line.strip())
print("----------------------------------")

# ----------------------------
# readlines() 方式读取（读成列表）
# ----------------------------
print("【方式C】with open() + readlines()（读成行列表）")
with open(log_file, "r", encoding="utf-8") as f:
    lines = f.readlines()  # 每一行是列表的一个元素
print("readlines() 行数：", len(lines))
print("readlines() 第1行：", lines[0].strip())
print("readlines() 最后1行：", lines[-1].strip())
print("----------------------------------")

# ----------------------------
# 循环逐行读取（推荐处理大文件）
# ----------------------------
print("【方式D】with open() + for line in f（逐行读取）")
alarm_count = 0
total_count = 0
last_line = ""

with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        total_count += 1
        last_line = line
        # 简单规则：含 ALARM 即认为是告警行
        if "ALARM" in line:
            alarm_count += 1

print("逐行读取统计：总行数 =", total_count, "告警行数 =", alarm_count)
print("----------------------------------")

# ----------------------------
# 输出《飞行日志摘要》
# ----------------------------
print("=== 飞行日志摘要 ===")
print("总行数：", total_count)
print("告警行数：", alarm_count)
print("首行：", lines[0].strip())
print("末行：", last_line.strip())
print("=== 摘要结束 ===")
```

:::{index} single: 文件操作
:::
:::{index} single: 文本文件
:::
:::{index} single: 二进制文件
:::
:::{index} single: 文件路径
:::

## 5.1.1 任务一：文件的基本操作

文件操作用于把数据写入磁盘或从磁盘读取数据，是最常见的“持久化”方式之一。
可以把文件理解为一份长期保存的记录，打开相当于建立连接，读写相当于处理内容，关闭相当于归还资源。

文件操作可以概括为三个步骤：

- **打开**：通过 `open()` 建立程序与文件的连接
- **操作**：读取或写入内容
- **关闭**：释放资源，保证数据写入完整
  其中 `with open(...) as f:` 能在代码块结束时自动关闭文件，更安全。

**文件的类型**

* **文本文件**：按“字符”读写，如 `.txt`、`.csv`；常配合 `encoding="utf-8"`
* **二进制文件**：按“字节”读写，如图片、视频、模型文件；打开模式常含 `b`（如 `rb`、`wb`）

**路径：绝对路径与相对路径**

* **绝对路径**：从磁盘根目录写起（Windows 如 `C:\\data\\flight_log.txt`）
* **相对路径**：相对于脚本当前工作目录（如 `"flight_log.txt"`）

**open 与 with open 语法格式**

文件打开两种写法对比如表5-1所示。

<p align="center"><strong>表5-1 文件打开写法对比</strong></p>

| 写法               | 语法                            | 关闭方式      | 特点             |
| ------------------ | ------------------------------- | ------------- | ---------------- |
| open 手动关闭      | `f = open(path, mode)`        | `f.close()` | 需要人为保证关闭 |
| with open 自动关闭 | `with open(path, mode) as f:` | 自动关闭      | 推荐写法，更安全 |

**例如：**

```python
# open：需要手动 close
f = open("flight_log.txt", "r", encoding="utf-8")
text = f.read()
f.close()
print(text[:30])

# with open：自动 close（推荐）
with open("flight_log.txt", "r", encoding="utf-8") as f:
    line = f.readline()
print(line.strip())
```

该示例对比了手动 `open/close` 与 `with open` 自动关闭两种写法，并展示 `read()` 与 `readline()` 的读取范围差异。

:::{admonition} 【AI辅助小课堂】读文件输出预测
:class: tip
把“open+read”和“with open+readline”两段示例发给 AI，让 AI 预测两段输出有什么差异（输出长度/内容范围）。
运行代码核对 AI 的预测是否一致。
:::

:::{admonition} 练习：open 与 with open
:class: important
写一个脚本读取 `flight_log.txt` 的首行：

- 用 `open()` 写一遍（必须写 `close()`）
- 用 `with open()` 再写一遍
  :::

:::{index} single: 文件打开模式
:::
:::{index} single: open函数
:::
:::{index} single: with语句
:::

## 5.1.2 任务二：文件打开模式

打开模式决定文件以读、写、追加或二进制等方式被打开，直接影响是否覆盖内容、是否自动创建文件等行为。
可以把打开模式理解为“权限设置”，不同模式对应不同的可读可写范围。

常用文件打开模式如表5-2所示。

<p align="center"><strong>表5-2 常用文件打开模式</strong></p>

| 模式   | 功能描述                            | 简例                      |
| ------ | ----------------------------------- | ------------------------- |
| `r`  | 只读打开（文件必须存在）            | `open("log.txt","r")`   |
| `w`  | 写入打开（清空原内容/不存在则创建） | `open("log.txt","w")`   |
| `a`  | 追加打开（末尾写入/不存在则创建）   | `open("log.txt","a")`   |
| `rb` | 二进制只读                          | `open("img.jpg","rb")`  |
| `wb` | 二进制写入                          | `open("out.bin","wb")`  |
| `ab` | 二进制追加                          | `open("data.bin","ab")` |

:::{admonition} 【AI辅助小课堂】模式选择题生成
:class: tip
让 AI 根据“无人机日志场景”生成 5 道选择题：每题给出一个需求（例如“持续追加一行日志”），让你选用正确打开模式。
完成后运行一个 `a` 模式示例验证“不会覆盖旧内容”。
:::

:::{admonition} 练习：为无人机日志选择打开模式
:class: important
需求：把一行新日志追加到 `flight_log.txt` 末尾，例如：
`2025-12-24 09:01:00,UAV-07,BATT=85,ALT=3,OK`
请选择合适模式并写出可运行代码，要求追加后再次读取文件最后一行进行验证。
:::

:::{index} single: 文件读取
:::
:::{index} single: read方法
:::
:::{index} single: readline方法
:::
:::{index} single: readlines方法
:::

## 5.1.3 任务三：文本文件读操作

文本读取用于把文本文件内容读入到程序中，常见方式有一次性读取与逐行读取。
可以把它理解为“整本拿走”与“一页一页翻”，文件越大越适合逐行处理。

**1.read 函数**

`read()` 适合一次性读取内容较小的文本文件，例如短日志、配置文件、简短报告等。
`read()` 会把文件中剩余内容一次性读入为一个字符串。如果文件很大，会占用更多内存，因此大文件更适合逐行读取。

**例如：**

```python
with open("flight_log.txt", "r", encoding="utf-8") as f:
    text = f.read()  # 一次性读完
print("字符数：", len(text))
print("前60字符：", text[:60].replace("\n", "\\n"))
```

该示例用 `read()` 一次性读取整个文件并统计字符数，适合小文件但不适合超大文件。

:::{admonition} 【AI辅助小课堂】read 的内存风险解释
:class: tip
把上面的 `read()` 示例发给 AI，让 AI 用一句话解释：为什么大文件不推荐用 read()。
再让 AI 给出“逐行读取”替代思路。
:::

:::{admonition} 练习：read 读取并统计
:class: important
用 `read()` 读取 `flight_log.txt`，统计字符串里 `"ALARM"` 出现了几次（可用 `text.count("ALARM")`），并打印次数。
:::

**2.readline 函数**

`readline()` 用于每次读取一行，适合“只需要首行/前几行”的场景，例如读取日志头、读取字段说明等。

调用一次 `readline()`，文件指针就向下移动一行；连续调用可以逐行获取，但通常更推荐用循环逐行读取。

**例如：**

```python
with open("flight_log.txt", "r", encoding="utf-8") as f:
    line1 = f.readline()
    line2 = f.readline()
print("第1行：", line1.strip())
print("第2行：", line2.strip())
```

该示例连续调用两次 `readline()`，展示每次调用都会读取下一行并推进文件指针。

:::{admonition} 【AI辅助小课堂】文件指针移动理解
:class: tip
让 AI 用“光标/读头”的比喻解释：为什么连续两次 readline() 会得到不同的行。
运行示例核对输出。
:::

:::{admonition} 练习：readline 读取前三行
:class: important
用 `readline()` 连续读取前三行并打印（每行前加编号 1/2/3），要求代码可直接运行。
:::

**3.readlines 函数**

`readlines()` 会把文件所有行读取为一个列表，每一行是列表的一个元素。

这种方式便于用 `len(lines)` 得到行数、用 `lines[0]` 取首行、用 `lines[-1]` 取末行。文件太大时同样可能占内存。

**例如：**

```python
with open("flight_log.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
print("行数：", len(lines))
print("首行：", lines[0].strip())
print("末行：", lines[-1].strip())
```

该示例用 `readlines()` 把全部行读成列表，便于用下标访问首行与末行并统计行数。

:::{admonition} 【AI辅助小课堂】readlines 与 read 对比
:class: tip
让 AI 对比：read() 返回什么类型？readlines() 返回什么类型？
并给出各自更适合的应用场景（各说 1 个）。
:::

:::{admonition} 练习：readlines 提取告警行
:class: important
用 `readlines()` 读入列表 `lines`，遍历列表，打印所有包含 `"ALARM"` 的行（可用 `if "ALARM" in line:`）。
:::

**4.循环读取每行**

循环逐行读取是处理日志最常见的方式，适合大文件，且便于“边读边统计”。
`for line in f:` 会一次取一行，不需要把整个文件一次性装入内存。可以在循环中做计数、筛选、提取字段等。

**例如：**

```python
alarm_count = 0
total_count = 0

with open("flight_log.txt", "r", encoding="utf-8") as f:
    for line in f:
        total_count += 1
        if "ALARM" in line:
            alarm_count += 1

print("总行数：", total_count)
print("告警行数：", alarm_count)
```

该示例用 `for line in f` 逐行读取并边读边统计，适合处理大文件与做在线计数。

:::{admonition} 【AI辅助小课堂】输出行数预测
:class: tip
把示例日志的行数（观察文件中有几行）发给 AI，让 AI 预测 `total_count` 与 `alarm_count` 的结果。
运行代码核对。
:::

:::{admonition} 练习：逐行读取并打印编号
:class: important
逐行读取 `flight_log.txt`，为每一行加上编号输出，格式示例：
`[1] 2025-12-24 ...`
:::

# 5.2 项目二：无人机“日志转码与黑匣子备份器”——二进制文件操作

**项目简介**

> 程序模拟无人机一次任务输出：包含中文字段（如“告警：低电量”“区域：A03”）的任务简报。
> 先演示不同编码写入与读取的差异，再通过 `tell()`/`seek()` 展示文件指针如何影响读取位置。最后把关键摘要写入二进制文件作为“黑匣子备份”，并读回验证“备份可恢复”。

**项目定位**

> 本项目定位为“文件进阶操作”的入门训练：认识常见编码并能在 `open(..., encoding=...)` 中正确选择；掌握文件指针概念，能用 `tell()` 观察位置、用 `seek()` 回到指定位置；能把无人机日志写入文本文件并追加；能把关键简报写入二进制文件并再读出验证。

**需求分析**

> 本项目编写脚本 `uav_codec_blackbox.py` 需要完成以下功能：
> - 准备一段包含中文的任务简报文本（便于观察编码影响）
> - 写入文本文件：分别生成 `mission_report_utf8.txt`（UTF-8）与 `mission_report_gbk.txt`（GBK，可选，用于对比）
> - 演示读取：用正确/错误编码读取并观察差异（错误读取用 try/except 捕获，避免程序中断）
> - 演示文件指针：用 `tell()` 输出当前位置，用 `seek()` 回到开头或移动到中间后再读
> - 二进制写入：把简报内容转为 bytes 写入 `blackbox.bin`
> - 二进制读取：读回 bytes 并用 UTF-8 解码，验证与原文本一致

**项目代码**

```python

# uav_codec_blackbox.py
# 项目二：无人机“日志转码与黑匣子备份器”

print("=== 无人机日志转码与黑匣子备份器 ===")

# ----------------------------
# 准备一段包含中文的任务简报（便于观察编码问题）
# ----------------------------
mission_id = "MIS-20251224-A03"
uav_id = "UAV-07"
area = "A03"
alarm = "告警：低电量"
summary_text = (
    f"任务编号：{mission_id}\n"
    f"无人机编号：{uav_id}\n"
    f"区域：{area}\n"
    f"{alarm}\n"
)

print("原始简报文本：")
print(summary_text)

# ----------------------------
# 文本文件写入（UTF-8）
# ----------------------------
utf8_file = "mission_report_utf8.txt"
with open(utf8_file, "w", encoding="utf-8") as f:
    # 写入文本（包含中文）
    f.write(summary_text)

print("已生成：", utf8_file)

# （可选对比）写入 GBK 文本文件
gbk_file = "mission_report_gbk.txt"
with open(gbk_file, "w", encoding="gbk") as f:
    # 使用 GBK 编码写入
    f.write(summary_text)

print("已生成：", gbk_file)
print("----------------------------------")

# ----------------------------
# 文本文件读取：正确编码 vs 错误编码（用异常保护）
# ----------------------------
print("【读取对比】正确编码读取 UTF-8 文件：")
with open(utf8_file, "r", encoding="utf-8") as f:
    print(f.read())

print("【读取对比】错误编码读取 UTF-8 文件（演示异常，不中断）：")
try:
    with open(utf8_file, "r", encoding="gbk") as f:
        print(f.read())
except UnicodeDecodeError as e:
    print("读取失败：UnicodeDecodeError（编码不匹配）")
    print("异常信息：", e)

print("----------------------------------")

# ----------------------------
# 文件指针：tell 与 seek（以 UTF-8 文件为例）
# ----------------------------
print("【文件指针】tell() 查看当前位置，seek() 移动指针")
with open(utf8_file, "r", encoding="utf-8") as f:
    pos0 = f.tell()  # 通常为 0
    first_part = f.read(5)  # 读前 5 个字符
    pos1 = f.tell()

    # 回到开头再读一行
    f.seek(0)
    pos2 = f.tell()
    first_line = f.readline()
    pos3 = f.tell()

print("初始位置 pos0 =", pos0)
print("读5个字符：", first_part)
print("读取后位置 pos1 =", pos1)
print("seek(0) 后位置 pos2 =", pos2)
print("readline() 读取首行：", first_line.strip())
print("readline() 后位置 pos3 =", pos3)
print("----------------------------------")

# ----------------------------
# 二进制写：写入“黑匣子备份” blackbox.bin
# ----------------------------
bin_file = "blackbox.bin"
data_bytes = summary_text.encode("utf-8")  # 文本 -> bytes（UTF-8 编码）

with open(bin_file, "wb") as f:
    # 写入二进制数据（不可直接用文本方式打开查看）
    f.write(data_bytes)

print("已生成黑匣子备份：", bin_file)
print("----------------------------------")

# ----------------------------
# 二进制读：读回并解码验证
# ----------------------------
with open(bin_file, "rb") as f:
    raw = f.read()  # bytes

restored_text = raw.decode("utf-8")  # bytes -> 文本（UTF-8 解码）

print("【恢复验证】从 blackbox.bin 读回并解码：")
print(restored_text)

print("恢复是否一致：", restored_text == summary_text)
print("=== 结束 ===")
```

:::{index} single: 文件编码
:::
:::{index} single: UTF-8
:::
:::{index} single: GBK
:::
:::{index} single: encoding参数
:::

## 5.2.1 任务一：文件编码

文件编码用于规定字符如何编码成字节，以及字节如何解码回字符。
可以把编码理解为一套“翻译规则”，规则一致就能正确还原文本，规则不一致就可能出现乱码或 `UnicodeDecodeError`。

在 Python 文本读写中，最关键的习惯是显式写出 `open(..., encoding=\"utf-8\")`，让读写双方使用同一种规则。

常见编码简表如表 5-3 所示。

<p align="center"><strong>表5-3 常见编码简表</strong></p>

| 编码/概念 | 简要描述                               | 常见场景/备注                |
| --------- | -------------------------------------- | ---------------------------- |
| ASCII     | 早期英文编码，覆盖英文、数字、常用符号 | 不能表示中文                 |
| ANSI      | 非严格标准，通常指“系统默认本地编码” | Windows 上常与本地代码页相关 |
| GB2312    | 早期中文编码（简体为主）               | 覆盖范围较小                 |
| GBK       | GB2312 扩展，常见中文编码              | Windows 环境较常见           |
| Unicode   | 字符集（概念层面），为字符分配码点     | 不是具体存储方式             |
| UTF-8     | Unicode 的一种编码方式（可变长）       | 跨平台最常用，推荐           |

:::{admonition} 【AI辅助小课堂】乱码原因定位
:class: tip
把“UTF-8 写入、GBK 读取导致异常”的代码片段发给 AI，让 AI 用两句话说明：
为什么会失败；怎么改才能成功读取。
运行本项目示例核对。
:::

:::{admonition} 练习：为无人机中文日志选择编码
:class: important
写一段包含中文的日志文本（例如“告警：低电量”），用 UTF-8 写入 `uav_note.txt`，再用 UTF-8 读取并打印。
:::

:::{index} single: 文件指针
:::
:::{index} single: tell方法
:::
:::{index} single: seek方法
:::

## 5.2.2 任务二：文件指针

文件指针表示“下一次读取/写入从哪里开始”。读取一部分内容后，指针会向后移动；通过指针可以实现“回读、跳读、重复读取”等操作。

可以把文件指针理解为“读书时的书签”，读到哪里书签就停在哪里。`tell()` 用来查看书签位置。

**例如：**

```python
file_name = "mission_report_utf8.txt"

with open(file_name, "r", encoding="utf-8") as f:
    print("初始 tell：", f.tell())
    _ = f.read(3)  # 读取 3 个字符
    print("读取后 tell：", f.tell())
```

该示例用 `tell()` 对比读取前后的位置变化，展示读取会推动文件指针向后移动。

`seek()` 用来把书签移动到指定位置。

**例如：**

```python
file_name = "mission_report_utf8.txt"

with open(file_name, "r", encoding="utf-8") as f:
    first = f.read(4)
    print("先读4个字符：", first)

    f.seek(0)  # 回到开头
    line1 = f.readline()
    print("seek(0) 后再读首行：", line1.strip())
```

该示例先读取一段内容，再用 `seek(0)` 回到开头重新读取，展示“回读”能力。

:::{admonition} 【AI辅助小课堂】tell 数值预测
:class: tip
把“read(3) 后 tell()”的代码发给 AI，让 AI 预测 tell 的变化趋势（增大/不变/减小），并说明原因。
运行示例核对。
:::

:::{admonition} 练习：用 seek 重新读取同一行
:class: important
读取 `mission_report_utf8.txt` 的首行后，使用 `seek(0)` 回到开头，再次读取首行并打印。
要求两次输出相同。
:::

:::{index} single: 文件写入
:::
:::{index} single: write方法
:::
:::{index} single: writelines方法
:::
:::{index} single: 追加模式
:::

## 5.2.3 任务三：文本文件写操作

文本写操作用于生成可读的文本文件，常见写法包括覆盖写入与追加写入。可以把它理解为写笔记，`w` 像重写一页，`a` 像在页尾继续补写。

* `write()`：写入字符串
* `writelines()`：写入字符串列表（每个元素通常带换行）
  写入后建议再读回验证，确保内容正确。

**例如：**

```python
report_file = "uav_report.txt"

# 覆盖写入（w）
with open(report_file, "w", encoding="utf-8") as f:
    f.write("无人机巡检简报\n")
    f.write("告警：无\n")

# 追加写入（a）
with open(report_file, "a", encoding="utf-8") as f:
    f.write("追加：已上传平台\n")

# 读回验证
with open(report_file, "r", encoding="utf-8") as f:
    print(f.read())
```

该示例先用 `w` 覆盖写入，再用 `a` 追加写入，最后读回验证文件内容确实被更新。

:::{admonition} 【AI辅助小课堂】w 与 a 的差异总结
:class: tip
让 AI 用一句话对比 `w` 和 `a` 的差异，并举一个无人机场景例子（各对应一个场景）。
:::

:::{admonition} 练习：生成“告警摘要”文本
:class: important
创建 `alarm_summary.txt`：

- 先用 `w` 写入标题“告警摘要”
- 再用 `a` 追加 3 行告警记录（每行一条）
- 读回打印全文验证
  :::

:::{index} single: 二进制写入
:::
:::{index} single: wb模式
:::
:::{index} single: bytes类型
:::

## 5.2.4 任务四：二进制文件写操作

二进制写操作常用于保存不可直接阅读的原始数据，例如配置备份、压缩片段、设备快照等，更强调“原样保存”。

二进制文件写入的是 `bytes`，不是字符串。若手里是字符串，需要先用 `.encode("utf-8")` 转成 `bytes` 才能写入 `wb` 模式文件。

**例如：**

```python
text = "BLACKBOX: UAV-07 LOW_BATT"
data = text.encode("utf-8")  # 字符串 -> bytes

with open("blackbox_demo.bin", "wb") as f:
    # 写入二进制数据
    f.write(data)

print("已写入 blackbox_demo.bin（二进制）")
```

该示例把字符串先 `encode` 成 `bytes` 再用 `wb` 写入文件，展示“文本到字节”的写入流程。

:::{admonition} 【AI辅助小课堂】encode 的作用一句话说明
:class: tip
把“字符串写入二进制文件”的示例发给 AI，让 AI 用一句话解释：为什么必须 encode 才能写入。
:::

:::{admonition} 练习：保存无人机关键参数到二进制
:class: important
把字符串 `UAV-07,BATT=85,ALARM=LOW_BATT` 使用 UTF-8 编码后写入 `uav_params.bin`。
:::

:::{index} single: 二进制读取
:::
:::{index} single: rb模式
:::

## 5.2.5 任务五：二进制文件读操作

二进制读操作用于恢复备份、读取设备导出的原始数据片段。读出结果通常是 `bytes`，若内容原本是文本，需要再解码成字符串。

二进制读写的关键是成对出现，写入时用什么编码 `encode()`，读回时就用相同编码 `decode()`。

**例如：**

```python
bin_file = "blackbox_demo.bin"

with open(bin_file, "rb") as f:
    raw = f.read()  # bytes

text = raw.decode("utf-8")  # bytes -> 字符串
print("解码后的内容：", text)
```

该示例用 `rb` 读出 `bytes`，再用 `decode(\"utf-8\")` 还原成字符串并打印。

:::{admonition} 【AI辅助小课堂】decode 失败原因
:class: tip
让 AI 给出一个场景：为什么 decode 会失败（提示：编码不一致或原始数据不是文本）。
再说明遇到失败时应如何定位问题。
:::

:::{admonition} 练习：读回并验证一致性
:class: important
读取 `uav_params.bin`（上一练习生成），解码成字符串并打印。
再用 `==` 与原字符串对比，输出 True/False 验证一致性。
:::

# 5.3 项目三：无人机“任务数据归档器”——Pickle 与 JSON

**项目简介**

> 程序构造一个无人机任务数据对象 `mission`（字典），包含：任务编号、无人机编号、区域、传感器列表、高度采样、告警列表等。然后分别用 Pickle 和 JSON 进行归档：Pickle：写入二进制文件 `mission.pkl`，再读回恢复；JSON：写入文本文件 `mission.json`，再读回恢复；同时演示“写入/读取字符串”的 dumps/loads 用法，形成完整的序列化闭环。

**项目定位**

> 本项目定位为“数据持久化”的基础训练：理解“对象 → 文件/字符串 → 对象”的转换过程；掌握 `pickle.dump/load/dumps/loads` 与 `json.dump/load/dumps/loads` 的常用写法；能在无人机场景下选择合适格式：对外交换用 JSON，对内快速恢复用 Pickle。

**需求分析**

> 本项目编写脚本 `uav_archive.py` 需要完成以下功能：
> - 构造任务数据 `mission`（字典 + 列表），字段齐全且包含中文告警
> - 使用 `pickle.dump` 写入 `mission.pkl`，再用 `pickle.load` 读回并打印
> - 使用 `json.dump` 写入 `mission.json`，再用 `json.load` 读回并打印
> - 使用 `pickle.dumps/loads` 演示“对象 ↔ bytes”
> - 使用 `json.dumps/loads` 演示“对象 ↔ JSON字符串”
> - 给出对比输出：JSON 文件可读、Pickle 文件不可直接阅读但可快速恢复

**项目代码**

```python

# uav_archive.py
# 项目三：无人机“任务数据归档器”（Pickle 与 JSON）

import pickle
import json

print("=== 无人机任务数据归档器 ===")

# 构造任务数据（字典 + 列表），仅用已学数据类型
mission = {
    "mission_id": "MIS-20251224-A03",
    "uav_id": "UAV-07",
    "area": "A03",
    "pilot": "Li",
    "battery_percent": 78,
    "sensors": ["GPS", "IMU", "Barometer"],
    "alt_samples": [12.3, 12.8, 13.1, 12.6, 12.9],
    "alarms": ["低电量", "信号弱", "低电量"]  # 允许重复
}

print("原始任务数据 mission：")
print(mission)
print("----------------------------------")

# pickle.dump：对象 -> 二进制文件
pkl_file = "mission.pkl"
with open(pkl_file, "wb") as f:
    # dump：把 Python 对象写入二进制文件
    pickle.dump(mission, f)

print("已生成：", pkl_file, "（二进制 pickle 归档）")

# pickle.load：二进制文件 -> 对象
with open(pkl_file, "rb") as f:
    loaded_mission_pkl = pickle.load(f)

print("从 pickle 文件恢复的数据：")
print(loaded_mission_pkl)
print("pickle 恢复是否一致：", loaded_mission_pkl == mission)
print("----------------------------------")

# json.dump：对象 -> JSON文本文件
json_file = "mission.json"
with open(json_file, "w", encoding="utf-8") as f:
    # ensure_ascii=False 让中文不被转义，便于阅读
    json.dump(mission, f, ensure_ascii=False, indent=2)

print("已生成：", json_file, "（可读 JSON 归档）")

# json.load：JSON文本文件 -> 对象
with open(json_file, "r", encoding="utf-8") as f:
    loaded_mission_json = json.load(f)

print("从 JSON 文件恢复的数据：")
print(loaded_mission_json)
print("json 恢复是否一致：", loaded_mission_json == mission)
print("----------------------------------")

# pickle.dumps / pickle.loads：对象 <-> bytes
pkl_bytes = pickle.dumps(mission)
restored_from_bytes = pickle.loads(pkl_bytes)

print("pickle.dumps 得到的数据类型：", type(pkl_bytes))
print("从 bytes 恢复是否一致：", restored_from_bytes == mission)
print("----------------------------------")

# json.dumps / json.loads：对象 <-> JSON字符串
json_str = json.dumps(mission, ensure_ascii=False)
restored_from_str = json.loads(json_str)

print("json.dumps 得到的数据类型：", type(json_str))
print("json 字符串片段：", json_str[:30], "...")
print("从 JSON字符串 恢复是否一致：", restored_from_str == mission)

print("=== 结束 ===")
```

:::{index} single: pickle模块
:::
:::{index} single: 序列化
:::
:::{index} single: pickle.dump()
:::
:::{index} single: pickle.load()
:::
:::{index} single: pickle.dumps()
:::
:::{index} single: pickle.loads()
:::

## 5.3.1 任务一：pickle 模块

`pickle` 用于把 Python 对象序列化为二进制数据（bytes），保存后可再反序列化恢复为对象。可以把 `pickle` 理解为“把对象装进密封箱”，内容更偏向程序读取而不是给人直接阅读。

* `dump`：把箱子放进文件
* `load`：把箱子从文件取出来
* `dumps`：把箱子变成一段 bytes
* `loads`：把 bytes 还原为对象

pickle 常用函数与功能如表5-4所示。

<p align="center"><strong>表5-4 pickle 常用函数与功能表</strong></p>

| 函数                       | 作用                 | 输入                  | 输出       |
| -------------------------- | -------------------- | --------------------- | ---------- |
| `pickle.dump(obj, file)` | 对象写入二进制文件   | Python对象 + 文件对象 | 写入文件   |
| `pickle.load(file)`      | 从二进制文件读取对象 | 文件对象              | Python对象 |
| `pickle.dumps(obj)`      | 对象转为 bytes       | Python对象            | `bytes`  |
| `pickle.loads(b)`        | bytes 还原对象       | `bytes`             | Python对象 |

:::{admonition} 重要提示：Pickle 文件不是“文本”
:class: warning
pickle 归档是二进制格式，不能用记事本直接读懂；打开方式必须使用 "rb"/"wb"。
:::

**1.pickle.dump**

```python
pickle.dump(obj, file)
```

* `obj`：要保存的 Python 对象（如字典、列表等）
* `file`：以二进制写方式打开的文件对象（`open(..., "wb")`）

**例如：**

```python
import pickle

mission = {"uav_id": "UAV-07", "battery": 80}
with open("demo_dump.pkl", "wb") as f:
    # dump：对象写入二进制文件
    pickle.dump(mission, f)

print("已写入 demo_dump.pkl")
```

该示例用 `pickle.dump` 把字典写入 `.pkl` 二进制文件，写入时必须使用 `wb` 模式。

:::{admonition} 【AI辅助小课堂】预测文件可读性
:class: tip
把上面的示例发给 AI，让 AI 判断：用记事本打开 demo_dump.pkl 能否读懂？为什么？
运行后自己打开文件观察“是否乱码”。
:::

:::{admonition} 练习：pickle.dump 归档无人机任务
:class: important
构造一个字典 mission（至少包含 mission_id、uav_id、alarms 三个字段），用 pickle.dump 写入 mission_backup.pkl。
:::

**2.pickle.load**

```python
pickle.load(file)
```

* `file`：以二进制读方式打开的文件对象（`open(..., "rb")`）
* 返回值：从文件中恢复的 Python 对象

**例如：**

```python
import pickle

with open("demo_dump.pkl", "rb") as f:
    data = pickle.load(f)

print("恢复的数据：", data)
```

该示例用 `pickle.load` 从二进制文件读回对象，并验证读回结果是 Python 对象而不是文本字符串。

:::{admonition} 关键提醒：load 必须对应 dump
:class: warning
对同一个文件，必须先 dump 写入对象，才能 load 读取；文件为空或格式不对会报错。
:::

:::{admonition} 练习：pickle.load 读回并核对
:class: important
读取上一练习生成的 mission_backup.pkl，用 pickle.load 恢复对象并打印。
再用 == 与原 mission 对比输出 True/False。
:::

**3.pickle.dumps**

```python
pickle.dumps(obj)
```

把对象转成 bytes，适合“暂存到内存”或“发送到网络”。

**例如：**

```python
import pickle

mission = {"uav_id": "UAV-07", "area": "A03"}
b = pickle.dumps(mission)

print("类型：", type(b))
print("长度：", len(b))
```

该示例用 `pickle.dumps` 直接把对象转成 `bytes`，便于在内存中暂存或用于传输。

:::{admonition} 【AI辅助小课堂】bytes 的含义
:class: tip
让 AI 用一句话说明：pickle.dumps 返回的 bytes 是什么，为什么它能用于网络传输。
:::

:::{admonition} 练习：用 dumps 计算归档体积
:class: important
把一个包含 5 条高度采样的 mission 字典 dumps 成 bytes，并打印 bytes 的长度（len）。
:::

**4.pickle.loads**

```python
pickle.loads(b)
```

把 bytes 还原为对象，`b` 必须来自 `pickle.dumps`（或等价来源）。

**例如：**

```python
import pickle

mission = {"uav_id": "UAV-07", "battery": 70}
b = pickle.dumps(mission)

restored = pickle.loads(b)
print("恢复是否一致：", restored == mission)
```

该示例把 `pickle.dumps` 得到的字节流再 `loads` 回对象，并用相等比较验证序列化前后内容一致。

:::{admonition} 练习：bytes 还原验证
:class: important
对你自己构造的 mission 字典执行 dumps，再执行 loads，打印恢复对象并验证是否一致。
:::

:::{index} single: json模块
:::
:::{index} single: JSON格式
:::
:::{index} single: json.dump()
:::
:::{index} single: json.load()
:::
:::{index} single: json.dumps()
:::
:::{index} single: json.loads()
:::

## 5.3.2 任务二：json 模块

`json` 用于把数据序列化为 JSON 文本，便于阅读与跨语言交换，并可再反序列化恢复为 Python 对象。
可以把 JSON 理解为统一格式的表单文本，写出来容易被人读懂，也容易被程序解析。

在 Python 中，`json.dump/load` 面向文件，`json.dumps/loads` 面向字符串。

JSON 类型与 Python 类型对应关系如图5-1所示

```
JSON object   <->  Python dict
JSON array    <->  Python list
JSON string   <->  Python str
JSON number   <->  Python int / float
JSON true/false <-> Python True / False
JSON null     <->  Python None
```

<p align="center"><strong>图5-2 JSON 类型与 Python 类型对应关系</strong></p>

json 常用函数与功能如表5-5所示。

<p align="center"><strong>表5-5 json 常用函数与功能</strong></p>

| 函数                     | 作用                 | 输入                  | 输出       |
| ------------------------ | -------------------- | --------------------- | ---------- |
| `json.dump(obj, file)` | 对象写入 JSON 文件   | Python对象 + 文件对象 | 写入文件   |
| `json.load(file)`      | 从 JSON 文件读取对象 | 文件对象              | Python对象 |
| `json.dumps(obj)`      | 对象转 JSON 字符串   | Python对象            | `str`    |
| `json.loads(s)`        | JSON 字符串转对象    | `str`               | Python对象 |

:::{admonition} 提示：中文建议关闭转义
:class: tip
写入文件时常用：json.dump(..., ensure_ascii=False)，使中文保持可读。
:::

**1.json.dump**

```python
json.dump(obj, file, ensure_ascii=False, indent=2)
```

* `obj`：要保存的 Python 对象（通常是 dict/list）
* `file`：以文本写方式打开的文件对象（`open(..., "w", encoding="utf-8")`）
* `ensure_ascii=False`：中文不转义
* `indent=2`：缩进美化，便于阅读

**例如：**

```python
import json

mission = {"uav_id": "UAV-07", "alarm": "低电量", "battery": 78}
with open("demo.json", "w", encoding="utf-8") as f:
    # dump：对象写入 JSON 文件
    json.dump(mission, f, ensure_ascii=False, indent=2)

print("已写入 demo.json")
```

该示例用 `json.dump` 把字典写入 JSON 文件，并通过 `ensure_ascii=False` 保持中文可读。

:::{admonition} 练习：json.dump 写入任务归档
:class: important
构造一个 mission 字典（至少包含 uav_id、sensors 列表、alarms 列表），用 json.dump 写入 mission.json，要求中文可读（ensure_ascii=False）。
:::

**2.json.load**

```python
json.load(file)
```

* `file`：以文本读方式打开的文件对象（`open(..., "r", encoding="utf-8")`）
* 返回值：从 JSON 恢复的 Python 对象

**例如：**

```python
import json

with open("demo.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("恢复的数据：", data)
```

该示例用 `json.load` 读取 JSON 文件并恢复为字典，再通过打印确认字段已被解析出来。

:::{admonition} 【AI辅助小课堂】预测恢复类型
:class: tip
让 AI 判断：json.load 读回的结果类型是什么（dict/list/str）？依据是什么？
运行示例核对 type(data)。
:::

:::{admonition} 练习：json.load 读回并取字段
:class: important
读取 mission.json，用 json.load 得到对象后，打印其中的 uav_id 与 alarms。
:::

**3.json.dumps**

```python
json.dumps(obj, ensure_ascii=False)
```

把对象转成 JSON 字符串，适合打印、网络传输或写入数据库字段。

**例如：**

```python
import json

mission = {"uav_id": "UAV-07", "battery": 78}
s = json.dumps(mission, ensure_ascii=False)

print("类型：", type(s))
print("JSON字符串：", s)
```

该示例用 `json.dumps` 生成 JSON 字符串，并展示结果类型为 `str`，适合直接打印或传输。

:::{admonition} 练习：生成可传输 JSON 字符串
:class: important
把一个包含 mission_id 与 area 的字典转换为 JSON 字符串并打印。
要求中文不转义。
:::

**4.json.loads**

```python
json.loads(s)
```

把 JSON 字符串还原为 Python 对象。

**例如：**

```python
import json

s = '{"uav_id":"UAV-07","battery":78}'
obj = json.loads(s)

print("恢复对象：", obj)
print("battery：", obj["battery"])
```

该示例用 `json.loads` 把 JSON 字符串解析为字典，并通过下标取值读取其中的字段。

:::{admonition} 重要提醒：字符串必须是合法 JSON
:class: warning
json.loads 的输入必须满足 JSON 语法（双引号、逗号、括号等），否则会抛出解析错误。
:::

:::{admonition} 练习：loads 后做一次判断
:class: important
自定义一个 JSON 字符串（包含 battery 字段），loads 成字典后：若 battery < 30 打印“低电量”，否则打印“电量正常”。
:::

---

# 5.4 项目四：无人机“数据采集任务目录管家”——OS 文件与文件夹操作

**项目简介**

> 脚本以任务编号为线索创建目录树：
> `uav_data/MIS-20251224-A03/logs`、`uav_data/MIS-20251224-A03/sensors`、`uav_data/MIS-20251224-A03/photos`。
> 随后在 `logs` 与 `sensors` 中创建示例文件，并遍历输出目录清单；最后演示“重命名”和“删除清理”，形成完整的文件系统操作闭环。

**项目定位**

> 本项目定位为“操作系统文件管理”的入门实践：掌握文件夹的创建/删除（一级与多级、空与非空）；掌握文件的创建/删除、存在性判断、信息获取与重命名；掌握目录遍历，形成“任务目录结构巡检”的基本能力。

**需求分析**

> 本项目编写脚本 `uav_dir_manager.py` 需要完成以下功能：
>
> - 创建一级目录 `uav_data`，再创建多级目录 `uav_data/<mission_id>/logs|sensors|photos`
> - 判断目录是否存在：存在则提示，不存在则创建
> - 在 `logs` 中创建 `flight.log`，在 `sensors` 中创建 `gps.txt` 并写入两行示例数据
> - 遍历任务目录，输出“目录/文件”清单
> - 重命名目录或文件（如将 `photos` 改为 `images`，将 `flight.log` 改为 `flight_01.log`）
> - 删除空目录用 `os.rmdir`；删除非空目录用 `shutil.rmtree`
> - 对关键步骤输出提示语，便于核对执行效果

**项目代码**

```python

# uav_dir_manager.py
# 项目四：无人机“数据采集任务目录管家”

import os
import shutil

print("=== 无人机任务目录管家 ===")

# 任务编号（用于构造目录树）
mission_id = "MIS-20251224-A03"

# 顶层目录与任务目录
base_dir = "uav_data"
mission_dir = os.path.join(base_dir, mission_id)

# 多级子目录
logs_dir = os.path.join(mission_dir, "logs")
sensors_dir = os.path.join(mission_dir, "sensors")
photos_dir = os.path.join(mission_dir, "photos")

# ---------- 创建文件夹（一级 + 多级） ----------
# 创建一级目录：uav_data
if not os.path.exists(base_dir):
    os.mkdir(base_dir)  # 创建一级文件夹
    print("已创建一级目录：", base_dir)
else:
    print("一级目录已存在：", base_dir)

# 创建多级目录：uav_data/<mission_id>/...
os.makedirs(logs_dir, exist_ok=True)
os.makedirs(sensors_dir, exist_ok=True)
os.makedirs(photos_dir, exist_ok=True)
print("已创建/确认多级目录：", mission_dir)

# ---------- 创建文件并写入内容 ----------
log_file = os.path.join(logs_dir, "flight.log")
gps_file = os.path.join(sensors_dir, "gps.txt")

# 创建日志文件（文本写入）
with open(log_file, "w", encoding="utf-8") as f:
    f.write("UAV-07 takeoff\n")
    f.write("Altitude=12.6m\n")
print("已创建文件：", log_file)

# 创建传感器文件（文本写入）
with open(gps_file, "w", encoding="utf-8") as f:
    f.write("lat=28.228, lon=112.938\n")
    f.write("lat=28.229, lon=112.939\n")
print("已创建文件：", gps_file)

# ---------- 遍历文件夹（输出目录清单） ----------
print("\n--- 目录巡检清单（walk）---")
for root, dirs, files in os.walk(mission_dir):
    print("目录：", root)
    for d in dirs:
        print("  [DIR ]", d)
    for fn in files:
        print("  [FILE]", fn)

# ---------- 文件夹重命名 ----------
new_photos_dir = os.path.join(mission_dir, "images")
if os.path.exists(photos_dir) and (not os.path.exists(new_photos_dir)):
    os.rename(photos_dir, new_photos_dir)  # 重命名文件夹
    print("\n已重命名目录：photos -> images")
else:
    print("\n目录重命名跳过（不存在或目标已存在）")

# ---------- 文件重命名 ----------
new_log_file = os.path.join(logs_dir, "flight_01.log")
if os.path.exists(log_file) and (not os.path.exists(new_log_file)):
    os.rename(log_file, new_log_file)  # 重命名文件
    print("已重命名文件：flight.log -> flight_01.log")
else:
    print("文件重命名跳过（不存在或目标已存在）")

# ---------- 删除演示：删除空目录 vs 删除非空目录 ----------
# 先创建一个空目录用于演示 os.rmdir
empty_dir = os.path.join(mission_dir, "empty_temp")
if not os.path.exists(empty_dir):
    os.mkdir(empty_dir)
    print("\n已创建空目录：", empty_dir)

# 删除空目录（只能删空的）
if os.path.exists(empty_dir):
    os.rmdir(empty_dir)
    print("已删除空目录（os.rmdir）：", empty_dir)

# 删除非空目录（整棵删除）
# 注意：此操作会删除 mission_dir 及其所有内容
print("\n准备删除任务目录（非空）：", mission_dir)
shutil.rmtree(mission_dir)
print("已删除非空目录（shutil.rmtree）：", mission_dir)

print("=== 结束 ===")
```

:::{index} single: os模块
:::
:::{index} single: 文件夹创建
:::
:::{index} single: os.mkdir()
:::
:::{index} single: os.makedirs()
:::
:::{index} single: os.rmdir()
:::
:::{index} single: shutil.rmtree()
:::

## 5.4.1 任务一：创建与删除文件夹

**创建文件夹**

创建文件夹用于把文件按层级组织起来，形成清晰的目录结构。可以把一级目录理解为“最外层的收纳箱”，多级目录理解为“箱子里继续分隔的小盒子”。

- 一级目录好比“文件柜”，多级目录好比“文件柜中的抽屉与文件夹”
- `os.mkdir` 适合创建单层目录，`os.makedirs` 适合一次创建多层目录

创建文件夹的常用语法如表5-6所示。

<p align="center"><strong>表5-6 创建文件夹的常用语法</strong></p>

| 场景                 | 语法                                 | 说明                     | 简单示例（可运行片段）                              |
| -------------------- | ------------------------------------ | ------------------------ | --------------------------------------------------- |
| 创建一级文件夹       | `os.mkdir(path)`                   | 目录不存在才可创建       | `os.mkdir("uav_data")`                            |
| 创建多级文件夹       | `os.makedirs(path)`                | 可一次创建多层           | `os.makedirs("uav_data/MIS/logs")`                |
| 多级创建且允许已存在 | `os.makedirs(path, exist_ok=True)` | 不报错更适合脚本反复运行 | `os.makedirs("uav_data/MIS/logs", exist_ok=True)` |

**例如：**

```python
import os

base_dir = "uav_data"
multi_dir = os.path.join(base_dir, "MIS-001", "logs")

# 创建一级目录
if not os.path.exists(base_dir):
    os.mkdir(base_dir)  # 一级目录
    print("创建：", base_dir)

# 创建多级目录
os.makedirs(multi_dir, exist_ok=True)
print("创建/确认：", multi_dir)
```

该示例演示了先用 `os.path.exists` 判断一级目录是否存在，再用 `os.makedirs(..., exist_ok=True)` 一次性创建多级目录并支持重复运行。

:::{admonition} 【AI辅助小课堂】判断 mkdir 与 makedirs 的区别
:class: tip
让 AI 用两句话对比 os.mkdir 与 os.makedirs：
1）各适用什么目录层级；2）遇到“父目录不存在”时谁会报错。
:::

:::{admonition} 练习：创建无人机任务目录树
:class: important
创建目录：uav_data/MIS-20251224-A03/logs 与 uav_data/MIS-20251224-A03/sensors。
要求：使用 os.path.join 组合路径，使用 os.makedirs(..., exist_ok=True) 防止重复运行报错。
:::

**删除文件夹**

删除文件夹用于清理不再需要的目录结构。可以把空目录理解为“空盒子”，把非空目录理解为“里面装了东西的盒子”，两者的删除方式不同。

- `os.rmdir` 只能删除空目录，目录里只要有文件或子目录就会失败
- `shutil.rmtree` 会把目录整棵删除（包含所有子目录与文件），属于“强删除”

删除文件夹的常用语法如表5-7所示。

<p align="center"><strong>表5-7 删除文件夹的常用语法</strong></p>

| 场景           | 语法                    | 说明               | 简单示例（可运行片段）                |
| -------------- | ----------------------- | ------------------ | ------------------------------------- |
| 删除空文件夹   | `os.rmdir(path)`      | 目录必须为空       | `os.rmdir("uav_data/temp")`         |
| 删除非空文件夹 | `shutil.rmtree(path)` | 整棵删除，危险操作 | `shutil.rmtree("uav_data/MIS-001")` |

**例如：**

```python
import os
import shutil

# 先创建一个空目录
os.makedirs("uav_data/temp_empty", exist_ok=True)

# 删除空目录
os.rmdir("uav_data/temp_empty")
print("已删除空目录")

# 创建一个非空目录（含文件）
os.makedirs("uav_data/temp_full", exist_ok=True)
with open("uav_data/temp_full/a.txt", "w", encoding="utf-8") as f:
    f.write("demo")

# 删除非空目录
shutil.rmtree("uav_data/temp_full")
print("已删除非空目录")
```

该示例对比了 `os.rmdir` 只能删除空目录，以及 `shutil.rmtree` 可以删除包含文件的目录树。

:::{admonition} 警告：rmtree 会删除全部内容
:class: warning
shutil.rmtree(path) 会删除目录下所有文件与子目录。使用前必须确认路径正确，避免误删重要数据。
:::

:::{admonition} 练习：删除空目录与非空目录
:class: important

- 创建空目录 uav_data/empty_test 并用 os.rmdir 删除
- 创建目录 uav_data/full_test 并写入一个文件，再用 shutil.rmtree 删除
  :::

:::{index} single: os.listdir()
:::
:::{index} single: os.rename()
:::
:::{index} single: os.path.exists()
:::

## 5.4.2 任务二：文件夹的其他操作

文件夹建好后，常见操作包括判断是否存在、遍历目录结构、对目录重命名。可以把遍历理解为“按层打开收纳箱并列出里面有哪些物品”，把重命名理解为“给收纳格贴上更清晰的标签”：

- 存在性检查用于避免重复创建或操作不存在的目录
- 遍历用于生成目录清单，方便核对目录层级与文件数量
- 重命名用于统一命名规则，便于长期维护

文件夹的其他常用操作如表5-8所示。

<p align="center"><strong>表5-8 文件夹的其他常用操作</strong></p>

| 操作         | 语法                     | 说明                     | 简单示例（可运行片段）                            |
| ------------ | ------------------------ | ------------------------ | ------------------------------------------------- |
| 判断是否存在 | `os.path.exists(path)` | 存在返回 True            | `os.path.exists("uav_data")`                    |
| 遍历目录树   | `os.walk(path)`        | 逐层得到 root/dirs/files | `for root, dirs, files in os.walk("uav_data"):` |
| 重命名目录   | `os.rename(src, dst)`  | 目录或文件都可用         | `os.rename("photos", "images")`                 |

**例如：**

```python
import os

mission_dir = os.path.join("uav_data", "MIS-001")
photos_dir = os.path.join(mission_dir, "photos")
images_dir = os.path.join(mission_dir, "images")

os.makedirs(photos_dir, exist_ok=True)

# 是否存在
print("photos 是否存在：", os.path.exists(photos_dir))

# 遍历
for root, dirs, files in os.walk(mission_dir):
    print("目录：", root, "子目录：", dirs, "文件：", files)

# 重命名（若目标不存在）
if os.path.exists(photos_dir) and (not os.path.exists(images_dir)):
    os.rename(photos_dir, images_dir)
    print("已重命名：photos -> images")
```

该示例把 `exists`、`walk`、`rename` 串起来，展示如何确认目录存在、输出目录树清单，并在满足条件时完成目录重命名。

:::{admonition} 【AI辅助小课堂】预测 os.walk 输出层级
:class: tip
把 mission_dir 的目录结构描述给 AI，让 AI 预测 os.walk 会输出几层 root，并说明原因。运行后核对输出行数。
:::

:::{admonition} 练习：生成《任务目录清单》
:class: important
创建 uav_data/MIS-XYZ/logs 与 uav_data/MIS-XYZ/sensors，并各创建 1 个文件。
使用 os.walk 输出清单，要求每一行同时打印 root、dirs、files。
:::

:::{index} single: 文件创建
:::
:::{index} single: 文件删除
:::
:::{index} single: os.remove()
:::

## 5.4.3 任务三：创建与删除文件

文件是把数据持久保存到磁盘上的基本载体。可以把写文件理解为“把内容写进一张纸并放进文件夹”，把删文件理解为“把过期的纸张清理掉”，以免干扰后续使用。

- 创建文件通常通过 `open(..., "w")` 或 `open(..., "a")` 完成，删除文件常用 `os.remove`
- 删除前建议先做“是否存在”判断，避免报错

创建与删除文件的常用语法如表5-9所示。

<p align="center"><strong>表5-9 创建与删除文件的常用语法</strong></p>

| 场景              | 语法                                             | 说明                     | 简单示例（可运行片段）           |
| ----------------- | ------------------------------------------------ | ------------------------ | -------------------------------- |
| 创建/覆盖写入文件 | `with open(path, "w", encoding="utf-8") as f:` | 不存在则创建，存在则覆盖 | `open("logs/flight.log","w")`  |
| 追加写入文件      | `with open(path, "a", encoding="utf-8") as f:` | 追加到文件末尾           | `open("logs/flight.log","a")`  |
| 删除文件          | `os.remove(path)`                              | 删除单个文件             | `os.remove("logs/flight.log")` |

**例如：**

```python
import os

file_path = os.path.join("uav_data", "demo_log.txt")

# 创建文件并写入
with open(file_path, "w", encoding="utf-8") as f:
    f.write("UAV-07 takeoff\n")  # 写入一行日志
print("已创建文件：", file_path)

# 删除文件（先判断存在）
if os.path.exists(file_path):
    os.remove(file_path)
    print("已删除文件：", file_path)
```

该示例演示用写模式创建文件并写入内容，再通过 `os.path.exists` 判断后调用 `os.remove` 完成删除。

:::{admonition} 练习：创建并清理传感器文件
:class: important
在 uav_data 目录下创建文件 imu.txt，写入两行数据；然后判断文件存在后删除它。
要求代码可直接运行。
:::

:::{index} single: os.path.getsize()
:::
:::{index} single: 文件大小
:::
:::{index} single: 文件信息
:::

## 5.4.4 任务四：文件的其他操作

除了创建与删除，文件管理还需要判断文件是否存在、获取文件信息并进行重命名。可以把这些操作理解为“先确认东西在不在，再查看标签或重量，最后把标签改成更清楚的名字”。

- 存在性检查用于避免对不存在文件进行读取或重命名
- 文件大小常用于做粗略校验，例如判断是否写入了内容
- 重命名用于形成统一命名规则，便于分卷或按日期归档

文件其他操作的常用语法如表5-10所示。

<p align="center"><strong>表5-10 文件其他操作的常用语法</strong></p>

| 操作                 | 语法                      | 说明              | 简单示例（可运行片段）         |
| -------------------- | ------------------------- | ----------------- | ------------------------------ |
| 判断文件是否存在     | `os.path.exists(path)`  | 文件/目录都可判断 | `os.path.exists("a.txt")`    |
| 获取文件大小（字节） | `os.path.getsize(path)` | 返回 int（bytes） | `os.path.getsize("a.txt")`   |
| 重命名文件           | `os.rename(src, dst)`   | 文件与目录通用    | `os.rename("a.txt","b.txt")` |

**例如：**

```python
import os

# 创建一个文件用于演示
os.makedirs("uav_data", exist_ok=True)
src = os.path.join("uav_data", "flight.log")
dst = os.path.join("uav_data", "flight_01.log")

with open(src, "w", encoding="utf-8") as f:
    f.write("Altitude=12.6m\n")  # 写入示例内容

# 是否存在
print("文件是否存在：", os.path.exists(src))

# 获取大小
size = os.path.getsize(src)
print("文件大小（字节）：", size)

# 重命名（确保目标不存在）
if os.path.exists(src) and (not os.path.exists(dst)):
    os.rename(src, dst)
    print("已重命名：flight.log -> flight_01.log")
```

该示例先创建一个文件并写入内容，再用 `exists` 与 `getsize` 做检查，最后在目标不存在时完成重命名。

:::{admonition} 【AI辅助小课堂】用文件大小判断是否写入成功
:class: tip
让 AI 说明：为什么 os.path.getsize 返回 0 往往意味着文件没有写入内容？
 把示例中的写入语句注释掉再运行，对比 size 输出。
:::

:::{admonition} 练习：日志分卷命名
:class: important
创建 uav_data/log.txt 写入三行内容；打印文件大小；把它重命名为 uav_data/log_20251224.txt；再判断新文件是否存在并打印 True/False。
:::

---

# 5.5 项目五：综合实践项目——无人机“任务数据归档与巡检器”——文件与文件夹综合

## 项目简介

本项目是“文件与文件夹操作”的综合实践：覆盖文件夹创建/删除/存在性判断/遍历/重命名；覆盖文本文件读写（read/readline/readlines/循环读行）、二进制文件读写；覆盖文件打开模式、文件指针（tell/seek）、编码参数（encoding）；覆盖文件存在性判断、文件信息获取（大小）、文件重命名与删除。

## 需求分析

　本项目要求学生在 90 分钟内完成一个脚本 `uav_archive_inspector.py`，实现“任务目录归档 + 文件读写 + 指针控制 + 巡检报告 + 重命名清理”五件事。脚本需要覆盖前面学习过的所有文件与文件夹操作关键点，并做到输出可核对、路径可复现、代码可反复运行。

脚本需要完成以下功能：

1. **目录结构准备（文件夹创建/存在判断）**

   - 创建一级目录：`uav_archive`
   - 创建多级目录：`uav_archive/<mission_id>/logs`、`sensors`、`media`
   - 使用 `os.path.exists` 判断是否存在，避免重复创建报错
2. **文本文件写入（open/with open + encoding + 写模式）**

   - 使用 `with open(..., "w", encoding="utf-8")` 创建并写入：
     `flight.log`（至少3行）、`gps.txt`（至少2行）
3. **文本文件读取（read/readline/readlines/循环读行）**

   - 每种读法都要输出可核对结果（例如行数、第一行、最后一行）
4. **文件指针（tell/seek）**

   - 对同一文本文件：读一行后 `tell()` 查看位置，再 `seek(0)` 回到开头复读，输出对比信息
5. **二进制文件读写（wb/rb）**

   - 在 `media` 目录创建 `photo.bin` 并写入若干字节
   - 读取并输出 `len(data)` 与 `os.path.getsize` 对比
6. **信息与维护（getsize/rename/remove/rmdir/rmtree）**

   - 使用 `os.path.getsize` 输出文件大小
   - 重命名目录 `media -> images`
   - 重命名文件 `flight.log -> flight_01.log`
   - 演示删除空目录 `os.rmdir` 与删除非空目录 `shutil.rmtree`

## 交付物

- 文件：`uav_archive_inspector.py`
- 运行截图或运行输出文本
- 关键检查点（输出中必须能看到）：
  （1）创建的目录树（含 logs/sensors/media 或 images）；
  （2）`read/readline/readlines/循环读行` 至少各 1 次输出；
  （3）`tell/seek` 前后指针位置对比；
  （4）二进制文件写入与读取字节数；
  （5）目录与文件重命名提示；
  （6）空目录删除与非空目录删除提示。

## 评价标准

| 项目       | 合格要求                                                    |
| ---------- | ----------------------------------------------------------- |
| 目录操作   | 能创建一级与多级目录，能判断存在性，能遍历输出清单          |
| 文本读写   | 文本文件能写入并用 4 种方式读取，输出可核对                 |
| 编码与模式 | 写入/读取包含 `encoding="utf-8"`，模式使用正确            |
| 文件指针   | 能展示 tell/seek 前后位置变化并解释结果                     |
| 二进制读写 | 能写入与读取 bytes，能输出字节数与文件大小                  |
| 维护操作   | 至少完成 1 次目录重命名、1 次文件重命名、空/非空删除各 1 次 |
| 代码风格   | 文件头部说明齐全、核心代码有注释、缩进规范                  |

---
