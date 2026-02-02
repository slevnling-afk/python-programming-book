(model4)=

# 模块四：数据类型的操作

---

# 4.1 项目一：无人机“巡检日志解析器”——字符串处理基础

**项目简介**

> 本项目内置一段“简化巡检日志文本”。程序按固定规则完成：拆分日志行与字段，提取任务编号、无人机编号、航点序列与告警；清洗空白与分隔符，统一大小写与格式；对关键字段做查找与合法性测试；输出排版清晰的解析报告。

**项目定位**

> 本项目定位为"字符串方法与字符串运算符"的系统训练，覆盖字符串运算符（`+`、`*`、`in`）、分割（`split/rsplit/splitlines/partition/rpartition`）、合并（`join`）、查找（`find/rfind/index/rindex`）、替换（`replace/expandtabs`）、删除空白（`strip/lstrip/rstrip`）、测试（如 `startswith/endswith/isalpha/isdigit/...`）、大小写处理（`lower/upper/title/...`）。

**需求分析**

> 本项目编写脚本 `uav_log_parser.py` 需要完成以下功能：
> - 准备日志字符串 `raw_log`（包含多行、制表符与空白、字段分隔符 `|`）
> - 用分割方法得到“行列表”和“字段列表”
> - 用 `join` 把航点列表合并为“->”串
> - 用查找方法定位关键字位置并输出
> - 用替换方法把分隔符/异常标记替换成规范文本
> - 用删除方法清理首尾空白
> - 用测试方法检查：任务编号前缀、是否为数字、是否为合法标识符等
> - 用大小写方法统一 `uav_id` 与告警等级显示
> - 输出《巡检日志解析报告》

**项目代码**

```python

# uav_log_parser.py
# 项目一：无人机"巡检日志解析器"——字符串处理基础

raw_log = (
    "  MIS-20251224-A03 | uav-07 | pilot=Li   \n"
    "  waypoints:\tP1,P2,P3,P4   \n"
    "  alarms:\tLOW_BATTERY, gps_lost ,LOW_BATTERY \n"
    "  note:\tReturn-Home if battery<30%  \n"
)

print("=== 巡检日志解析报告 ===")

# splitlines：按行拆分
lines = raw_log.splitlines()
print("日志行数：", len(lines))

# 解析第一行：字段以 | 分隔
head = lines[0].strip()  # 去掉首尾空白
parts = [p.strip() for p in head.split("|")]  # 分割并清洗空白

mission_id = parts[0]
uav_id = parts[1].upper()  # 大写规范化
pilot_part = parts[2]      # "pilot=Li"

# partition：把 "pilot=Li" 拆成三段
k, sep, pilot = pilot_part.partition("=")
pilot = pilot.strip()

# 解析航点行：逗号分割 -> 列表 -> join 合并
wp_line = lines[1].strip()
_, _, wp_csv = wp_line.partition(":")      # "P1,P2,P3,P4"
wp_list = [w.strip() for w in wp_csv.split(",")]
wp_path = " -> ".join(wp_list)

# 解析告警行：分割 + 替换 + 去空白
alarm_line = lines[2].strip()
_, _, alarm_csv = alarm_line.partition(":")
alarm_csv = alarm_csv.replace(" ", "")     # 删除中间空格
alarms = alarm_csv.split(",")              # 列表（允许重复）

# 查找示例：定位关键字
note_line = lines[3]
pos_rth = note_line.find("Return-Home")

# 测试示例：任务编号前缀与无人机编号合法性
is_mis = mission_id.startswith("MIS-")
is_identifier = uav_id.replace("-", "_").isidentifier()

print("----------------------------------")
print("基本信息：")
print("任务编号：", mission_id)
print("无人机编号：", uav_id)
print("飞手：", pilot)
print("----------------------------------")
print("航点路径：", wp_path)
print("告警列表：", alarms)
print("Return-Home 位置：", pos_rth)
print("----------------------------------")
print("规则测试：")
print("任务编号是否以 MIS- 开头：", is_mis)
print("无人机编号转为标识符是否有效：", is_identifier)
print("=== 报告结束 ===")
```

:::{index} single: 字符串运算符
:::
:::{index} single: 字符串拼接
:::
:::{index} single: in运算符
:::

## 4.1.1 任务一：字符串的运算符操作

字符串支持 `+` 拼接、`*` 重复与 `in` 包含判断，常用于快速组合文本并做简单的“有没有”判断。
可以把 `+` 当作把两段文字接起来，把 `*` 当作复印多份，把 `in` 当作在一段文字里查是否出现某个片段。

字符串运算符操作如表 4-1 所示。

<p align="center"><strong>表4-1 字符串运算符操作</strong></p>

| 运算符 | 描述             | 简单示例                | 结果         |
| ------ | ---------------- | ----------------------- | ------------ |
| `+`  | 拼接字符串       | `"UAV-" + "07"`       | `"UAV-07"` |
| `*`  | 重复字符串       | `"=" * 5`             | `"====="`  |
| `in` | 判断子串是否存在 | `"GPS" in "GPS_LOST"` | `True`     |

**例如：**

```python
mission_id = "MIS-20251224-A03"
note_line = "note:\tReturn-Home if battery<30%"

title = "任务：" + mission_id
line = "-" * 20

print(title)
print(line)

has_rth = "Return-Home" in note_line  # 核心：in 判断
print("是否包含返航指令：", has_rth)
```

该示例用 `+` 生成标题、用 `*` 生成分隔线，并用 `in` 判断字符串中是否包含关键字。

:::{admonition} 【AI辅助小课堂】运算符效果预测
:class: tip
把 `"-"*20` 改成 `"="*10`，让 AI 先写出输出分隔线的样子，再运行核对。
:::

:::{admonition} 练习：字符串运算符
:class: important
设定 `uav_id="UAV-19"`、`alarm="LOW_BATTERY"`：

- 用 `+` 输出 `无人机UAV-19告警：LOW_BATTERY`
- 用 `in` 判断告警中是否包含 `"BAT"` 并输出结果
- 用 `"*"` 输出一条长度为 30 的分隔线
  :::

:::{index} single: 字符串分割
:::
:::{index} single: split方法
:::
:::{index} single: partition方法
:::

## 4.1.2 任务二：字符串的分割操作

分割操作用于按分隔符或换行把字符串拆成更小的片段，得到列表或三段结构，便于逐段处理。
它像先把一段话切成句子，再按标点切成词，文本越复杂越需要先拆分再处理。

字符串分割操作如表 4-2 所示。

<p align="center"><strong>表4-2 字符串分割操作</strong></p>

| 方法                      | 描述                       | 简单示例                    | 结果要点            |
| ------------------------- | -------------------------- | --------------------------- | ------------------- |
| `split(sep)`            | 从左到右按分隔符拆分       | `"a,b,c".split(",")`      | `['a','b','c']`   |
| `rsplit(sep, maxsplit)` | 从右到左拆分（可限制次数） | `"a=b=c".rsplit("=", 1)`  | `['a=b','c']`     |
| `splitlines()`          | 按换行拆成行列表           | `"a\nb".splitlines()`     | `['a','b']`       |
| `partition(sep)`        | 从左到右只切一次，返回三段 | `"a=b".partition("=")`    | `('a','=','b')`   |
| `rpartition(sep)`       | 从右到左只切一次，返回三段 | `"a=b=c".rpartition("=")` | `('a=b','=','c')` |

**例如：**

```python
raw = "  MIS-20251224-A03 | uav-07 | pilot=Li   \nline2\n"

# splitlines：拆行
lines = raw.splitlines()
print("行列表：", lines)

head = "MIS-20251224-A03 | uav-07 | pilot=Li"
parts = [p.strip() for p in head.split("|")]  # split：按 | 拆字段
print("字段列表：", parts)

# partition：只切一次
k, sep, v = "pilot=Li".partition("=")
print("partition：", k, sep, v)

# rpartition：从右切一次
left, sep, right = "note=Return=Home".rpartition("=")
print("rpartition：", left, sep, right)

# rsplit：从右切一次得到两段
pair = "a=b=c".rsplit("=", 1)
print("rsplit：", pair)
```

该示例对比 `splitlines/split/partition/rpartition/rsplit`，展示按行拆分、按分隔符拆分以及“只切一次/从右切”的效果。

:::{admonition} 【AI辅助小课堂】选择合适的分割方法
:class: tip
把字符串 `"pilot=Li"` 和 `"note=Return=Home"` 发给 AI，让 AI 判断用 `partition` 还是 `rpartition` 更合适，并说明理由。运行示例核对结果。
:::

:::{admonition} 练习：分割操作
:class: important
给定一行：`line = "waypoints:P1,P2,P3"`

- 用 `partition(":")` 取出 `P1,P2,P3`
- 再用 `split(",")` 得到航点列表并打印。要求代码可运行
  :::

:::{index} single: join方法
:::
:::{index} single: 字符串合并
:::

## 4.1.3 任务三：字符串的合并操作

`join` 用于把“字符串列表”按指定分隔符合并为一个字符串。
把 `sep.join(list)` 理解为用 `sep` 把列表里的每个元素“串起来”。
它像用一根线把一串珠子串起来，分隔符就是珠子之间的间隔。

**例如：**

```python
wp_list = ["P1", "P2", "P3", "P4"]

path = " -> ".join(wp_list)  # 核心：合并列表
print("航点路径：", path)

csv = ",".join(wp_list)
print("CSV：", csv)
```

该示例用 `join()` 将字符串列表分别合并成箭头路径与逗号分隔文本，体现“用分隔符串起列表”的用法。

:::{admonition} 【AI辅助小课堂】join 与 + 的对比
:class: tip
让 AI 说明：合并 10 个航点时，为什么更推荐 `join` 而不是反复使用 `+`。运行示例核对输出格式。
:::

:::{admonition} 练习：join
:class: important
设定 `sensors = ["GPS","IMU","Camera"]`，用 `" | ".join(sensors)` 输出传感器清单行。
:::

:::{index} single: find方法
:::
:::{index} single: index方法
:::
:::{index} single: 字符串查找
:::

## 4.1.4 任务四：字符串的查找操作

查找操作用于定位子串位置，`find/rfind`找不到返回 `-1`，`index/rindex`找不到会抛出异常。
可以把 `find` 理解为“找到了给位置，找不到给 -1”，把 `index` 理解为“必须找到，否则直接报错”。

字符串查找操作如表 4-3 所示。

<p align="center"><strong>表4-3 字符串查找操作</strong></p>

| 方法            | 描述                 | 简单示例                    | 找不到时 |
| --------------- | -------------------- | --------------------------- | -------- |
| `find(sub)`   | 从左查找首次出现位置 | `"abc".find("b") -> 1`    | `-1`   |
| `rfind(sub)`  | 从右查找首次出现位置 | `"abcb".rfind("b") -> 3`  | `-1`   |
| `index(sub)`  | 从左查找位置         | `"abc".index("b") -> 1`   | 抛异常   |
| `rindex(sub)` | 从右查找位置         | `"abcb".rindex("b") -> 3` | 抛异常   |

**例如：**

```python
note_line = "note:\tReturn-Home if battery<30%"
alarm_csv = "LOW_BATTERY,gps_lost,LOW_BATTERY"

pos1 = note_line.find("Return-Home")     # 核心：找关键字
pos2 = note_line.index("note")           # 核心：一定存在

last_comma = alarm_csv.rfind(",")        # 核心：从右找
print("Return-Home 位置：", pos1)
print("note 位置：", pos2)
print("最后一个逗号位置：", last_comma)
```

该示例用 `find/index` 从左定位关键字，并用 `rfind` 从右定位最后一个分隔符位置，展示不同查找策略的返回值差异。

:::{admonition} index 的风险提示
:class: warning
`index/rindex` 找不到会直接抛异常；需要“安全查找”时优先用 `find/rfind`。
:::

:::{admonition} 【AI辅助小课堂】find 与 index 的选择
:class: tip
让 AI 判断：当字符串可能不存在子串时，为什么用 `find` 更合适；并让 AI 写出“找不到时的分支输出”。自行运行验证。
:::

:::{admonition} 练习：查找操作
:class: important
设定 `msg="ALARM:GPS_LOST"`：

- 用 `find("GPS")` 输出位置
- 用 `find("BAT")` 输出位置
- 观察第二次结果并解释
  :::

:::{index} single: replace方法
:::
:::{index} single: 字符串替换
:::

## 4.1.5 任务五：字符串的替换操作

替换操作用于“清洗与规范化”，把不想要的符号替换为统一格式，`expandtabs` 用于把制表符 `\t` 展开成空格，便于对齐输出。
`replace` 像“把旧词批量换成新词”，`expandtabs` 像“把 tab 换成固定宽度空格”。

字符串替换方法如表4-4 所示。

<p align="center"><strong>表4-4  字符串替换方法</strong></p>

| 方法                  | 描述           | 简单示例                  | 结果要点 |
| --------------------- | -------------- | ------------------------- | -------- |
| `replace(old, new)` | 替换子串       | `"a a".replace(" ","")` | 删除空格 |
| `expandtabs(n)`     | tab 展开为空格 | `"a\tb".expandtabs(4)`  | 对齐显示 |

**例如：**

```python
alarm_line = "alarms:\tLOW_BATTERY, gps_lost ,LOW_BATTERY"
clean = alarm_line.replace(" ", "")  # 核心：删除空格
print("清洗前：", alarm_line)
print("清洗后：", clean)

tab_line = "key\tvalue\tunit"
print("tab 原始：", tab_line)
print("tab 展开：", tab_line.expandtabs(8))  # 核心：展开 tab
```

该示例用 `replace()` 删除多余空格，并用 `expandtabs()` 将 `\\t` 展开为空格，从而得到更规整的字符串输出。

:::{admonition} 【AI辅助小课堂】替换策略生成
:class: tip
把一行含多余空格的告警行发给 AI，让 AI 生成一段只用 `replace` 完成清洗的代码（不使用正则）。复制运行核对清洗结果。
:::

:::{admonition} 练习：替换操作
:class: important
设定 `uav_id="uav-07"`：

- 用 `replace("-", "_")` 得到 `uav_07` 并打印
- 把字符串 `"GPS\tOK"` 用 `expandtabs(4)` 展开后打印。要求代码可运行
  :::

:::{index} single: strip方法
:::
:::{index} single: 删除空白
:::

## 4.1.6 任务六：字符串的删除操作

删除操作用于清理字符串首尾的空白或指定字符。
`strip` 是“两头都清”，`lstrip` 只清左边，`rstrip` 只清右边。
它像把纸条两端多余的空边剪掉，让后续的比较与分割更稳定。

字符串删除方法如表4-5 所示。

<p align="center"><strong>表4-5 字符串删除方法</strong></p>

| 方法         | 描述       | 简单示例             | 结果     |
| ------------ | ---------- | -------------------- | -------- |
| `strip()`  | 去首尾空白 | `"  a \n".strip()` | `"a"`  |
| `lstrip()` | 去左侧空白 | `"  a ".lstrip()`  | `"a "` |
| `rstrip()` | 去右侧空白 | `" a  ".rstrip()`  | `" a"` |

**例如：**

```python
head = "  MIS-20251224-A03 | uav-07 | pilot=Li   "
head = head.strip()  # 核心：清理首尾空白

parts = [p.strip() for p in head.split("|")]
print(parts)
```

该示例先用 `strip()` 去掉字符串两端空白，再配合 `split()` 与列表推导对每个字段二次 `strip()`，得到干净的字段列表。

:::{admonition} 【AI辅助小课堂】strip 的边界
:class: tip
让 AI 解释：`strip()` 只删除两端字符，不会删除中间空格。用 `head="a  b"` 测试并核对。
:::

:::{admonition} 练习：删除操作
:class: important
设定 `text="   P3   "`：
分别用 `strip/lstrip/rstrip` 处理并打印结果，观察差异。要求代码可运行。
:::

## 4.1.7 任务七：字符串的测试操作

测试操作用于判断字符串是否满足某种性质：是否以某前缀开头、是否全是数字、是否是合法标识符、是否为空白、是否全大写等。
测试操作相当于“质检员”，对字符串打 True/False 的合格标记，帮助你快速判断能否进入下一步处理。

常用测试方法如表4-6 所示。

<p align="center"><strong>表4-6 常用测试方法</strong></p>

| 方法                   | 描述                     | 简单示例                        | 结果     |
| ---------------------- | ------------------------ | ------------------------------- | -------- |
| `startswith(prefix)` | 是否以 prefix 开头       | `"MIS-01".startswith("MIS-")` | `True` |
| `endswith(suffix)`   | 是否以 suffix 结尾       | `"UAV-07".endswith("07")`     | `True` |
| `isalpha()`          | 是否全字母               | `"GPS".isalpha()`             | `True` |
| `isdigit()`          | 是否全数字（常用）       | `"12".isdigit()`              | `True` |
| `isdecimal()`        | 是否十进制数字           | `"12".isdecimal()`            | `True` |
| `isnumeric()`        | 是否数字字符（范围更广） | `"12".isnumeric()`            | `True` |
| `isalnum()`          | 是否字母或数字           | `"A03".isalnum()`             | `True` |
| `isidentifier()`     | 是否合法标识符           | `"uav_07".isidentifier()`     | `True` |
| `islower()`          | 是否全小写               | `"gps".islower()`             | `True` |
| `isupper()`          | 是否全大写               | `"GPS".isupper()`             | `True` |
| `isspace()`          | 是否全空白               | `"   ".isspace()`             | `True` |
| `istitle()`          | 是否标题格式             | `"Low Battery".istitle()`     | `True` |
| `isprintable()`      | 是否可打印字符           | `"GPS_OK".isprintable()`      | `True` |

**例如：**

```python
mission_id = "MIS-20251224-A03"
uav_id = "UAV-07"
gps_sat_text = "12"

print("任务前缀检查：", mission_id.startswith("MIS-"))
print("无人机编号后缀检查：", uav_id.endswith("07"))
print("卫星数是否为数字：", gps_sat_text.isdigit())

candidate = uav_id.lower().replace("-", "_")
print("转为标识符：", candidate)
print("是否为合法标识符：", candidate.isidentifier())
```

该示例用 `startswith/endswith/isdigit/isidentifier` 对字符串做规则测试，并展示把字符串转换为候选标识符后再检验的思路。

:::{admonition} 【AI辅助小课堂】isdecimal / isdigit / isnumeric 对比
:class: tip
让 AI 用一句话说明三者区别（只需抓住“范围不同”即可），并给出 1 个可能出现差异的字符例子。可不运行，仅做理解对照。
:::

:::{admonition} 练习：测试操作
:class: important
设定 `alarm="LOW_BATTERY"`：

- 判断是否全大写（`isupper`）
- 把它变为小写后判断是否全小写（`islower`）
- 判断 `"UAV_07"` 是否为合法标识符（`isidentifier`）
  :::

## 4.1.8 任务八：字符串的大小写操作

大小写操作用于统一输出风格，把同一类文本转换为一致显示形式，便于阅读与对比。
它相当于“外观整理器”，把大小写混乱的内容整理成约定好的样子。

字符串大小写操作方法如表4-7 所示。

<p align="center"><strong>表4-7 大小写操作方法</strong></p>

| 方法             | 描述                 | 简单示例                    | 结果              |
| ---------------- | -------------------- | --------------------------- | ----------------- |
| `lower()`      | 全转小写             | `"UAV-07".lower()`        | `"uav-07"`      |
| `upper()`      | 全转大写             | `"uav-07".upper()`        | `"UAV-07"`      |
| `capitalize()` | 首字母大写，其余小写 | `"gps lost".capitalize()` | `"Gps lost"`    |
| `title()`      | 每个单词首字母大写   | `"low battery".title()`   | `"Low Battery"` |
| `swapcase()`   | 大小写互换           | `"Gps".swapcase()`        | `"gPS"`         |

**例如：**

```python
uav_id_raw = "uav-07"
alarm_raw = "gps_lost"

uav_id = uav_id_raw.upper()  # 核心：统一大写
alarm_show = alarm_raw.replace("_", " ").title()  # 核心：替换后 title

print("无人机编号：", uav_id)
print("告警显示：", alarm_show)

print("swapcase 演示：", uav_id.swapcase())
```

该示例将原始字符串通过 `upper()` 与 `replace()+title()` 规范化显示，并补充展示 `swapcase()` 的大小写互换效果。

:::{admonition} 【AI辅助小课堂】格式化表达式生成
:class: tip
把 `alarm_raw="low_battery"` 发给 AI，让 AI 生成一行代码把它转成 `"Low Battery"` 并打印（仅使用 replace + title）。复制运行核对。
:::

:::{admonition} 练习：大小写操作
:class: important
设定 `pilot="li"`：

- 用 `capitalize()` 输出 `Li`
- 设定 `zone="a03"`，用 `upper()` 输出 `A03`
  :::

# 4.2 项目二：无人机“任务口令台”——输入与格式化输出

**项目简介**

> 本项目通过 `input()` 采集任务参数，如任务编号、无人机编号、电量、计划高度、航点数、信号强度，并用 f-string 将这些数据按固定格式输出。输出强调“看得清、对得齐、能复核”，数字保留小数、字段列对齐、关键项填充强调、比例以百分比显示。

**项目定位**

> 本项目定位为"输入与格式化输出"的基础训练，覆盖：`input()` 的字符串输入、f-string 基本用法、数字格式化、对齐、填充与百分比显示。

**需求分析**

> 本项目编写脚本 `uav_console_brief.py` 需要完成以下功能：
> - 使用 `input()` 获取：`mission_id`、`uav_id`、`pilot`、`battery_percent`、`altitude_m`、`link_quality`（0~1）
> - 将数值输入转换为正确类型：电量用 `int()`，高度与链路质量用 `float()`
> - 使用 f-string 输出：　　　
  >- 基本简报行（插入变量）　　　
  >- 数字格式化（小数位、整数）　　　
  >- 表格对齐（左/右/居中）　　　
  >- 填充强调（用填充字符生成效果）　　　
  >- 百分比显示（把 0~1 转换为百分比格式）
> - 输出《任务口令简报》，内容可核对、排版清晰

**项目代码**

```python

# uav_console_brief.py
# 项目二：无人机“任务口令台”——输入与格式化输出


print("=== 无人机任务口令台 ===")

# 输入：input() 得到的都是字符串
mission_id = input("请输入任务编号（如 MIS-20251224-A03）：").strip()
uav_id = input("请输入无人机编号（如 UAV-07）：").strip()
pilot = input("请输入飞手姓名：").strip()

# 数值输入需要转换类型
battery_percent = int(input("请输入电池电量（整数0~100）：").strip())
altitude_m = float(input("请输入计划高度（单位m，可带小数）：").strip())
link_quality = float(input("请输入链路质量（0~1的小数，如0.86）：").strip())

print("\n" + "=" * 50)

# f-string：基本用法（直接把变量放进 {}）
print(f"任务编号：{mission_id}   无人机：{uav_id}   飞手：{pilot}")

# f-string：格式化数字（小数位控制）
print(f"计划高度：{altitude_m:.1f} m   电池电量：{battery_percent:d} %")

# f-string：对齐（生成“对齐表格”）
print("\n--- 参数对齐表 ---")
print(f'{"字段":<12}{"值":>12}')
print(f'{"mission_id":<12}{mission_id:>12}')
print(f'{"uav_id":<12}{uav_id:>12}')
print(f'{"battery":<12}{battery_percent:>12d}')
print(f'{"altitude(m)":<12}{altitude_m:>12.1f}')

# f-string：填充（用填充字符强调）
print("\n--- 填充强调 ---")
print(f"{'CHECK':*^50}")  # 居中并用 * 填充
print(f"电池电量：{battery_percent:03d}%")  # 宽度3，左侧用0填充

# f-string：百分比显示（0~1 -> 百分比）
print("\n--- 链路质量 ---")
print(f"链路质量：{link_quality:.0%}")      # 直接按百分比显示
print(f"链路质量：{link_quality:.2%}")      # 保留两位小数的百分比

print("=" * 50)
print("=== 简报输出完成 ===")
```

## 4.2.1 任务一：input 输入

`input()` 用于从键盘读取一行文本，是程序与用户交互的入口，返回值始终是字符串。
它像把用户输入递给程序的一张纸条，需要参与计算时再用 `int()` 或 `float()` 把纸条内容转换为数值。

**例如：**

```python
mission_id = input("请输入任务编号：").strip()  # 核心：去掉首尾空白
print("你输入的任务编号是：", mission_id)
```

该示例用 `input()` 读取一行输入并用 `strip()` 清理首尾空白，然后把结果打印出来确认输入内容。

:::{admonition} 【AI辅助小课堂】输入与类型判断
:class: tip
把“input 得到的一定是字符串”这句话发给 AI，让 AI 给出一个最短示例证明，并说明为什么需要 int/float 转换。复制运行验证。
:::

:::{admonition} 练习：input
:class: important
用 input 分别输入无人机编号与飞手姓名，去掉首尾空白后打印：
`UAV=xxx, PILOT=xxx`。
:::

## 4.2.2 任务二：f-strings 方法基本用法

f-string 是一种字符串格式化方式，用于把变量或表达式的结果嵌入到字符串中。
它像一段模板文本，`{}` 就是预留位置，运行时会把位置替换为实际值。

f-string 的语法格式可写作 `f"文本{变量}文本{表达式}文本"`。

**例如：**

```python
mission_id = "MIS-20251224-A03"
uav_id = "UAV-07"
pilot = "Li"

# 核心：变量嵌入
print(f"任务{mission_id}：无人机{uav_id}，飞手{pilot}")
```

该示例用 f-string 将多个变量嵌入到同一行字符串中，展示最基础的“模板填空式输出”写法。

:::{admonition} 【AI辅助小课堂】表达式嵌入
:class: tip
让 AI 把“电池 72% 时是否需要返航”写成一个 f-string 输出行，要求把比较表达式写在 `{}` 内。自行运行核对输出。
:::

:::{admonition} 练习：f-string 基本用法
:class: important
设定 `uav_id="UAV-19"`、`altitude_m=52.5`，用一条 f-string 输出：
`UAV-19 当前高度 52.5 m`。
:::

## 4.2.3 任务三：f-strings 格式化数字

数字格式化用于控制小数位、显示宽度等，使输出更统一。
f-string 的数字格式写作 `{变量:格式}`，花括号内冒号后的部分用于描述显示规则。
它像给数字套一个“显示规格”，同一批数据就能按同一标准输出。

<p align="center"><strong>表4-8 f-strings 格式化数字</strong></p>

| 格式     | 说明                       | 示例代码             | 输出效果   |
| -------- | -------------------------- | -------------------- | ---------- |
| `:.1f` | 浮点数保留 1 位小数        | `f"{3.14159:.1f}"` | `3.1`    |
| `:d`   | 按整数格式输出             | `f"{86:d}"`        | `86`     |
| `:.2f` | 浮点数保留 2 位小数        | `f"{3.14159:.2f}"` | `3.14`   |
| `:b`   | 以二进制形式输出整数       | `f"{10:b}"`        | `1010`   |
| `:o`   | 以八进制形式输出整数       | `f"{10:o}"`        | `12`     |
| `:x`   | 以十六进制（小写）输出整数 | `f"{255:x}"`       | `ff`     |
| `:X`   | 以十六进制（大写）输出整数 | `f"{255:X}"`       | `FF`     |
| `:,`   | 按千分位分隔显示数字       | `f"{12345:,}"`     | `12,345` |
| `:_`   | 按下划线分隔显示数字       | `f"{12345:_}"`     | `12_345` |

**例如：**

```python
altitude_m = 52.567
battery_percent = 86

# 核心：小数位控制 + 整数显示
print(f"高度：{altitude_m:.1f} m")
print(f"电量：{battery_percent:d} %")
```

该示例用 `:.1f` 控制浮点数小数位，并用 `:d` 按整数格式输出，体现“统一显示规格”的做法。

:::{admonition} 【AI辅助小课堂】精度对比预测
:class: tip
让 AI 写出 `:.1f` 与 `:.3f` 在同一个数值上的输出差异，并预测输出。运行示例核对。
:::

:::{admonition} 练习：数字格式化
:class: important
输入一个浮点数高度 `altitude_m`（用 float 转换），输出时保留 2 位小数：
`计划高度：xx.xx m`。
:::

## 4.2.4 任务四：f-strings 对齐

对齐用于控制输出的列宽与左右位置，让多行输出呈现出表格感，便于对照阅读。
它像排版时先定好列宽，再把每一行按同一规则放进对应列里。

对齐常用 `<` 左对齐、`>` 右对齐、`^` 居中，并配合宽度数字，例如 `:<10` 表示宽度 10 左对齐。

**例如：**

```python
mission_id = "MIS-20251224-A03"
uav_id = "UAV-07"
battery_percent = 86
altitude_m = 52.5

print(f'{"字段":<12}{"值":>16}')
print(f'{"mission_id":<12}{mission_id:>16}')
print(f'{"uav_id":<12}{uav_id:>16}')
print(f'{"battery(%)":<12}{battery_percent:>16d}')
print(f'{"altitude(m)":<12}{altitude_m:>16.1f}')
```

该示例通过指定列宽与左右对齐，把多行输出排成两列表格样式，便于逐行对照字段和值。

:::{admonition} 【AI辅助小课堂】对齐宽度调参
:class: tip
让 AI 把宽度从 12/16 改为 10/14，并预测表格是否还整齐。运行对比两次输出差异。
:::

:::{admonition} 练习：对齐输出
:class: important
输出一个两列表：左列为 `"uav_id"`，右列为你输入的无人机编号；左列宽度 12 左对齐，右列宽度 12 右对齐。
:::

## 4.2.5 任务五：f-strings 填充

填充用于在对齐的同时用指定字符补齐空位，让标题或分隔行更醒目。
它像在标题两侧自动补上一排装饰符号，视觉上更容易定位重点。

填充格式可写作 `{text:*^20}`，其中 `*` 是填充字符，`^` 是居中对齐，`20` 是总宽度。

**例如：**

```python
battery_percent = 7

print(f"{'CHECK':*^30}")      # 核心：填充 + 居中
print(f"电池电量：{battery_percent:03d}%")  # 核心：宽度3，左侧补0
```

该示例同时演示字符串居中填充（生成强调标题）与数字补零（固定宽度显示）的两种常见格式化技巧。

:::{admonition} 【AI辅助小课堂】填充字符替换
:class: tip
让 AI 把 `*` 改成 `-`，并预测输出效果。运行核对。
:::

:::{admonition} 练习：填充
:class: important
设定 `mission_id` 为你输入的任务编号，用 `=` 作为填充字符，把标题居中输出到宽度 40：
例如：`========== MIS-... ==========`。
:::

## 4.2.6 任务六：f-strings 显示百分比

f-string 的百分比格式用于把 0~1 的小数按百分比形式输出。
它会自动乘以 100 并追加 `%`，再按指定的小数位数显示，例如 `0.86` 用 `:.0%` 会显示为 `86%`。

可以把它理解为“自动换算并加单位”，把比例值直接变成更直观的百分比文本。

**例如：**

```python
link_quality = 0.8632

print(f"链路质量：{link_quality:.0%}")  # 核心：百分比显示
print(f"链路质量：{link_quality:.2%}")  # 核心：保留两位小数的百分比
```

该示例用 `:.0%` 与 `:.2%` 将 0~1 的小数按百分比形式输出，并对比不同小数位精度的显示差异。

:::{admonition} 【AI辅助小课堂】百分比反推
:class: tip
让 AI 根据输出 `86%` 反推 `link_quality` 可能是多少，并说明为什么会有四舍五入。运行示例核对。
:::

:::{admonition} 练习：百分比显示
:class: important
用 input 输入链路质量 `link_quality`（0~1），用 f-string 输出为百分比（保留 1 位小数）：
例如 `链路质量：86.3%`。
:::

# 4.3 项目三：无人机“载荷与航点清单管理器”——列表与元组

**项目简介**

> 本项目维护 `waypoints`，载荷/传感器检查清单 `payload_tasks`，返航点坐标 `home_point`三组数据航点清单。程序通过若干可直接运行的代码段展示列表的“运算符、替换、删除、添加、反转”以及元组的“可读但不可改”。

**项目定位**

> 本项目定位为"序列容器的编辑能力训练"，重点训练你对序列的读取、修改与重组能力，能熟练使用索引与切片定位数据，掌握 `append/extend/insert/pop/remove/clear/sort/reverse` 等列表原地操作，并理解拷贝与引用带来的共享修改问题。同时借助元组的不可变特性建立“固定记录”和“可编辑容器”的边界意识，掌握打包与解包、单元素元组写法等细节，避免把元组当列表去修改而报错。


**需求分析**

> 本项目编写脚本 `uav_list_manager.py` 需要完成以下功能：
> - 准备两类列表：航点列表 `waypoints` 与检查项列表 `payload_tasks`
> - 用 `+`、`*`、`in` 完成列表拼接、倍增与成员判断
> - 演示列表替换：单个下标替换与切片替换
> - 演示列表删除：`del`、`remove`、`pop`、`clear`
> - 演示列表添加：`append`、`insert`、`copy`（复制清单进行对比）
> - 演示 `reverse()` 反转航点顺序
> - 用元组保存 `home_point`，并演示“不可修改”的特点

**项目代码**

```python

# uav_list_manager.py
# 项目三：无人机“载荷与航点清单管理器”——列表与元组

print("=== 清单变更日志：开始 ===")

# 返航点坐标：元组（不可变），用于保存“约束参数”
home_point = (28.2280, 112.9388)

# 航点清单：列表（可变），用于保存“可编辑的执行顺序”
waypoints = ["WP-01", "WP-02", "WP-03"]

# 载荷/传感器检查项：列表（可变）
payload_tasks = ["GPS", "IMU", "Camera"]

print("\n[初始数据]")
print("home_point =", home_point)
print("waypoints  =", waypoints)
print("tasks      =", payload_tasks)

# 列表运算符（+、*、in）
print("\n[任务1：列表运算符 +、*、in]")
backup_points = ["WP-B1", "WP-B2"]
all_points = waypoints + backup_points          # 核心：列表拼接 +
repeat_check = ["Compass"] * 3                  # 核心：列表倍增 *
has_camera = "Camera" in payload_tasks          # 核心：成员判断 in
print("all_points =", all_points)
print("repeat_check =", repeat_check)
print("是否包含 Camera？", has_camera)

# 列表替换（单个替换、切片替换）
print("\n[任务2：列表替换]")
tasks_edit = payload_tasks.copy()               # 核心：复制一份再改，不影响原列表
tasks_edit[1] = "Barometer"                     # 核心：单个替换
print("单个替换后 tasks_edit =", tasks_edit)

# 切片替换：把第 1~2 个位置替换为两个新项
tasks_edit[0:2] = ["GPS", "RTK"]                # 核心：切片替换
print("切片替换后 tasks_edit =", tasks_edit)

# 列表删除（del、remove、pop、clear）
print("\n[任务3：列表删除 del/remove/pop/clear]")

# del：按下标删除
points_del = waypoints.copy()
del points_del[0]                               # 核心：删除第 0 个元素
print("del 删除后 points_del =", points_del)

# remove：按值删除（只删除第一个匹配项）
tasks_remove = ["GPS", "IMU", "IMU", "Camera"]
tasks_remove.remove("IMU")                      # 核心：按值删除一个 IMU
print("remove 删除后 tasks_remove =", tasks_remove)

# pop：弹出指定下标（并返回弹出的值）
tasks_pop = payload_tasks.copy()
removed_item = tasks_pop.pop(0)                 # 核心：弹出第 0 项
print("pop 弹出项 removed_item =", removed_item)
print("pop 后 tasks_pop =", tasks_pop)

# clear：清空列表
temp_list = ["A", "B"]
temp_list.clear()                               # 核心：清空
print("clear 后 temp_list =", temp_list)

# 列表添加（append、insert、copy）
print("\n[任务4：列表添加 append/insert/copy]")

points_add = waypoints.copy()
points_add.append("WP-04")                      # 核心：尾部追加
print("append 后 points_add =", points_add)

points_add.insert(1, "WP-01A")                  # 核心：指定位置插入
print("insert 后 points_add =", points_add)

points_copy = points_add.copy()                 # 核心：复制
points_copy.append("WP-05")                     # 修改副本
print("原 points_add =", points_add)
print("副本 points_copy =", points_copy)

# 列表反转（reverse）
print("\n[任务5：列表反转 reverse]")

route = points_add.copy()
route.reverse()                                 # 核心：就地反转
print("反转后 route =", route)

# 元组操作与限制
print("\n[任务6：元组操作与限制]")

print("home_point 元组可读取：纬度 =", home_point[0], "经度 =", home_point[1])
print("尝试修改元组会报错（已注释掉示例）：")
# home_point[0] = 0.0  # 元组不可变：这行若取消注释将触发 TypeError

print("\n=== 清单变更日志：结束 ===")
```

:::{index} single: 列表运算符
:::
:::{index} single: 列表拼接
:::

## 4.3.1 任务一：列表的运算符操作

列表运算符 `+`、`*`、`in` 分别用于拼接列表、重复元素序列与成员判断，能快速得到新的列表或布尔结果。
可以把它理解为合并两张清单、把同一项复印多份、以及核对某项是否在清单里。

列表运算符操作如表4-9所示。

<p align="center"><strong>表4-9 列表运算符操作</strong></p>

| 操作   | 含义     | 示例                       | 结果示例                |
| ------ | -------- | -------------------------- | ----------------------- |
| `+`  | 列表拼接 | `["WP-01"] + ["WP-02"]`  | `["WP-01","WP-02"]`   |
| `*`  | 列表倍增 | `["IMU"] * 3`            | `["IMU","IMU","IMU"]` |
| `in` | 成员判断 | `"GPS" in ["GPS","IMU"]` | `True`                |

**例如：**

```python
waypoints = ["WP-01", "WP-02"]
backup_points = ["WP-B1"]
tasks = ["GPS", "IMU", "Camera"]

all_points = waypoints + backup_points     # 核心：拼接
repeat_task = ["Compass"] * 2              # 核心：倍增
print("组合航点：", all_points)
print("重复检查项：", repeat_task)
print("是否包含 Camera：", "Camera" in tasks)  # 核心：成员判断
```

该示例用 `+` 拼接两个列表、用 `*` 生成重复清单，并用 `in` 判断某个元素是否在列表中。

:::{admonition} 【AI辅助小课堂】输出预测
:class: tip
把 `waypoints=["WP-01","WP-02"]`、`backup_points=["WP-B1"]`、`tasks=["GPS","IMU","Camera"]` 发给 AI，让 AI 逐行写出示例的输出结果并解释原因。运行核对。
:::

:::{admonition} 练习：列表运算符
:class: important
设定 `tasks=["GPS","IMU"]`，再定义 `extra=["Camera"]`：

- 用 `+` 合并成 `all_tasks` 并打印
- 用 `in` 判断 `"RTK"` 是否在 `all_tasks` 并打印结果
- 用 `*` 生成 `["CHECK"]` 重复 4 次的列表并打印
  :::

## 4.3.2 任务二：列表的替换操作

列表替换用于修改列表中的元素，可以按单个下标替换，也可以按切片范围批量替换。它像在清单上改字，既可以改某一项，也可以把一段连续条目整段换成新条目。

- 单个替换通过下标定位：`lst[i] = 新值`
- 切片替换通过范围定位：`lst[a:b] = 新列表`，切片替换可以改变列表长度

列表替换操作如表4-10 所示。

<p align="center"><strong>表4-10 列表替换操作</strong></p>

| 替换类型 | 写法                 | 示例                         | 结果示例               |
| -------- | -------------------- | ---------------------------- | ---------------------- |
| 单个替换 | `lst[i] = x`       | `tasks[1]="RTK"`           | 第二项被改为 `"RTK"` |
| 切片替换 | `lst[a:b] = [...]` | `tasks[0:2]=["GPS","RTK"]` | 前两项整体替换         |

**例如：**

```python
payload_tasks = ["GPS", "IMU", "Camera"]

tasks_edit = payload_tasks.copy()   # 核心：复制后修改
tasks_edit[1] = "Barometer"         # 核心：单个替换
print("单个替换后：", tasks_edit)

tasks_edit[0:2] = ["GPS", "RTK"]    # 核心：切片替换
print("切片替换后：", tasks_edit)

print("原始清单仍为：", payload_tasks)
```

该示例先 `copy()` 复制列表，再分别用下标替换与切片替换修改副本，展示替换方式不同但都能直接改写列表内容。

:::{admonition} 【AI辅助小课堂】切片替换长度变化
:class: tip
让 AI 给出一个“切片替换导致列表变长/变短”的最短示例，并预测结果。复制运行核对。
:::

:::{admonition} 练习：列表替换
:class: important
设定 `waypoints=["WP-01","WP-02","WP-03","WP-04"]`：

- 把 `WP-02` 单个替换为 `WP-02A`
- 把中间两项（原下标 1 到 3 前）切片替换为 `["WP-X","WP-Y"]`
  打印替换后的列表。
  :::

:::{index} single: 列表删除
:::
:::{index} single: del语句
:::
:::{index} single: remove方法
:::
:::{index} single: pop方法
:::

## 4.3.3 任务三：列表的删除操作

列表删除操作用于移除元素或清空列表，既可以按位置删除，也可以按值删除，还可以弹出元素并拿到返回值。它像从清单中划掉条目，或把最后一项取出来单独处理。

- `del` 按下标删除；`remove` 按值删除（只删第一个匹配）
- `pop` 弹出并返回元素；`clear` 清空列表

列表删除操作如表4-11 所示。

<p align="center"><strong>表4-11 列表删除操作</strong></p>

| 方法/语句     | 作用             | 示例                    | 结果示例             |
| ------------- | ---------------- | ----------------------- | -------------------- |
| `del`       | 按下标删除       | `del waypoints[0]`    | 删除第 0 项          |
| `remove(x)` | 按值删除（首个） | `tasks.remove("IMU")` | 删除第一个 `"IMU"` |
| `pop(i)`    | 弹出并返回       | `x=tasks.pop(1)`      | 返回被弹出的元素     |
| `clear()`   | 清空列表         | `tasks.clear()`       | `[]`               |

**例如：**

```python
waypoints = ["WP-01", "WP-02", "WP-03"]
tasks = ["GPS", "IMU", "IMU", "Camera"]

# del：按下标删除
points_del = waypoints.copy()
del points_del[0]                 # 核心：删除第 0 项
print("del 后：", points_del)

# remove：按值删除一个
tasks_remove = tasks.copy()
tasks_remove.remove("IMU")        # 核心：只删除第一个 IMU
print("remove 后：", tasks_remove)

# pop：弹出并返回
tasks_pop = ["GPS", "IMU", "Camera"]
removed = tasks_pop.pop(1)        # 核心：弹出下标1
print("pop 弹出：", removed)
print("pop 后：", tasks_pop)

# clear：清空
temp = ["A", "B"]
temp.clear()                      # 核心：清空
print("clear 后：", temp)
```

该示例对比 `del/remove/pop/clear` 四种删除方式，展示按下标删除、按值删除、弹出返回值与清空容器的差异。

:::{admonition} 【AI辅助小课堂】remove 与 del 的适用场景
:class: tip
让 AI 用一句话区分 `del` 与 `remove` 的“定位方式”，并给出各自最适合的无人机场景示例。运行上面代码核对理解。
:::

:::{admonition} 练习：列表删除
:class: important
给定 `alarms=["LOW_BATT","GPS_WEAK","GPS_WEAK","TEMP_HIGH"]`：

- 用 `remove` 删除一个 `"GPS_WEAK"`
- 用 `pop` 弹出最后一个告警并打印弹出的值
- 最后用 `clear` 清空列表并打印
  :::

:::{index} single: 列表添加
:::
:::{index} single: append方法
:::
:::{index} single: insert方法
:::

## 4.3.4 任务四：列表的添加操作

列表添加用于扩展列表，既可以在末尾追加，也可以在指定位置插入，还可以复制一份再修改以便对照。
它像在清单末尾加一项，或把一项插到中间位置，同时保留一份原清单不被影响。

列表添加/复制操作如表4-12 所示。

<p align="center"><strong>表4-12 列表添加/复制操作</strong></p>

| 方法            | 作用         | 示例                       | 结果示例    |
| --------------- | ------------ | -------------------------- | ----------- |
| `append(x)`   | 末尾追加     | `wps.append("WP-04")`    | 在尾部增加  |
| `insert(i,x)` | 指定位置插入 | `wps.insert(1,"WP-01A")` | 插入到下标1 |
| `copy()`      | 浅复制列表   | `new=wps.copy()`         | 得到新列表  |

**例如：**

```python
waypoints = ["WP-01", "WP-02", "WP-03"]

plan_a = waypoints.copy()          # 核心：复制成方案A
plan_a.append("WP-04")             # 核心：追加
print("plan_a：", plan_a)

plan_b = waypoints.copy()          # 核心：复制成方案B
plan_b.insert(1, "WP-01A")         # 核心：插入
print("plan_b：", plan_b)

print("原 waypoints：", waypoints)  # 原始清单未被修改
```

该示例用 `copy()` 先复制原列表，再分别用 `append()` 追加与 `insert()` 插入，展示“在不影响原列表的前提下生成不同方案”。

:::{admonition} 【AI辅助小课堂】copy 的必要性
:class: tip
让 AI 说明：如果不 copy，直接 `plan_a = waypoints` 会发生什么，并给出一个最短示例验证。运行核对。
:::

:::{admonition} 练习：列表添加
:class: important
设定 `tasks=["GPS","IMU"]`：

- 用 `append` 追加 `"Camera"`
- 用 `insert` 在最前面插入 `"Battery"`
- 用 `copy` 复制到 `tasks_backup` 并打印两者
  :::

:::{index} single: reverse方法
:::
:::{index} single: 列表反转
:::

## 4.3.5 任务五：列表的反转操作

反转用于把列表顺序倒过来，常用于需要从末尾开始处理的场景。
`reverse()` 会在原列表上就地反转，不产生新列表。若需要保留原顺序，应先 `copy()` 再反转。

**例如：**

```python
waypoints = ["WP-01", "WP-02", "WP-03", "WP-04"]

route = waypoints.copy()   # 核心：保留原清单
route.reverse()            # 核心：就地反转
print("原顺序：", waypoints)
print("反转后：", route)
```

该示例先复制列表再调用 `reverse()`，展示反转会就地修改列表，因此保留原顺序时需要先复制一份。

:::{admonition} 【AI辅助小课堂】反转后的首尾变化
:class: tip
让 AI 写出反转前后“第一项/最后一项”分别是谁，并解释 `reverse()` 是否返回新列表。运行核对。
:::

:::{admonition} 练习：reverse
:class: important
给定 `waypoints=["WP-A","WP-B","WP-C"]`：
复制为 `return_route`，对 `return_route` 执行 `reverse()` 并打印两者。
:::

## 4.3.6 任务六：元组操作

元组用于保存“不希望被修改”的一组数据，可索引、可切片、可遍历，但不能像列表那样增删改。
它像一条固定记录，适合用于写下后不再改动的坐标或参数组合。

元组与列表的关键区别是：

- 列表可变：支持替换、追加、删除
- 元组不可变：不支持 `t[i]=...`、`append`、`remove` 等修改操作
  元组更适合保存“约束参数”。

**例如：**

```python
home_point = (28.2280, 112.9388)

# 核心：元组可读取
lat = home_point[0]
lon = home_point[1]
print("返航点纬度：", lat)
print("返航点经度：", lon)

# 核心：元组不可修改（取消注释将报错 TypeError）
# home_point[0] = 0.0
```

该示例通过索引读取元组元素，并用注释说明元组不支持元素赋值，从而体现“可读不可改”的特性。

:::{admonition} 【AI辅助小课堂】元组适用场景归纳
:class: tip
让 AI 用“2 条规则”归纳：什么时候用列表、什么时候用元组，并各给出一个无人机数据示例。把示例复制到本机运行验证。
:::

:::{admonition} 练习：元组操作
:class: important
创建元组 `area_corner = (28.2280, 112.9388)`：

- 打印第 1 个元素与第 2 个元素
- 尝试写一行修改语句（用注释保留，不要执行），并在旁边写清“为什么不能改”
  :::

---

# 4.4 项目四：无人机“状态参数表与告警集合管理器” ——字典和集合

**项目简介**

> 本项目脚本维护两类核心数据：`status`：无人机状态字典，键为参数名（字符串），值为数值或文本；`alarm_set`：告警集合，用于保存不重复的告警代码。程序通过一组可直接运行的代码段输出“管理日志”，对照展示字典与集合的查找、插入、删除、替换与成员判断。

**项目定位**

>  本项目定位为"映射与集合容器"的实用训练，重点建立“按键访问”与“元素去重/成员判断”的数据思维。字典侧重把零散字段组织成结构化记录，训练 `in/get/keys/values/items` 的读取方式与插入、替换、删除等维护操作，并理解键必须唯一这一约束。集合侧重处理“不重复的元素集合”，训练 `add/remove/discard` 等操作与 `in` 的快速成员判断，用于实现去重、黑名单/白名单检查等常见逻辑。



**需求分析**

> 本项目编写脚本 `uav_dict_set_manager.py` 需要完成以下功能：
> - 创建并打印 `status`（字典）与 `alarm_set`（集合）
> - 字典：用 `in` 判断键是否存在；使用 `keys()`、`values()`、`items()`、`get()` 查找；完成插入、删除与替换
> - 集合：用 `in` 判断元素是否存在；完成添加与删除操作
> - 输出日志需包含关键步骤标题，便于核对结果

**项目代码**

```python

# uav_dict_set_manager.py
# 项目四：无人机“状态参数表与告警集合管理器”——字典与集合

print("=== 状态参数与告警管理日志：开始 ===")

# -----------------------------
# 数据准备：字典 + 集合
# -----------------------------
status = {
    "uav_id": "UAV-07",
    "battery_percent": 86,
    "gps_satellites": 12,
    "altitude_m": 52.5
}

# 告警集合：用于去重与快速判断
alarm_set = {"LOW_BATT", "GPS_WEAK"}  # 集合天然去重

print("\n[初始数据]")
print("status   =", status)
print("alarms   =", alarm_set)

print("\n=== 状态参数与告警管理日志：结束 ===")
```

## 4.4.1 任务一：字典的运算符操作

字典用于保存键和值的对应关系，通过键快速取到值。
它像一张“标签—内容”对照表，先确认标签是否存在，再读取对应内容。

`in` 用于判断“键是否在字典中”。

- 对字典使用 `in`，判断的是**键**，不是值
- `"battery_percent" in status` 表示“字典里是否有这个键”

**例如：**

```python
status = {"uav_id": "UAV-07", "battery_percent": 86}

print("battery_percent 是否存在？", "battery_percent" in status)  # True
print("home_point 是否存在？", "home_point" in status)            # False
```

该示例展示对字典使用 `in` 时判断的是键是否存在，并通过两个不同键名对比 True/False 的结果。

:::{admonition} 【AI辅助小课堂】in 判断的是键还是值？
:class: tip
把示例字典发给 AI，让 AI 判断 `in` 检查的是“键”还是“值”，并写出一个最短验证代码。复制运行核对。
:::

:::{admonition} 练习：字典 in操作
:class: important
创建字典 `status={"battery_percent": 50, "gps_satellites": 9}`：
分别判断 `"battery_percent"` 与 `"altitude_m"` 是否在 `status` 中，并打印结果。
:::

## 4.4.2 任务二：字典的查找操作

字典查找用于查看键、值与键值对，并支持安全取值。它像翻目录，既能看有哪些栏目，也能在栏目缺失时给一个默认值避免报错。

- `keys()`：查看所有键
- `values()`：查看所有值
- `items()`：查看键值对（键, 值）
- `get(key, default)`：安全取值，键不存在则返回默认值

字典查找操作速查如表4-13 所示。

<p align="center"><strong>表4-13 字典查找操作</strong></p>

| 操作              | 含义       | 示例                           | 结果示例               |
| ----------------- | ---------- | ------------------------------ | ---------------------- |
| `d.keys()`      | 获取全部键 | `status.keys()`              | `dict_keys([...])`   |
| `d.values()`    | 获取全部值 | `status.values()`            | `dict_values([...])` |
| `d.items()`     | 获取键值对 | `status.items()`             | `dict_items([...])`  |
| `d.get(k,默认)` | 安全取值   | `status.get("altitude_m",0)` | `0`（若缺失）        |

**例如：**

```python
status = {
    "uav_id": "UAV-07",
    "battery_percent": 86,
    "gps_satellites": 12
}

print("keys  =", list(status.keys()))
print("values=", list(status.values()))
print("items =", list(status.items()))

# get：安全取值，缺失时返回默认值
alt = status.get("altitude_m", 0.0)
print("altitude_m =", alt)
```

该示例用 `keys/values/items` 查看字典内容，并用 `get(key, default)` 在键缺失时返回默认值以避免 `KeyError`。

:::{admonition} 【AI辅助小课堂】get 的默认值设计
:class: tip
让 AI 给出“无人机状态字段缺失时”的 3 个默认值设计（例如高度、电量、卫星数），并说明理由。把默认值写进 get 调用中运行核对。
:::

:::{admonition} 练习：字典查找
:class: important
给定：

```python
status = {"uav_id": "UAV-19", "battery_percent": 72}
```

- 打印 `keys()` 的列表形式
- 用 `get()` 获取 `gps_satellites`，缺失时默认返回 `0`
- 打印 `items()` 的列表形式
  :::

## 4.4.3 任务三：字典的插入操作

插入用于向字典新增键值对。
它像在表格里新增一个字段，键不存在就新增，键已存在就会覆盖原值（覆盖属于“替换”，见后续任务）。

向字典插入键值对最常见写法是 `d[new_key] = value`。

**例如：**

```python
status = {"uav_id": "UAV-07", "battery_percent": 86}

# 核心：插入新键值对
status["is_armed"] = True
status["mode"] = "AUTO"

print(status)
```

该示例通过 `d[key] = value` 为字典新增键值对，展示插入新字段后字典内容随之扩展。

:::{admonition} 【AI辅助小课堂】字段命名统一
:class: tip
把“电量、高度、卫星数、是否解锁、飞行模式”发给 AI，让 AI 输出推荐的 snake_case 键名，并生成一段插入代码。复制运行核对。
:::

:::{admonition} 练习：字典插入
:class: important
创建 `status={"uav_id":"UAV-01"}`：
插入 `battery_percent` 与 `gps_satellites` 两个字段并打印字典。
:::

## 4.4.4 任务四：字典的删除操作

删除用于移除指定键或清空整个字典，也可以在删除时拿到被删除的值。
它像把表格中的某一项取走，或把整张表清空后重新开始。
表4-14 列出了常用的字典删除操作。

<p align="center"><strong>表4-14 字典删除操作</strong></p>

| 操作            | 含义               | 示例                   | 结果示例            |
| --------------- | ------------------ | ---------------------- | ------------------- |
| `d.pop(k)`    | 删除指定键并返回值 | `status.pop("mode")` | 返回 `"AUTO"`     |
| `d.popitem()` | 删除并返回一对键值 | `status.popitem()`   | 返回 `("gps",12)` |
| `d.clear()`   | 清空字典           | `status.clear()`     | `{}`              |

**例如：**

```python
status = {
    "uav_id": "UAV-07",
    "battery_percent": 86,
    "mode": "AUTO"
}

# pop：删除指定键并返回值
removed_mode = status.pop("mode")
print("pop 返回：", removed_mode)
print("pop 后 status：", status)

# popitem：删除并返回一个键值对
removed_pair = status.popitem()
print("popitem 返回：", removed_pair)
print("popitem 后 status：", status)

# clear：清空
status.clear()
print("clear 后 status：", status)
```

该示例对比 `pop/popitem/clear` 三种删除方式，展示删除指定键、删除任意一项以及清空字典的行为差异。

:::{admonition} popitem 的不确定性提示
:class: warning
`popitem()` 删除的是字典中的“一个项”。在不同场景下不应依赖它来删除“特定键”。需要删除特定键时应使用 `pop(key)`。
:::

:::{admonition} 练习：字典删除
:class: important
给定：

```python
status = {"uav_id":"UAV-07","battery_percent":86,"gps_satellites":12}
```

- 用 `pop` 删除 `battery_percent` 并打印返回值
- 再用 `clear` 清空字典并打印
  :::

## 4.4.5 任务五：字典的替换操作

替换用于更新某个键对应的值，写法仍是 `d[key] = value`。它像把表格中某个字段的内容改成新值，用同一个键覆盖旧数据。

- 对字典写 `d[key] = value`：
- 若键不存在：插入
- 若键存在：替换旧值（更新）

**例如：**

```python
status = {"uav_id": "UAV-07", "battery_percent": 86, "mode": "AUTO"}

# 核心：替换（更新）已有字段
status["battery_percent"] = 83
status["mode"] = "RTH"  # 返航模式

print(status)
```

该示例通过对已存在的键重新赋值来更新字典字段，体现“同样的写法既能插入也能覆盖更新”的规则。

:::{admonition} 【AI辅助小课堂】更新前后对照输出
:class: tip
让 AI 把“更新前字典、更新语句、更新后字典”按三段输出，并预测最终结果。运行核对。
:::

:::{admonition} 练习：字典替换
:class: important
创建 `status={"battery_percent":30,"mode":"AUTO"}`：
把电量替换为 `25`，把模式替换为 `"LAND"`，并打印更新后的字典。
:::

## 4.4.6 任务六：集合的运算符操作

集合适合保存不重复元素，并支持快速判断某元素是否存在。
它像一份“唯一名单”，同一个元素只会出现一次，查询时只关心有没有。

`x in set_obj` 的结果是布尔值。集合不关心顺序，关心“有没有”。

**例如：**

```python
alarm_set = {"LOW_BATT", "GPS_WEAK"}

print("是否出现 LOW_BATT？", "LOW_BATT" in alarm_set)
print("是否出现 TEMP_HIGH？", "TEMP_HIGH" in alarm_set)
```

该示例用 `in` 对集合做成员判断，展示集合查询只关心“是否存在”，不关心顺序。

:::{admonition} 【AI辅助小课堂】集合与列表判断对比
:class: tip
让 AI 用一句话说明“为什么集合适合做告警是否出现的判断”，并给出一个集合去重的小例子。复制运行核对。
:::

:::{admonition} 练习：集合 in操作
:class: important
创建集合 `alarm_set={"GPS_WEAK","TEMP_HIGH"}`：
判断 `"TEMP_HIGH"` 与 `"LOW_BATT"` 是否在显示集合中，并打印结果。
:::

## 4.4.7 任务七：集合的删除操作

集合删除操作用于移除元素或清空集合。
它像从名单里划掉某个名字，或把整张名单清空重新开始。

表4-15列出集合常用的删除操作。

<p align="center"><strong>表4-15 集合删除操作</strong></p>

| 操作           | 含义                 | 示例               | 说明           |
| -------------- | -------------------- | ------------------ | -------------- |
| `remove(x)`  | 删除元素（必须存在） | `s.remove("A")`  | 不存在会报错   |
| `discard(x)` | 删除元素（可不存在） | `s.discard("A")` | 更安全         |
| `pop()`      | 弹出一个元素并返回   | `x=s.pop()`      | 不保证顺序     |
| `clear()`    | 清空集合             | `s.clear()`      | 变成 `set()` |

**例如：**

```python
alarm_set = {"LOW_BATT", "GPS_WEAK", "TEMP_HIGH"}

# discard：更安全，元素不存在也不报错
alarm_set.discard("GPS_WEAK")
print("discard 后：", alarm_set)

# remove：元素必须存在
alarm_set.remove("LOW_BATT")
print("remove 后：", alarm_set)

# pop：弹出一个元素（不保证是哪一个）
popped_alarm = alarm_set.pop()
print("pop 弹出：", popped_alarm)
print("pop 后：", alarm_set)

# clear：清空
alarm_set.clear()
print("clear 后：", alarm_set)
```

该示例对比 `discard/remove/pop/clear`，展示安全删除与强制删除的差异，以及 `pop()` 弹出元素的不确定性。

:::{admonition} remove 与 discard 的区别提示
:class: warning
若不确定元素是否存在，优先使用 `discard()`；`remove()` 在元素不存在时会触发异常。
:::

:::{admonition} 练习：集合删除
:class: important
创建 `alarm_set={"GPS_WEAK","LOW_BATT"}`：
1）用 `discard` 删除 `"TEMP_HIGH"`（该元素不存在也不应报错）；
2）再用 `remove` 删除 `"LOW_BATT"`；
3）最后 `clear` 清空并打印。
:::

## 4.4.8 任务八：集合的添加操作

集合添加操作用于向集合加入一个元素或批量合并多个元素，集合会自动去重。
它像把新条目加入“唯一名单”，重复条目会被自动忽略。

表4-16列出集合常用的添加操作。

<p align="center"><strong>表4-16 集合添加操作</strong></p>

| 操作            | 含义         | 示例                    | 结果示例           |
| --------------- | ------------ | ----------------------- | ------------------ |
| `add(x)`      | 添加一个元素 | `s.add("A")`          | 集合中出现 `"A"` |
| `update(...)` | 批量添加     | `s.update(["A","B"])` | 同时加入多个元素   |

**例如：**

```python
alarm_set = {"GPS_WEAK"}

# add：添加一个告警
alarm_set.add("LOW_BATT")
print("add 后：", alarm_set)

# update：批量添加（自动去重）
new_alarms = ["TEMP_HIGH", "GPS_WEAK"]  # GPS_WEAK 重复
alarm_set.update(new_alarms)
print("update 后：", alarm_set)
```

该示例对比 `add()` 单个添加与 `update()` 批量合并，并通过重复元素说明集合会自动去重。

:::{admonition} 【AI辅助小课堂】去重效果验证
:class: tip
让 AI 预测 `update` 后集合里会有哪些元素，并解释“为什么不会重复”。运行示例核对。
:::

:::{admonition} 练习：集合添加
:class: important
创建 `alarm_set=set()`：

- 用 `add` 加入 `"LOW_BATT"`
- 再用 `update` 加入列表 `["GPS_WEAK","TEMP_HIGH","LOW_BATT"]`
  打印集合，观察是否去重。
  :::

# 4.5 项目五：无人机“飞行日志批处理器”——列表解析、迭代与应用

**项目简介**

> 本项目使用 4 组基础日志列表：`times`（时间点字符串）、`altitudes`（高度采样）、`batteries`（电量采样）、`alarms`（告警标记）。程序先演示这些对象为何属于可迭代对象；再通过列表解析生成派生字段（如“低电量标记”“高度四舍五入”）；用 `zip()` 把多列对齐成“记录列表”；最后用 `map()` 与 `filter()` 对记录进行转换与筛选，形成可核对的批处理输出。

**项目定位**

> 本项目定位为"序列数据批处理"的入门实践：用**可迭代对象**统一理解"能被 for 逐个取出元素"的数据；用**列表解析**快速生成派生列表/集合/字典；用 `zip()` 对齐多列日志生成记录；用 `map()` 做批量转换；用 `filter()` 做条件筛选。

**需求分析**

> 本项目编写脚本 `uav_log_batch.py` 需要完成以下功能：
> - 准备 4 列日志数据：时间、高度、电量、告警
> - 可迭代对象演示：用 for 遍历列表、字符串、字典
> - 列表解析：生成低电量标记列表、筛选正常高度列表、生成字典/集合等
> - `zip()`：对齐多列日志生成记录（元组列表）
> - `map()`：把电量从整数转换为“百分号字符串”
> - `filter()`：筛选出“低电量或有告警”的记录
> - 输出《飞行日志批处理报告》，每一段结果能直接核对

**项目代码**

```python

# uav_log_batch.py
# 项目五：无人机“飞行日志批处理器”


print("=== 飞行日志批处理报告：开始 ===")

# 原始日志数据（均为可迭代对象）
times = ["10:00", "10:01", "10:02", "10:03", "10:04"]
altitudes = [12.4, 15.8, 18.2, 17.9, 16.1]
batteries = [98, 94, 90, 86, 82]
alarms = ["OK", "OK", "GPS_WEAK", "OK", "LOW_BATT"]

print("\n[原始数据]")
print("times     =", times)
print("altitudes =", altitudes)
print("batteries =", batteries)
print("alarms    =", alarms)

# 列表解析：派生字段
low_batt_flags = [b < 90 for b in batteries]          # True/False 列表
alt_rounded = [round(a, 1) for a in altitudes]        # 四舍五入
ok_altitudes = [a for a in altitudes if a >= 15.0]    # 带条件筛选

print("\n[列表解析结果]")
print("low_batt_flags =", low_batt_flags)
print("alt_rounded    =", alt_rounded)
print("ok_altitudes   =", ok_altitudes)

# zip：对齐多列日志生成记录（元组列表）
records = list(zip(times, altitudes, batteries, alarms))
print("\n[zip 对齐记录 records]")
for r in records:
    print(r)

# map：批量转换（电量->百分号字符串）
battery_strs = list(map(lambda x: f"{x}%", batteries))
print("\n[map 转换 battery_strs]")
print(battery_strs)

# filter：筛选关注记录（低电量或出现非 OK 告警）
focus_records = list(
    filter(lambda t: (t[2] < 90) or (t[3] != "OK"), records)
)
print("\n[filter 筛选 focus_records]")
for r in focus_records:
    print(r)

print("\n=== 飞行日志批处理报告：结束 ===")
```

## 4.5.1 任务一：可迭代对象

可迭代对象是指可以被 `for` 循环逐个取出元素的对象，例如列表、字符串、元组、字典、集合等。
它像一条可以依次取出物品的传送带，`for` 每次拿一个，直到拿完。

**可迭代对象的使用方法**

- 直接用于 `for`：`for item in iterable:`
- 可与 `len()` 配合：统计元素个数（对多数容器适用）
- 可被 `list()` 包裹：把“可迭代结果”转成列表以便查看（如 `list(zip(...))`、`list(map(...))`）

**例如：**

```python
times = ["10:00", "10:01"]
uav_id = "UAV-07"
status = {"battery_percent": 86, "mode": "AUTO"}

# 遍历列表
for t in times:
    print("time =", t)

# 遍历字符串（逐字符）
for ch in uav_id:
    print("char =", ch)

# 遍历字典默认遍历“键”
for k in status:
    print("key =", k)
```

该示例分别遍历列表、字符串与字典，展示 `for` 对不同可迭代对象取出的元素类型与顺序特点。

:::{admonition} 【AI辅助小课堂】识别可迭代对象
:class: tip
把 `times`、`uav_id`、`status` 三个变量发给 AI，让 AI 写出“for 循环分别会取出什么元素”，并预测输出行数。运行示例核对。
:::

:::{admonition} 练习：可迭代对象
:class: important
创建列表 `alarms=["OK","GPS_WEAK","OK"]`：
用 for 逐个打印告警内容；再打印 `len(alarms)`。
:::

:::{index} single: 列表解析
:::
:::{index} single: 列表推导式
:::

## 4.5.2 任务二：列表解析

列表解析（List Comprehension）用于用一行表达式生成新列表，常见用途是映射、筛选与组合数据。
它像把“for 循环 + 收集结果”的写法压缩成一条公式，既短又清晰。

基本结构是 `[表达式 for 变量 in 可迭代对象]`，带条件时写作 `[表达式 for 变量 in 可迭代对象 if 条件]`。

列表解析与相关解析形式如表表4-17所示。

<p align="center"><strong>表4-17 列表相关解析</strong></p>

| 形式             | 功能描述         | 示例                                      | 结果示例                      |
| ---------------- | ---------------- | ----------------------------------------- | ----------------------------- |
| 带条件列表解析   | 筛选满足条件元素 | `[b for b in bs if b<90]`               | `[86,82]`                   |
| 多重解析嵌套     | 生成组合结果     | `[(r,c) for r in [0,1] for c in [0,1]]` | `[(0,0),(0,1),(1,0),(1,1)]` |
| 列表解析生成元组 | 每项为元组       | `[(t,b) for t,b in zip(ts,bs)]`         | `[("10:00",98), ...]`       |
| 解析生成字典     | 生成键值映射     | `{t:b for t,b in zip(ts,bs)}`           | `{"10:00":98,...}`          |
| 解析生成集合     | 去重/集合化      | `{a for a in alarms}`                   | `{"OK","GPS_WEAK"}`         |

**例如：**

```python
times = ["10:00", "10:01", "10:02"]
batteries = [98, 89, 82]
alarms = ["OK", "GPS_WEAK", "OK"]

# 带条件：筛出低电量样本
low_batts = [b for b in batteries if b < 90]

# 生成字典：时间 -> 电量
time_to_batt = {t: b for t, b in zip(times, batteries)}

# 生成集合：告警去重
unique_alarms = {a for a in alarms}

print("low_batts     =", low_batts)
print("time_to_batt  =", time_to_batt)
print("unique_alarms =", unique_alarms)
```

该示例用列表解析做条件筛选，用字典解析生成键值映射，并用集合解析对数据去重，展示三类解析的典型输出形态。

:::{admonition} 【AI辅助小课堂】一眼看懂列表解析
:class: tip
让 AI 把示例中的三条解析分别“还原”为等价的 for 循环写法，并标注每一步做了什么。运行对比输出一致性。
:::

:::{admonition} 练习：列表解析
:class: important
给定 `batteries=[100,95,89,88]`：
用列表解析生成 `low_flags`（每个元素表示是否低于 90），并打印该列表。
:::

## 4.5.3 任务三：zip函数

`zip()` 用于把多列数据按位置对齐，把同位置的元素组合成元组序列。它像拉链把左右两侧一对一扣起来，得到一条条配对好的记录。

- 把 `zip(a, b, c)` 理解为“拉链”：第 0 个与第 0 个合在一起，第 1 个与第 1 个合在一起……
- `zip()` 结果是可迭代对象，常用 `list(zip(...))` 转为列表方便查看

**zip 的使用方法**

- 两列对齐：`zip(times, batteries)`
- 多列对齐：`zip(times, altitudes, batteries, alarms)`
- 常见用途：生成记录列表、生成字典（配合字典解析/`dict()`）

**例如：**

```python
times = ["10:00", "10:01", "10:02"]
altitudes = [12.4, 15.8, 18.2]
batteries = [98, 94, 89]
alarms = ["OK", "OK", "GPS_WEAK"]

records = list(zip(times, altitudes, batteries, alarms))
print(records)
```

该示例用 `zip()` 将多个等长列表按位置对齐，得到由元组组成的记录列表。

:::{admonition} 【AI辅助小课堂】zip 后每项是什么？
:class: tip
让 AI 写出 `records` 中每一项的结构（是列表还是元组？有几个元素？顺序是什么？），并预测打印结果。运行核对。
:::

:::{admonition} 练习：zip
:class: important
给定：

```python
times=["10:00","10:01"]
batteries=[90,88]
```

用 `zip` 生成 `("10:00",90)` 这样的对齐结果，并打印转换后的列表。要求代码可运行。
:::

## 4.5.4 任务四：map函数

`map()` 用于批量转换，把一个函数应用到可迭代对象的每个元素上，得到新的结果序列。它像一条加工流水线，输入一串原料，按同一规则加工后输出一串新结果。

- 把 `map(f, iterable)` 理解为：对 iterable 中每一个元素都执行一次 `f`，得到新的结果序列
- `map()` 返回可迭代对象，通常用 `list(map(...))` 查看结果

**map 的使用方法**

- 单列转换：`map(lambda x: x*2, data)`
- 常与 `lambda` 配合做简单变换
- 结果常用 `list()` 包裹成列表

**例如：**

```python
batteries = [98, 94, 89]

# 核心：把每个整数转换为“带%”的字符串
battery_strs = list(map(lambda x: f"{x}%", batteries))

print(battery_strs)
```

该示例用 `map()` 将整数列表逐个转换为带 `%` 的字符串列表，体现“对每个元素应用同一规则”的批处理方式。

:::{admonition} 【AI辅助小课堂】map 与列表解析对照
:class: tip
让 AI 把示例 map 写法改写成等价的列表解析写法，并说明两者共同点。运行对比输出一致性。
:::

:::{admonition} 练习：map
:class: important
给定 `altitudes=[10.12, 10.55, 11.01]`：
用 `map` 把每个高度四舍五入到 1 位小数（可用 `round(x,1)`），并打印结果列表。
:::

## 4.5.5 任务五：filter函数

`filter()` 用于批量筛选，只保留满足条件的元素。它像筛网，条件为 True 的留下，条件为 False 的被过滤掉。

- 把 `filter(cond, iterable)` 理解为：只保留 cond 返回 True 的元素
- `filter()` 返回可迭代对象，通常用 `list(filter(...))` 查看结果

**filter 的使用方法**

- 对单列筛选：`filter(lambda x: x<90, batteries)`
- 对记录筛选：先 `zip` 生成记录，再按记录字段筛选
- 常与 `lambda` 配合：`lambda item: 条件表达式`

**例如：**

```python
times = ["10:00", "10:01", "10:02", "10:03"]
batteries = [98, 94, 89, 86]
alarms = ["OK", "OK", "GPS_WEAK", "OK"]

records = list(zip(times, batteries, alarms))

# 关注条件：电量 < 90 或 告警 != OK
focus = list(filter(lambda r: (r[1] < 90) or (r[2] != "OK"), records))

print("records =", records)
print("focus   =", focus)
```

该示例先用 `zip()` 生成记录，再用 `filter()` 按记录字段筛选出满足条件的条目，并将结果转换为列表便于查看。

:::{admonition} 【AI辅助小课堂】筛选结果行数预测
:class: tip
让 AI 根据 `records` 预测 `focus` 会保留几条记录，并写出每条被保留的原因（低电量/告警）。运行核对。
:::

:::{admonition} 练习：filter
:class: important
给定 `batteries=[95,92,89,85]`：
用 `filter` 筛选出小于 90 的电量，打印结果列表。
:::

---

# 4.6 项目六：综合实践项目——无人机“数据类型操作综合演练器”

## 项目简介

本项目通过编写一个脚本，把一次无人机飞行任务的关键信息用**字符串、列表、元组、字典、集合**进行组织，并完成"解析—增删改查—去重—格式化输出"的完整练习，从而把前面各类数据类型的操作串联起来。

## 需求分析

无人机一次飞行任务会产生多源数据：任务编号、飞手、航点、传感器清单、采样序列、告警记录等。课堂实践要求学生在 **90 分钟**内完成脚本 `uav_data_ops_lab.py`，实现“数据建模 + 数据操作 + 输出报告”三件事。

脚本需要完成以下功能：

1. **数据准备（多种数据类型）**定义并赋值以下数据（允许自定义具体值，但结构必须具备）：

   - 任务编号 `mission_id`（字符串，示例：`"MIS-20251224-A03"`）
   - 无人机编号 `uav_id`（字符串，示例：`"UAV-07"`）
   - 飞手姓名 `pilot`（字符串）
   - 航点字符串 `waypoints_text`（字符串，示例：`"P1,P2,P3,P4"`）
   - 航点列表 `waypoints`（列表，后续由字符串分割得到）
   - 传感器列表 `sensors`（列表，至少 4 项）
   - 返航点 `home_point`（元组，如 `(28.2280, 112.9388)`）
   - 电量采样 `battery_samples`（列表，至少 6 个整数）
   - 告警列表 `alarms`（列表，允许重复项，如含 `"OK"`、`"GPS_WEAK"`、`"LOW_BATT"`）
2. **字符串操作（分割/查找/替换/测试/大小写/运算符）**结合任务数据完成以下操作并输出：

   - 运算符：用 `+` 拼接标题行；用 `*` 生成分隔线；用 `in` 判断子串（如 `"MIS" in mission_id`）
   - 分割：用 `split()` 把 `waypoints_text` 转成 `waypoints` 列表
   - 查找：用 `find()` 查找 `"-"` 在 `mission_id` 中的位置
   - 替换：用 `replace()` 将 `mission_id` 中的 `"MIS"` 替换成 `"MISSION"`（用于展示替换效果）
   - 测试与大小写：对 `pilot` 做 `isalpha()`（或包含空格时用 `replace(" ","").isalpha()`）与 `title()` 处理并输出
3. **列表操作（+、*、in、替换、添加、删除、反转）**对 `sensors` 或 `waypoints` 完成以下操作并输出对比：

   - `+`：把新增传感器列表拼接到 `sensors`
   - `*`：把“校准提示”列表重复 2 次形成检查清单
   - `in`：判断 `"GPS"` 是否在传感器列表中
   - 单个替换：把某个传感器名替换为新名（如 `"Barometer"`→`"Baro"`）
   - 切片替换：把 `waypoints` 的后两项替换为备用航点（演示切片替换）
   - 添加：用 `append()` 或 `insert()` 增加航点/传感器
   - 删除：用 `pop()` 删除最后一个航点；用 `remove()` 删除指定告警（若存在）或用 `del` 删除指定下标
   - 反转：对 `waypoints` 使用 `reverse()` 展示“返航倒序检查”
4. **元组操作（只读性对比）**使用 `home_point` 展示元组不可修改的特点：

   - 正确示例：读取 `home_point[0]`、`home_point[1]`
   - 错误示例：尝试修改 `home_point[0]`（用注释说明会报错，不强制执行）
5. **字典操作（in、keys/values/items/get、插入、删除、替换）**创建任务字典 `mission` 并完成：

   - 用 `in` 判断键是否存在（如 `"pilot" in mission`）
   - 用 `keys()`/`values()`/`items()` 浏览字段
   - 用 `get()` 安全取值（如 `mission.get("weather", "N/A")`）
   - 插入：新增键值（如 `"mode":"AUTO"`）
   - 替换：更新电量字段或飞手字段
   - 删除：用 `pop()` 删除临时字段；用 `clear()`（仅演示思路，避免把数据清空影响后续，可注释不执行）
6. **集合操作（in、添加、删除、去重）**把 `alarms` 转为集合 `unique_alarms`：

   - 输出“原始告警列表”和“去重后的告警集合”
   - `in`：判断 `"LOW_BATT"` 是否出现
   - 添加：用 `add()` 添加一个模拟告警
   - 删除：用 `discard()` 删除一个可能不存在的告警（强调不会报错）
7. **迭代与批处理（可迭代对象、列表解析、zip、map、filter）**将“多列日志”对齐成记录并批处理：

   - `zip()`：把 `waypoints` 与 `battery_samples` 对齐形成 `records`
   - `map()`：把电量整数转换为百分号字符串
   - `filter()`：筛选出电量低于 90 的记录
   - 列表解析：生成“低电量标记列表”（True/False）
8. **输出排版（格式化输出 + 换行对比 + 注释规范）**

   - 报告至少包含 4 个部分标题：基本信息 / 字符串解析 / 列表与字典操作 / 批处理与告警摘要
   - 使用 `f-string` 对齐输出两列信息（如字段名与值）
   - 使用 **括号 `()`** 输出多行提示语；再用一次 **反斜杠 `\`** 输出多行提示语（对比两种写法）
   - 代码包含文件头部三引号说明与必要单行注释；缩进统一 4 空格

## 交付物

- 文件：`uav_data_ops_lab.py`
- 运行截图或运行输出文本
- 关键检查点（输出中必须能看到）：
  （1）`waypoints_text` 被 `split()` 后得到的航点列表；
  （2）至少 1 次列表单个替换 + 1 次切片替换的前后对比；
  （3）字典 `mission` 的 `get()` 输出（含默认值示例）；
  （4）告警集合去重结果 + `LOW_BATT` 是否出现；
  （5）`zip/map/filter` 的批处理结果；
  （6）一段括号换行提示语 + 一段反斜杠换行提示语。

## 评价标准

| 项目         | 合格要求                                        |
| ------------ | ----------------------------------------------- |
| 数据类型覆盖 | 字符串/列表/元组/字典/集合均出现且操作正确      |
| 字符串操作   | split/find/replace/测试或大小写 至少完成 3 项   |
| 列表操作     | 添加/删除/替换/反转 至少完成 4 项（含切片替换） |
| 字典操作     | in + get + 插入或替换 + pop 至少完成 3 项       |
| 集合操作     | 去重 + in + add 或 discard 至少完成 3 项        |
| 批处理       | zip + map + filter + 列表解析均出现并输出结果   |
| 代码风格     | 注释齐全、缩进规范、输出分段清晰                |
