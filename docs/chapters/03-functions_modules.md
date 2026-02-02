(model3)=

# 模块三：函数与模块

---

# 3.1 项目一：无人机"任务工具箱"——函数的定义与调用

**项目简介**

> 本项目以“任务工具箱”为主线，建立三个最小可用函数：`print_header()`输出任务抬头；`can_takeoff()`根据电量/GPS/解锁状态返回是否可起飞；`make_log_brief()`把一条日志字典整理成一行简报文本并返回。主程序通过调用这些函数，完成一次简化任务流程的输出。

**项目定位**

> 本项目定位为"函数入门"的第一课，围绕无人机任务的常见重复操作，学习函数的定义、调用与返回值。

**需求分析**

> 本项目编写脚本 `uav_toolbox.py` 需要完成以下功能：
> - 准备任务基本数据：`mission_id`、`uav_id`、`pilot`；准备状态数据：`battery_percent`、`gps_satellites`、`is_armed`；准备日志列表 `logs`（列表中放字典）
> - 定义 3 个函数：抬头输出函数、起飞判定函数、日志简报函数
> - 在主流程中依次调用函数：先打印抬头，再判定是否可起飞，再遍历日志生成简报
> - 函数代码必须有注释；示例代码必须可直接运行，不出现变量未定义

**项目代码**

```python
# uav_toolbox.py
# 项目一：无人机“任务工具箱”——函数的定义与调用

# -------------------------
# 数据准备（主流程使用）
# -------------------------
mission_id = "MIS-20251223-A01"
uav_id = "UAV-07"
pilot = "Li Ming"

battery_percent = 72
gps_satellites = 10
is_armed = True

logs = [
    {"uav_id": "UAV-07", "flight_min": 12, "altitude_m": 52.5, "battery_percent": 86},
    {"uav_id": "UAV-07", "flight_min": 8,  "altitude_m": 40.0, "battery_percent": 78},
]

# -------------------------
# 函数区
# -------------------------
def print_header(mission_id, uav_id, pilot):
    """输出任务抬头（只负责打印，不返回值）"""
    # 核心：把重复的抬头输出封装成函数
    print("=== 无人机任务执行 ===")
    print("任务编号：", mission_id)
    print("无人机：", uav_id)
    print("飞手：", pilot)
    print("----------------------------------")


def can_takeoff(battery_percent, gps_satellites, is_armed):
    """起飞条件判断：返回 True/False"""
    # 核心：把起飞条件判断封装成函数，主流程只关心结果
    if battery_percent < 30:
        return False
    if gps_satellites < 6:
        return False
    if not is_armed:
        return False
    return True


def make_log_brief(log):
    """把一条日志字典整理成简报行并返回（返回字符串）"""
    # 核心：集中处理字典取值与拼接输出格式
    uav = log["uav_id"]
    mins = log["flight_min"]
    alt = log["altitude_m"]
    bat = log["battery_percent"]
    brief = "日志：{} | 时长{}min | 高度{}m | 电量{}%".format(uav, mins, alt, bat)
    return brief


# -------------------------
# 主流程：调用函数完成任务
# -------------------------
print_header(mission_id, uav_id, pilot)

ok = can_takeoff(battery_percent, gps_satellites, is_armed)
print("起飞判定：", "允许起飞" if ok else "禁止起飞")

print("----------------------------------")
print("日志简报：")
for log in logs:
    print(make_log_brief(log))  # 调用函数，得到字符串后打印

print("=== 任务结束 ===")
```

:::{index} single: 函数定义
:::
:::{index} single: def关键字
:::

## 3.1.1 任务一：函数的定义

函数用于封装一段可复用的代码，把一组操作打包成“名字 + 参数 + 返回值”的单元。
函数就像一把可重复使用的工具，写好一次后，后续只需调用就能得到同样的处理结果。

**语法格式**

```python
def 函数名(参数1, 参数2, ...):
    函数体（缩进4空格）
    return 返回值（可省略）
```

函数定义语法各部分的含义如表 3-1 所示。

<p align="center"><strong>表 3-1  函数定义语法各部分的含义</strong></p>

| 组成           | 格式              | 含义                       |
| -------------- | ----------------- | -------------------------- |
| 关键字         | `def`           | 声明“这是一个函数”       |
| 函数名         | `func_name`     | 命名规则同标识符           |
| 参数列表       | `(p1, p2, ...)` | 调用时传入的数据（可为空） |
| 冒号与缩进     | `:` + 缩进      | 函数体必须缩进             |
| 返回值（可选） | `return ...`    | 把结果返回给调用者         |

**执行过程**

- Python 运行到 `def` 时，只是“创建函数”，不会执行函数体
- 只有在后面写出 `函数名(...)` 调用时，函数体才会真正执行
- 函数执行到 `return` 就结束，并把结果交回调用处

**例如：**

```python
def print_header(mission_id, uav_id, pilot):
    # 核心：把抬头输出封装为函数
    print("任务编号：", mission_id)
    print("无人机：", uav_id)
    print("飞手：", pilot)

# 调用函数（定义后才可调用）
print_header("MIS-20251223-A01", "UAV-07", "Li Ming")
```

该示例先用 `def` 定义 `print_header()`，再通过一次调用把三个参数传入并完成输出。

:::{admonition} 【AI辅助小课堂】识别“定义”和“执行”
:class: tip
把上面示例发给 AI，让 AI 用一句话指出：哪一行是在“定义函数”，哪一行是在“执行函数”，再让 AI 预测输出内容并运行核对。
:::

:::{admonition} 练习：函数定义
:class: important
定义一个函数 `print_takeoff_notice(uav_id)`，函数体打印一行：`UAV-xx 起飞检查开始`。
要求：写出函数定义并调用一次，程序可直接运行。
:::

:::{index} single: 函数调用
:::
:::{index} single: 实参与形参
:::

## 3.1.2 任务二：函数的调用

函数调用就是让函数真正执行，调用时把实参传给形参，函数体运行并产生输出或返回值。
函数名就像一个“启动按钮”，按下后会按既定步骤完成一件事。

函数调用语法格式如表3-2所示。

<p align="center"><strong>表 3-2  函数调用语法</strong></p>

| 调用形式       | 写法                  | 说明                  |
| -------------- | --------------------- | --------------------- |
| 无返回值调用   | `func(a, b)`        | 函数内部完成打印/操作 |
| 有返回值调用   | `x = func(a, b)`    | 把返回值保存到变量    |
| 直接使用返回值 | `print(func(a, b))` | 直接打印或参与表达式  |

**执行过程**

- 调用发生时，实参按顺序传入形参
- 执行函数体
- 遇到 `return` 返回，若无 `return`，默认返回 `None`
- 返回值交回调用位置继续执行

**例如：**

```python
def can_takeoff(battery_percent, gps_satellites, is_armed):
    # 核心：起飞条件判断
    if battery_percent < 30:
        return False
    if gps_satellites < 6:
        return False
    if not is_armed:
        return False
    return True

battery_percent = 72
gps_satellites = 10
is_armed = True

result = can_takeoff(battery_percent, gps_satellites, is_armed)
print("起飞判定：", "允许起飞" if result else "禁止起飞")
```

该示例把三个变量作为实参传入 `can_takeoff()`，并把返回的布尔值用于条件表达式输出不同文本。

:::{admonition} 【AI辅助小课堂】调用参数与结果核对
:class: tip
让 AI 给出 3 组不同的参数（电量/GPS/解锁），并预测每组调用 `can_takeoff()` 的返回值 True/False。把其中一组复制到本机运行核对。
:::

:::{admonition} 练习：函数调用
:class: important
已知函数：

```python
def show_status(uav_id, battery_percent):
    print(uav_id, "当前电量：", battery_percent, "%")
```

请写出两次调用：一次传入 `"UAV-01", 90`，一次传入 `"UAV-02", 25`。要求可直接运行。
:::

---

:::{index} single: 函数返回值
:::
:::{index} single: return语句
:::

## 3.1.3 任务三：函数返回值

返回值用于把函数的处理结果交回调用位置，便于后续打印、保存或参与判断与计算。
返回值就像“交回的一份结果”，调用者拿到它后再决定下一步怎么做。

函数返回值方式如表3-3所示。

<p align="center"><strong>表 3-3  函数返回值方式表</strong></p>

| 情况       | 写法            | 调用方得到什么                     |
| ---------- | --------------- | ---------------------------------- |
| 默认返回值 | 无 `return`   | 返回 `None`                      |
| 返回单个值 | `return x`    | 返回一个对象（如数字/字符串/布尔） |
| 返回多个值 | `return a, b` | 返回一个元组（可用多重赋值接收）   |

**例如：**

默认返回值 None（可运行单元）

```python
# 该示例展示：函数只打印，不写 return，则返回值为 `None`。
def print_done():
    # 核心：无 return，默认返回 None
    print("任务完成")

x = print_done()
print("返回值：", x)
```

该示例展示函数未写 `return` 时会默认返回 `None`，因此 `x` 的值为 `None`。

**例如：**

返回单个值

```python
# 该示例展示：“生成简报行”的逻辑，返回一个字符串。
def make_log_brief(log):
    # 核心：把日志整理成一行文本并返回
    brief = "UAV:{} 时长{}min 高度{}m 电量{}%".format(
        log["uav_id"], log["flight_min"], log["altitude_m"], log["battery_percent"]
    )
    return brief

log = {"uav_id": "UAV-07", "flight_min": 12, "altitude_m": 52.5, "battery_percent": 86}
text = make_log_brief(log)
print(text)
```

该示例把字典整理为字符串并用 `return brief` 返回，调用方接收返回值后再打印输出。

**例如：**

返回多个值

```python
# 该示例展示：返回多个值时，Python 实际返回一个元组；调用方可用多重赋值接收。
def parse_mission_id(mission_id):
    # 核心：返回多个片段（元组）
    prefix = mission_id[0:3]
    date_part = mission_id[4:12]
    area = mission_id[-3:]
    return prefix, date_part, area

mission_id = "MIS-20251223-A01"
p, d, a = parse_mission_id(mission_id)
print("前缀：", p)
print("日期：", d)
print("区域：", a)
```

该示例通过 `return prefix, date_part, area` 返回一个元组，并用多重赋值一次性接收三个结果。

:::{admonition} 【AI辅助小课堂】返回值类型判断
:class: tip
把“返回多个值”的示例发给 AI，让 AI 指出：函数实际返回的类型是什么（提示：元组），并让 AI 写出 `print(type(parse_mission_id(mission_id)))` 的验证代码。运行核对。
:::

:::{admonition} 练习：函数返回值
:class: important
定义函数 `calc_flight_cost(battery_start, battery_end)`，返回“消耗电量”（`battery_start - battery_end`）。
要求：调用一次，例如 `calc_flight_cost(90, 72)`，并打印返回值。程序可直接运行。
:::

---

# 3.2 项目二：无人机“指令下发器”——函数参数

**项目简介**

> 本项目把“下发指令”抽象为函数调用： `send_move(uav_id, x, y)` 用位置参数表达“按顺序传值”； `set_rth(uav_id, *, altitude_m=30.0, speed_mps=8.0)` 用关键字与默认参数表达“按名称设置”；`batch_upload_waypoints(uav_id, *points)` 用 `*args` 表达“航点数量不固定”；`set_params(uav_id, **params)` 用 `**kwargs` 表达“参数表不固定”。主流程通过多种调用方式输出一份清晰的指令记录。

**项目定位**

> 本项目定位为"函数参数体系"的综合训练，覆盖：位置参数、关键字参数、默认参数、不定长参数 `*args` 与 `**kwargs`。

**需求分析**

> 本项目编写脚本 `uav_command_sender.py` 需要完成以下功能：
>
> - 准备基本数据：无人机编号 `uav_id`、若干航点、若干参数字典
> - 定义 4 个函数，用于覆盖本章参数类型：位置参数、关键字参数、默认参数、*args、**kwargs
> - 在主流程中分别用不同方式调用函数，并输出“指令下发记录”
> - 所有示例必须为可运行单元，核心语句带注释，变量定义完整

**项目代码**

```python

# uav_command_sender.py
# 项目二：无人机“指令下发器”——函数参数（位置/关键字/默认/*args/**kwargs）

# -------------------------
# 数据准备
# -------------------------
uav_id = "UAV-07"

# 三个航点（用元组表示坐标点）
p1 = (0, 0)
p2 = (10, 5)
p3 = (20, 10)

print("=== 指令下发记录 ===")

# -------------------------
# 位置参数：按顺序传值
# -------------------------
def send_move(uav_id, x, y):
    # 核心：位置参数按“从左到右”的顺序传递
    print("[MOVE] uav:", uav_id, "to (", x, ",", y, ")")

# -------------------------
# 关键字参数 + 默认参数：按名称传值，可省略部分参数
# -------------------------
def set_rth(uav_id, altitude_m=30.0, speed_mps=8.0):
    # 核心：默认参数提供“没写就用默认值”的能力
    print("[RTH ] uav:", uav_id, "alt:", altitude_m, "m", "speed:", speed_mps, "m/s")

# -------------------------
# *args：接收不定数量的位置参数（航点列表）
# -------------------------
def batch_upload_waypoints(uav_id, *points):
    # 核心：points 是一个元组，包含所有额外位置参数
    print("[WPTS] uav:", uav_id, "count:", len(points))
    for pt in points:
        print("       waypoint:", pt)

# -------------------------
# **kwargs：接收不定数量的关键字参数（参数表）
# -------------------------
def set_params(uav_id, **params):
    # 核心：params 是一个字典，包含所有额外关键字参数
    print("[PARM] uav:", uav_id)
    for k in params:
        print("       ", k, "=", params[k])

# -------------------------
# 主流程：多种调用方式展示参数传递
# -------------------------
# 位置参数调用
send_move(uav_id, 10, 20)
send_move(uav_id, -5, 3)

print("----------------------------------")

# 关键字参数调用（顺序可以改变）
set_rth(uav_id, altitude_m=60.0, speed_mps=10.0)
set_rth(uav_id, speed_mps=6.0, altitude_m=40.0)

print("----------------------------------")

# 默认参数调用（省略 speed_mps，使用默认值）
set_rth(uav_id, altitude_m=50.0)

print("----------------------------------")

# *args 调用：航点数量不固定
batch_upload_waypoints(uav_id, p1, p2, p3)

print("----------------------------------")

#  **kwargs 调用：参数表不固定
set_params(uav_id, camera=True, gimbal_pitch=-20, max_speed=12)

print("=== 记录结束 ===")
```

:::{index} single: 位置参数
:::
:::{index} single: 普通参数
:::

## 3.2.1 任务一：位置参数（普通参数）

位置参数是最常用的参数形式，调用时把实参按顺序写在括号里，Python 会把它们依次传给函数定义中的形参。
位置参数就像“按顺序填表”：第 1 个值填第 1 个空，第 2 个值填第 2 个空，顺序一旦写错，含义就会变。

**例如：**

```python
def send_move(uav_id, x, y):
    # 核心：按位置顺序接收参数
    print("[MOVE] uav:", uav_id, "to (", x, ",", y, ")")

uav_id = "UAV-07"

# 位置参数：按顺序传值
send_move(uav_id, 10, 20)  # x=10, y=20
send_move(uav_id, 20, 10)  # x=20, y=10（顺序交换含义也交换）
```

该示例对比了两次位置参数调用，展示实参顺序变化会导致 `x` 与 `y` 的含义互换。

:::{admonition} 【AI辅助小课堂】位置参数含义核对
:class: tip
把两次调用的参数列表发给 AI，让 AI 逐项写出“每个实参传给哪个形参”。运行程序核对输出中的坐标是否符合推断。
:::

:::{admonition} 练习：位置参数
:class: important
定义函数 `set_gimbal(uav_id, pitch, yaw)`，打印：`云台设置 uav=... pitch=... yaw=...`。
分别用位置参数调用两次：`("UAV-01", -10, 0)` 与 `("UAV-01", 0, -10)`，观察差异。
:::

:::{index} single: 关键字参数
:::

## 3.2.2 任务二：关键字参数

关键字参数在调用时写成 `形参名=值` 的形式。它不依赖位置顺序，强调“按名称传值”。
关键字参数就像“写清楚字段名再填值”：即使顺序不同，只要字段名对应，传递结果就一致。

**例如：**

```python
def set_rth(uav_id, altitude_m=30.0, speed_mps=8.0):
    # 核心：用关键字参数明确指定含义
    print("[RTH ] uav:", uav_id, "alt:", altitude_m, "m", "speed:", speed_mps, "m/s")

uav_id = "UAV-07"

# 关键字参数：按名称传递，顺序可变
set_rth(uav_id, altitude_m=60.0, speed_mps=10.0)
set_rth(uav_id, speed_mps=10.0, altitude_m=60.0)
```

该示例用关键字参数两次调用同一函数，说明只要参数名对应，传参顺序可以不同。

:::{admonition} 【AI辅助小课堂】把自然语言改写成关键字调用
:class: tip
给 AI 一句指令：“UAV-07 返航高度 80 米，返航速度 6 m/s”。要求 AI 输出对应的函数调用语句（使用关键字参数）。复制到本机运行核对输出。
:::

:::{admonition} 练习：关键字参数
:class: important
已知函数：

```python
def set_camera(uav_id, resolution, fps):
    print("camera uav=", uav_id, "res=", resolution, "fps=", fps)
```

用关键字参数调用一次，令 `fps=30`，`resolution="4K"`，并把顺序写成 `fps` 在前、`resolution` 在后。要求可直接运行。
:::

:::{index} single: 默认参数
:::
:::{index} single: 缺省值
:::

## 3.2.3 任务三：默认参数

默认参数是在函数定义时为某些参数指定默认值。调用时若不传该参数，Python 自动使用默认值。
默认参数就像“缺省配置”。不写就按默认设置执行，需要修改时再显式传参。

**例如：**

```python
def set_rth(uav_id, altitude_m=30.0, speed_mps=8.0):
    # 核心：speed_mps 有默认值
    print("[RTH ] uav:", uav_id, "alt:", altitude_m, "m", "speed:", speed_mps, "m/s")

uav_id = "UAV-07"

# 只传一个参数 altitude_m，speed_mps 使用默认值 8.0
set_rth(uav_id, altitude_m=50.0)

# 同时传入两个参数，覆盖默认值
set_rth(uav_id, altitude_m=50.0, speed_mps=6.0)
```

该示例分别演示省略参数时使用默认值，以及显式传参覆盖默认值的情况。

:::{admonition} 【AI辅助小课堂】默认值覆盖关系判断
:class: tip
让 AI 解释：哪一次调用使用了默认值，哪一次覆盖了默认值，并写出两次调用的完整“最终参数表”。运行核对输出。
:::

:::{admonition} 练习：默认参数
:class: important
定义函数 `set_beep(uav_id, times=3)`：打印 `uav=... beep times=...`。
分别调用：`set_beep("UAV-02")` 与 `set_beep("UAV-02", times=1)`。要求可直接运行。
:::

:::{index} single: 不定长参数
:::
:::{index} single: *args
:::
:::{index} single: **kwargs
:::

## 3.2.4 任务四：不定长参数

不定长参数用于“参数数量不固定”的场景，例如一次接收任意多个值，或一次接收任意多对 `key=value`。语法形式主要有两类

- `*args`：接收多余的位置参数，收集为一个元组
- `**kwargs`：接收多余的关键字参数，收集为一个字典

**1.*args**

`*args` 用于接收数量不固定的位置参数，调用时多出来的实参会被收集成一个元组。
它像把一串同类数据打包成一袋，函数内部用循环逐个处理。

**例如：**

```python
def batch_upload_waypoints(uav_id, *points):
    # 核心：points 是元组，包含所有额外位置参数
    print("[WPTS] uav:", uav_id, "count:", len(points))
    for pt in points:
        print("waypoint:", pt)

uav_id = "UAV-07"
p1 = (0, 0)
p2 = (10, 5)
p3 = (20, 10)

# *args：三个航点会被打包到 points 中
batch_upload_waypoints(uav_id, p1, p2, p3)
```

该示例用 `*points` 接收三个航点实参，展示它们会被收集为元组并可用循环逐个输出。

:::{admonition} 【AI辅助小课堂】*args 打包结果观察
:class: tip
让 AI 在示例中加一行 `print(type(points), points)` 并说明会输出什么。把 AI 改写后的代码复制运行核对。
:::

:::{admonition} 练习：*args
:class: important
定义函数 `sum_flight_minutes(*mins)`，在函数内用 for 循环把所有分钟数累加并打印总和。
调用一次：`sum_flight_minutes(3, 5, 2)`。要求代码可直接运行。
:::

**2. \*\*kwargs**

`**kwargs` 用于接收数量不固定的关键字参数，调用时多出来的 `key=value` 会被收集成一个字典。
它像把一张参数表整体递进来，函数内部按字典遍历就能逐项处理。

**例如：**

```python
def set_params(uav_id, **params):
    # 核心：params 是字典，包含所有关键字参数
    print("[PARM] uav:", uav_id)
    for k in params:
        print(k, "=", params[k])

uav_id = "UAV-07"

# **kwargs：三个配置项会被打包到 params 字典中
set_params(uav_id, camera=True, gimbal_pitch=-20, max_speed=12)
```

该示例用 `**params` 接收多个配置项，展示关键字实参会被收集为字典并可按键遍历打印。

:::{admonition} 【AI辅助小课堂】**kwargs 与字典对照
:class: tip
让 AI 解释：`params` 与普通字典有什么相同点。并让 AI 写一行 `print(params)` 放进函数里观察。运行核对输出。
:::

:::{admonition} 练习：**kwargs
:class: important
定义函数 `print_config(**cfg)`，把所有配置项逐行打印成 `key -> value`。
调用一次：`print_config(mode="AUTO", rth_alt=60, led=True)`。要求代码可直接运行。
:::

# 3.3 项目三：无人机“任务计分器”——变量作用域与函数特殊形式

**项目简介**

> 本项目将一次训练任务抽象为“若干段得分”，并给出统一的计分与扣分规则：
> - 局部变量：每个评分函数内部的临时量只在函数内生效
> - 全局变量：任务累计分 `total_score` 贯穿主流程
> - 内嵌变量：在 `score_route()` 内嵌 `calc_segment()` 复用片段计算
> - 匿名函数：用 `lambda` 表达“电量奖励规则”
> - 递归函数：用递归计算“连续告警的阶梯扣分”
> - 最终输出一份可核对的《任务计分报告》

**项目定位**

> 本项目定位为"函数进阶：作用域 + 特殊形式"的综合训练，覆盖：局部变量、全局变量、内嵌变量（嵌套函数的变量作用范围）、匿名函数（lambda）、递归函数。


**需求分析**

> 本项目编写脚本 `uav_mission_score.py` 需要完成以下功能：
> - 准备基础数据：`uav_id`、`battery_percent`、`segments`（列表）、`alarms`（列表）
> - 定义计分函数，覆盖 5 个知识点：局部/全局/内嵌/lambda/递归
> - 主流程输出报告：逐项打印得分、扣分、累计分

**项目代码**

```python

# uav_mission_score.py
# 项目三：无人机“任务计分器”——变量作用域与函数特殊形式

# -------------------------
# 数据准备
# -------------------------
uav_id = "UAV-07"
battery_percent = 72

# 航段得分（每段满分 10）
segments = [8, 9, 7]

# 告警记录（允许重复）
alarms = ["GPS_WEAK", "GPS_WEAK", "IMU_WARN", "GPS_WEAK"]

# 全局累计分（用于全局变量演示）
total_score = 0

# -------------------------
# 局部变量示例函数
# -------------------------
def score_takeoff(battery_percent):
    # 局部变量：只在函数内部使用
    base = 10
    penalty = 0
    if battery_percent < 30:
        penalty = 5
    result = base - penalty
    return result

# -------------------------
# 全局变量示例函数
# -------------------------
def add_to_total(points):
    # 核心：声明使用全局变量 total_score
    global total_score
    total_score += points

# -------------------------
# 内嵌变量（嵌套函数）示例
# -------------------------
def score_route(segment_scores):
    # 外层函数局部变量：在整个 score_route 内可见
    weight = 1

    def calc_segment(s):
        # 内嵌函数：可访问外层的 weight（内嵌变量作用域）
        # 这里的 s 是 calc_segment 的局部变量
        return s * weight

    subtotal = 0
    for s in segment_scores:
        subtotal += calc_segment(s)
    return subtotal

# -------------------------
# 匿名函数（lambda）示例：电量奖励规则
# -------------------------
battery_bonus = lambda b: 2 if b >= 80 else 1 if b >= 50 else 0

# -------------------------
# 递归函数示例：连续告警阶梯扣分
# -------------------------
def stair_penalty(n):
    # n 为连续告警次数：1次扣1分，2次扣(1+2)分，3次扣(1+2+3)分...
    if n <= 0:
        return 0
    return n + stair_penalty(n - 1)

# -------------------------
# 主流程：输出《任务计分报告》
# -------------------------
print("=== 无人机任务计分报告 ===")
print("无人机：", uav_id)

# 起飞得分（局部变量计算）
takeoff_points = score_takeoff(battery_percent)
print("起飞检查得分：", takeoff_points)
add_to_total(takeoff_points)

# 航线得分（内嵌变量 + for 循环）
route_points = score_route(segments)
print("航线执行得分：", route_points)
add_to_total(route_points)

# 电量奖励（匿名函数）
bonus = battery_bonus(battery_percent)
print("电量奖励：", bonus)
add_to_total(bonus)

# 连续 GPS_WEAK 计数（用 while 演示计数过程）
i = 0
consecutive = 0
while i < len(alarms):
    if alarms[i] == "GPS_WEAK":
        consecutive += 1
    i += 1

# 递归扣分
pen = stair_penalty(consecutive)
print("告警次数(GPS_WEAK)：", consecutive)
print("阶梯扣分：", pen)
add_to_total(-pen)

print("----------------------------------")
print("累计总分：", total_score)
print("=== 报告结束 ===")
```

**变量作用域整体介绍**

变量作用域描述“变量在什么范围内可见、可用”。在 Python 中，最常见的作用域有三类。

- **局部作用域**：定义在函数内部的变量，只在该函数内部有效
- **全局作用域**：定义在文件顶层的变量，在整个脚本中可用
- **内嵌作用域**：函数内部再定义函数时，内层函数可访问外层函数的局部变量（闭包现象）
  理解作用域的关键是先看变量在哪里定义，再看当前代码是否在它的“可见范围”内。

:::{index} single: 局部变量
:::
:::{index} single: 变量作用域
:::

## 3.3.1 任务一：局部变量

局部变量是在函数内部创建的变量，只在该函数执行期间可见，函数结束后外部无法直接访问。
局部变量就像函数内部的临时草稿，只在“这一次调用”里有意义。

**例如：**

```python
def score_takeoff(battery_percent):
    # 局部变量：base/penalty/result 只在函数内部有效
    base = 10
    penalty = 0
    if battery_percent < 30:
        penalty = 5
    result = base - penalty
    return result

battery_percent = 72

# 正确：通过函数返回值获取结果
points = score_takeoff(battery_percent)
print("起飞得分：", points)

# 错误：直接访问局部变量（将触发 NameError）
try:
    print(base)  # base 是函数内部局部变量，外部不可见
except NameError as e:
    print("错误演示：", e)
```

该示例演示了局部变量 `base` 在函数外不可见，正确做法是通过返回值把结果传回到外部变量 `points`。

:::{admonition} 【AI辅助小课堂】变量可见范围标注
:class: tip
把示例发给 AI，让 AI 标注 `base/penalty/result/points` 分别属于哪种作用域，并预测哪一行会触发 NameError。运行核对输出。
:::

:::{admonition} 练习：局部变量
:class: important
定义函数 `calc_energy_cost(flight_min)`：在函数内定义局部变量 `rate=2`，返回 `flight_min * rate`。
在函数外打印返回值，并尝试打印 `rate`（用 try/except 捕获 NameError）。要求代码可直接运行。
:::

:::{index} single: 全局变量
:::
:::{index} single: global关键字
:::

## 3.3.2 任务二：全局变量

全局变量定义在脚本顶层，可以被多个函数共享使用，若要在函数内部“修改”全局变量，需要使用 `global` 声明。
全局变量像一块“共享记分牌”。多个函数都能读取它，但要在函数内修改它需要显式声明 `global`。

**例如：**

```python
total_score = 0  # 全局变量

def add_ok(points):
    global total_score  # 正确：声明修改全局变量
    total_score += points

def add_wrong(points):
    # 错误：未声明 global，却试图修改 total_score
    # Python 会把 total_score 当作局部变量，但又先读后写，导致 UnboundLocalError
    total_score += points

add_ok(10)
print("正确修改后 total_score =", total_score)

try:
    add_wrong(5)
except UnboundLocalError as e:
    print("错误演示：", e)
```

该示例对比了使用 `global` 正确累加全局变量与未声明导致 `UnboundLocalError` 的情况。

:::{admonition} 全局变量修改警告
:class: warning
在函数内修改全局变量必须使用 `global`。否则对同名变量赋值会被视为创建局部变量，导致“读写冲突”错误。
:::

:::{admonition} 【AI辅助小课堂】global 的作用一句话总结
:class: tip
让 AI 用一句话解释：`global total_score` 到底改变了什么。再让 AI 指出示例中 `add_wrong()` 为什么会报错。运行核对。
:::

:::{admonition} 练习：全局变量
:class: important
定义全局变量 `alarm_count = 0`。写函数 `add_alarm()`：每调用一次就把 `alarm_count` 加 1。
调用 3 次并打印 `alarm_count`。要求代码可直接运行。
:::

## 3.3.3 任务三：内嵌变量

在函数内部再定义函数时，内层函数可以访问外层函数的局部变量，这些“外层但不在全局”的变量属于内嵌作用域。
外层函数像一个“工作区”，内层函数像“工作区里的小工具”，可以直接使用工作区里的变量而不用重复传参。

**例如：**

```python
def score_route(segment_scores):
    weight = 1  # 外层函数局部变量（对内层函数可见）

    def calc_segment(s):
        # 内层函数可访问外层的 weight
        return s * weight

    total = 0
    for s in segment_scores:
        total += calc_segment(s)
    return total

segments = [8, 9, 7]
print("航线得分：", score_route(segments))

# 错误：外部访问内层函数名/外层局部变量
try:
    print(weight)
except NameError as e:
    print("错误演示：", e)

try:
    print(calc_segment(10))
except NameError as e:
    print("错误演示：", e)
```

该示例展示内层函数 `calc_segment()` 可以读取外层变量 `weight`，但函数外无法直接访问 `weight` 或 `calc_segment`。

:::{admonition} 【AI辅助小课堂】嵌套函数可见性判断
:class: tip
让 AI 标注：`weight` 在哪些行可用、`calc_segment` 在哪些行可调用，并预测两次 NameError 的触发原因。运行核对输出。
:::

:::{admonition} 练习：内嵌变量
:class: important
定义函数 `make_multiplier(k)`，在其内部再定义函数 `mul(x)`，返回 `x * k`，并在外层返回 `mul` 的计算结果（不返回函数对象）。
调用：`make_multiplier(3)` 里固定 `k=3`，让它计算 `x=10` 并打印结果。要求代码可直接运行。
:::

## 3.3.4 任务四：匿名函数

匿名函数（lambda）用于用一行表达式快速定义简单的“输入到输出”的规则，表达式结果就是返回值。
它像一张便签，只写最核心的计算公式，用完就丢。

**语法格式**

`lambda 参数: 表达式`

匿名函数只能写一个表达式，表达式结果就是返回值

**例如：**

```python
# 匿名函数：根据电量返回奖励分
battery_bonus = lambda b: 2 if b >= 80 else 1 if b >= 50 else 0

battery_percent = 72

# 调用过程：把 72 传给 b，表达式求值后返回 1
bonus = battery_bonus(battery_percent)
print("电量：", battery_percent, "奖励：", bonus)
```

该示例用一行 `lambda` 写出分段奖励规则，并通过调用得到 `bonus` 的数值结果。

:::{admonition} 【AI辅助小课堂】把 def 改写为 lambda
:class: tip
让 AI 把“电量奖励规则”用 `def` 写成等价函数，再对照 lambda 的一行写法，判断两者输出是否一致。复制运行核对。
:::

:::{admonition} 练习：匿名函数
:class: important
用 lambda 定义 `is_safe_alt = lambda alt: alt >= 10`。
分别测试 `alt=5` 与 `alt=15`，打印返回值 True/False。要求代码可直接运行。
:::

:::{index} single: 递归函数
:::
:::{index} single: 递归调用
:::

## 3.3.5 任务五：递归函数

递归函数是“函数调用自己”的函数，常用于把问题拆成“规模更小的同类问题”，直到满足结束条件。
递归像“层层拆箱”。先把问题缩小到最简单的一步，再一层层返回把结果合并起来。

**语法格式**

```python
def 函数名(参数):
    if 结束条件:
        return 结果          # ① 递归终止条件（基例）
    else:
        return 函数名(新参数) # ② 递归调用（递推）
```

递归函数必须包含两部分：

- 递归终止条件，否则会无限调用，程序崩溃
- 递归调用自身问题，规模要逐步变小

**例如：**

```python
def stair_penalty(n):
    # 终止条件：n<=0 时不再扣分
    if n <= 0:
        return 0
    # 递归：当前扣 n 分 + 继续扣 (n-1)
    return n + stair_penalty(n - 1)

n = 3
print("连续告警次数：", n)
print("阶梯扣分：", stair_penalty(n))
```

该示例用递归实现 1 到 n 的阶梯累加，并通过 `n<=0` 的终止条件保证递归能结束。

:::{admonition} 递归终止条件警告
:class: warning
递归必须包含明确的终止条件（例如 n<=0）。若递归规模不减小或缺少终止条件，会导致无限递归并报错。
:::

:::{admonition} 【AI辅助小课堂】递归展开写出计算式
:class: tip
让 AI 把 `stair_penalty(4)` 展开成 “4 + 3 + 2 + 1 + 0” 的形式，并给出最终结果。运行核对输出。
:::

:::{admonition} 练习：递归函数
:class: important
定义递归函数 `countdown(n)`：当 n==0 时返回 0，否则返回 1 + countdown(n-1)。
调用 `countdown(5)` 并打印结果，观察返回值是否为 5。要求代码可直接运行。
:::

---

# 3.4 项目四：无人机“传感器工具箱”——模块、包与库

**项目简介**

> 项目采用“一个主程序 + 一个包”的组织形式：
> 　　- `main.py`：无人机任务入口，负责组合调用
> 　　- `uav_toolkit/`：工具包目录
> 　　　- `sensor_utils.py`：传感器相关工具（字符串格式化、告警去重）
> 　　　- `flight_utils.py`：飞行相关工具（电量判定、返航建议）
> 　　　- `__init__.py`：标记该目录为包，可按包路径导入模块
> 　　主程序通过不同导入方式调用工具函数，最后输出一份可核对的“工具箱报告”。

**项目定位**

> 本项目定位为"代码组织与复用"的入门训练，覆盖：模块导入方式、自定义模块、模块包的组织与导入、标准库与第三方库的安装与使用。


**需求分析**

> 本项目需要完成以下任务：
> - 创建包目录 `uav_toolkit`，并包含 `__init__.py`
> - 在 `sensor_utils.py` 与 `flight_utils.py` 中编写可复用函数（函数内部带注释）
> - 在 `main.py` 中分别演示多种导入方式，并调用这些函数输出结果
> - 使用至少 1 个标准库（如 `random` 或 `math` 或 `datetime`）完成一个小功能
> - 给出第三方库安装方式并完成一次“安装 + 验证导入”演示（与无人机应用相关）

**项目代码**
`main.py`（项目四：无人机“传感器工具箱”——模块、包与库）

本项目为多文件工程，代码按文件名分块给出。

## 3.4.1 任务一：模块基础

模块用于把可复用的代码组织到独立的 `.py` 文件中，再通过 `import` 在其他文件里使用。
模块就像按主题分装好的工具盒，需要某个功能时把对应盒子取出来即可。

**1.模块的导入**

模块（module）就是一个 `.py` 文件。把可复用的功能写进模块，就能在其他脚本中通过 `import` 复用。
模块像“工具箱里的一个抽屉”：抽屉里装着一类工具（函数/变量）。需要时打开抽屉（导入），即可使用工具。

模块导入方式如表3-4所示。

<p align="center"><strong>表 3-4 模块导入方式表</strong></p>

| 导入方式                   | 语法格式                    | 示例                      | 说明                     |
| -------------------------- | --------------------------- | ------------------------- | ------------------------ |
| 导入整个模块               | `import 模块名`           | `import math`           | 用 `math.sqrt()` 调用  |
| 导入并起别名               | `import 模块名 as 别名`   | `import random as rd`   | 用 `rd.randint()` 调用 |
| 导入指定成员               | `from 模块名 import 名称` | `from math import sqrt` | 直接用 `sqrt()`        |
| 导入所有成员（不推荐滥用） | `from 模块名 import *`    | `from math import *`    | 名称可能冲突             |

**模块导入工作机制**

`import` 会把目标模块加载到内存（若已加载则复用缓存），并执行模块文件顶层代码一次；之后通过“模块名.成员”访问其中定义的函数、变量等。因此，模块顶层通常只放“定义”，避免放大量会自动执行的业务逻辑。

**标准库模块导入示例**

```python
import random as rd

# 核心：调用 rd.randint() 生成模拟值
temp_c = rd.randint(20, 35)
print("模拟温度：", temp_c, "°C")
```

:::{admonition} 【AI辅助小课堂】导入方式改写
:class: tip
把示例发给 AI，让 AI 分别用“import random”“from random import randint”两种方式改写成等价代码，并说明调用点如何变化。把改写代码复制运行核对输出。
:::

:::{admonition} 练习：模块导入
:class: important
用标准库 `math` 计算无人机水平位移的距离：给定 `dx=3, dy=4`，计算 `sqrt(dx*dx + dy*dy)` 并打印。
要求：分别用 `import math` 与 `from math import sqrt` 写出任意一种可运行版本。
:::

**2.自定义模块**

自定义模块就是自己创建的 `.py` 文件。把常用的处理逻辑写进模块，可被多个脚本复用。
自定义模块像“自制工具”，你把常用小功能做好放进抽屉，下次直接拿来用。

**自定义模块与调用过程示例**

**文件结构**

```text
project_root/
├─ main.py
└─ uav_toolkit/
   ├─ __init__.py
   ├─ sensor_utils.py
   └─ flight_utils.py
```

**文件1：uav_toolkit/__init__.py**

该文件可以为空，用于标记目录为“包”。

```python
# __init__.py
# 该文件存在即可把 uav_toolkit 标记为一个包
```

**文件2：uav_toolkit/sensor_utils.py**

```python
"""
sensor_utils.py
传感器工具模块：告警去重、传感器列表格式化
"""

def unique_alarms(alarms):
    # 核心：集合去重
    return list(set(alarms))

def format_sensors(sensors):
    # 核心：把列表拼成一行字符串
    # 不使用 join 的高级写法也可以，这里用已学字符串拼接
    text = "Sensors: "
    i = 0
    while i < len(sensors):
        text += sensors[i]
        if i != len(sensors) - 1:
            text += ", "
        i += 1
    return text
```

**文件3：uav_toolkit/flight_utils.py**

```python
"""
flight_utils.py
飞行工具模块：电量判定、返航建议
"""

def can_takeoff(battery_percent):
    # 核心：用 if 判断电量是否足够
    if battery_percent >= 30:
        return True
    return False

def rth_suggest(battery_percent):
    # 核心：返回返航建议字符串
    if battery_percent < 20:
        return "建议立即返航"
    if battery_percent < 40:
        return "建议准备返航"
    return "电量充足"
```

**文件4：main.py（调用自定义模块）**

```python
"""
main.py
主程序：导入自定义模块并输出工具箱报告
"""

# 方式1：导入整个模块（包.模块）
import uav_toolkit.sensor_utils as su

# 方式2：从模块导入指定函数
from uav_toolkit.flight_utils import can_takeoff, rth_suggest

uav_id = "UAV-07"
battery_percent = 28
sensors = ["GPS", "IMU", "Barometer"]
alarms = ["GPS_WEAK", "GPS_WEAK", "IMU_WARN"]

print("=== 传感器工具箱报告 ===")
print("无人机：", uav_id)
print("电量：", battery_percent, "%")

# 调用 su.format_sensors（模块名.函数名）
print(su.format_sensors(sensors))

# 调用从 flight_utils 导入的函数
print("是否允许起飞：", can_takeoff(battery_percent))
print("返航建议：", rth_suggest(battery_percent))

# 告警去重
print("原始告警：", alarms)
print("去重告警：", su.unique_alarms(alarms))
print("=== 报告结束 ===")
```

:::{admonition} 【AI辅助小课堂】导入路径诊断
:class: tip
把你的工程目录截图（或文字结构）发给 AI，让 AI 检查：包目录是否含 `__init__.py`、导入路径是否与目录一致，并让 AI 给出“从根目录运行 main.py”的正确命令。按提示修正后运行核对。
:::

:::{admonition} 练习：自定义模块
:class: important
在 `uav_toolkit/sensor_utils.py` 中新增函数 `count_alarms(alarms)`，返回告警条目数（用 `len`）。
在 `main.py` 中导入并调用该函数，打印“告警数量”。要求工程可运行。
:::

## 3.4.2 任务二：模块包

模块包（package）是“装模块的目录”，当一个项目有多个模块时，使用包可以把代码按功能分组，导入路径更清晰。
包像“工具箱”，模块像“抽屉”，工具箱里可以有多个抽屉，每个抽屉装一类工具。

**包的组织形式与导入机制**

- 当目录中存在 `__init__.py` 时，该目录就成为包。导入时使用“包名.模块名”的路径定位模块
- 导入机制本质上依赖 Python 的模块搜索路径，运行脚本所在目录通常会加入搜索路径，因此应从工程根目录运行主程序，保证包路径可被找到

**从包导入模块的两种方式示例**

以下代码假设工程结构与前文一致，可直接在 `main.py` 中替换演示。

```python
# 方式1：导入包内模块并起别名
import uav_toolkit.sensor_utils as su
print(su.unique_alarms(["A", "A", "B"]))

# 方式2：从包内模块导入函数
from uav_toolkit.flight_utils import rth_suggest
print(rth_suggest(25))
```

:::{admonition} 【AI辅助小课堂】包与模块的名词对照
:class: tip
让 AI 根据你的工程结构，指出哪些是“包”、哪些是“模块”、哪些是“主程序脚本”。并让 AI 写出一条正确的导入语句用于调用 `format_sensors()`。运行核对。
:::

:::{admonition} 练习：模块包导入
:class: important
在 `main.py` 中使用 `from uav_toolkit.sensor_utils import format_sensors` 方式导入函数，
然后打印 `format_sensors(["GPS","IMU"])` 的结果。要求可运行。
:::

## 3.4.3 任务三：库（标准库、第三方库）

库（library）是可复用代码的集合，Python 自带的称为标准库，需要额外安装的称为第三方库。
标准库像 Python 随带的工具箱。第三方库像后装的扩展包，需要安装后才能使用。

第三方库的常见安装方式如表3-5所示。

<p align="center"><strong>表 3-5 第三方库安装方式表</strong></p>

| 安装类型             | 使用场景                | 命令 / 操作方式                                                  | 说明与教学提示                                 |
| -------------------- | ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 在线安装（默认）     | 有网络、官方源可访问    | `pip install 库名`                                             | 最基础方式，默认从 PyPI 下载                   |
| 在线安装（稳妥写法） | 防止 pip 指向错误解释器 | `python -m pip install 库名`                                   | **推荐课堂使用**，确保与当前 python 匹配 |
| 在线安装（加镜像源） | 国内网络慢 / 失败       | `pip install 库名 -i https://pypi.tuna.tsinghua.edu.cn/simple` | 常用国内镜像源（清华）                         |
| 在线安装（指定版本） | 项目要求固定版本        | `pip install 库名==版本号`                                     | 如：`pandas==2.2.3`                          |
| 指定版本 + 镜像      | 国内网络 + 固定版本     | `pip install 库名==版本号 -i 镜像地址`                         | 教学、竞赛、生产环境常见                       |
| 批量安装             | 项目依赖统一管理        | `pip install -r requirements.txt`                              | 项目级安装方式                                 |
| 离线安装（下载包）   | 有网电脑准备离线包      | `pip download 库名 -d 目录`                                    | 提前下载 `.whl` 文件                         |
| 离线安装（目录安装） | 无网络环境              | `pip install --no-index --find-links=目录 库名`                | **不访问网络**                           |
| 离线安装（whl 文件） | 已有安装包              | `pip install xxx.whl`                                          | 最直观、成功率高                               |
| PyCharm 图形界面     | GUI 操作                | Settings → Python Interpreter →`+` → Install                | 注意选择**正确解释器**                   |

**示第三方库安装与验证示例**

- 无人机定位/测绘任务常见地理坐标处理需求，第三方库 `geopy` 可用于距离计算与地理工具
- 安装完成后，可用以下代码验证“能导入 + 能读取版本”

```bash
pip install geopy
```

```python
# 验证导入是否成功：能打印版本号即可
import geopy
print("geopy version =", geopy.__version__)
```

:::{admonition} 第三方库安装提示
:class: warning
若出现 “pip 不是内部或外部命令”，说明环境变量未生效或未使用正确解释器。可尝试在 PyCharm 终端执行，或使用 `python -m pip install 包名`。
:::

:::{admonition} 【AI辅助小课堂】安装命令改写为当前解释器
:class: tip
把你的 Python 版本与解释器路径（PyCharm 解释器信息）发给 AI，让 AI 给出对应的安装命令（例如 `python -m pip install geopy`），并说明如何验证安装成功。按命令执行后运行验证代码核对。
:::

:::{admonition} 练习：安装一个与无人机应用相关的第三方库
:class: important
任选其一完成“安装 + 验证导入”：

- 安装 `geopy` 并打印版本号
- 安装 `pymavlink`（无人机 MAVLink 通信库）并仅验证能导入：`import pymavlink`
  要求：写出安装命令与最小验证代码（可运行）。
  :::

---

# 3.5 项目五：无人机“任务时间轴记录器”——time 与 datetime

**项目简介**

> 本项目把“任务事件”抽象成一个字典列表，每条事件至少包含：事件名、时间戳、格式化时间字符串、结构化时间或 datetime 对象。程序先用 `time.time()` 记录事件时间戳，再用 `time.strftime()` 与 `datetime.now().strftime()` 输出可读时间；随后演示字符串与结构化时间的互转（`time.strptime`、`time.localtime`、`time.mktime`），最后用“时间戳加减”和 `timedelta` 计算任务耗时与预计到达时间。

**项目定位**

> 本项目定位为"时间处理基础能力训练"，覆盖 `time` 模块，掌握时间戳、结构化时间、格式化字符串三种格式及其互转， `datetime` 模块，掌握当前时间获取、格式转换、`timedelta` 时间加减。

**需求分析**

> 本项目编写脚本 `uav_time_log.py` 需要完成以下功能：
> - 记录三个事件：`TAKEOFF`、`RTH`、`LAND`（时间可用当前时间模拟）
> - 对每个事件输出三种时间表达：时间戳、格式化字符串、结构化时间或 datetime
> - 完成至少 2 类“时间格式互转”：　　　- 字符串 ↔ 结构化时间（`strftime/strptime`）　　　- 结构化时间 ↔ 时间戳（`localtime/mktime`）
> - 完成 2 类“时间加减”：　　　- 用时间戳做秒级加减（提示要求）　　　- 用 `timedelta` 做分钟/小时级加减
> - 输出一份可核对的《任务时间轴报告》

**项目代码**

```python

# uav_time_log.py
# 项目五：无人机“任务时间轴记录器”——time 与 datetime


import time
from datetime import datetime, timedelta

uav_id = "UAV-07"
fmt = "%Y-%m-%d %H:%M:%S"

print("=== 无人机任务时间轴报告 ===")
print("无人机：", uav_id)
print("----------------------------------")

# 记录事件：用时间戳作为“可计算”的统一底座
takeoff_ts = time.time()                 # 起飞时间戳
rth_ts = takeoff_ts + 8                  # 模拟：8 秒后触发返航（用时间戳加减）
land_ts = rth_ts + 12                    # 模拟：12 秒后落地

# 输出：时间戳 -> 格式化字符串（可读）
takeoff_str = time.strftime(fmt, time.localtime(takeoff_ts))
rth_str = time.strftime(fmt, time.localtime(rth_ts))
land_str = time.strftime(fmt, time.localtime(land_ts))

print("TAKEOFF 时间戳：", takeoff_ts)
print("TAKEOFF 可读：", takeoff_str)
print("RTH     可读：", rth_str)
print("LAND    可读：", land_str)

print("----------------------------------")

# 字符串 -> 结构化时间 -> 时间戳（反向验证）
parsed_struct = time.strptime(takeoff_str, fmt)      # 字符串 -> 结构化时间
parsed_ts = time.mktime(parsed_struct)               # 结构化时间 -> 时间戳
print("strptime 得到结构化时间：", parsed_struct)
print("mktime 还原时间戳：", parsed_ts)

print("----------------------------------")

# datetime：获取当前时间并做 timedelta 加减
dt_now = datetime.now()                               # 当前本地时间
eta_dt = dt_now + timedelta(minutes=5)                # 预计 5 分钟后到达

print("datetime.now()：", dt_now.strftime(fmt))
print("预计到达( +5min )：", eta_dt.strftime(fmt))

# 任务耗时：用时间戳直接相减（秒）
duration_sec = land_ts - takeoff_ts
print("任务耗时(秒)：", duration_sec)

print("=== 报告结束 ===")
```

## 3.5.1 任务一：time 模块概述

`time` 模块提供与时间戳、结构化时间、格式化字符串相关的基础能力，适合记录时间点、转换格式与做秒级计算。可以把同一时刻理解为三种表示法，数字便于计算，字符串便于展示，结构化时间便于拆字段。

- 时间戳是一个数字，最适合加减与求差值
- 格式化字符串是可读文本，最适合打印与报表
- 结构化时间是字段化对象，最适合取年/月/日等字段

time 模块三种时间格式说明如表 3-6 所示。

<p align="center"><strong>表 3-6 time模块三种时间格式</strong></p>

| 格式                      | 典型形态                  | 作用                 | 示例                 |
| ------------------------- | ------------------------- | -------------------- | -------------------- |
| 时间戳（timestamp）       | `1700000000.123`        | 计算（加减、差值）   | `time.time()`      |
| 格式化字符串（string）    | `2025-12-23 20:15:30`   | 展示（报表输出）     | `time.strftime()`  |
| 结构化时间（struct_time） | `time.struct_time(...)` | 取字段（年/月/日…） | `time.localtime()` |

time 三种时间格式的转换关系如图 3-1 所示。

```text
                 ┌───────────────────────────────┐
                 │           时间戳 timestamp      │
                 │        (秒数，适合加减)         │
                 └───────────────┬───────────────┘
                                 │ time.time()
                                 │
                ┌────────────────▼────────────────┐
                │   时间戳 -> 结构化时间 struct_time │
                │   time.localtime(ts) / time.gmtime(ts) │
                └────────────────┬────────────────┘
                                 │
                time.asctime(st) │                     time.ctime(ts)
     ┌───────────────────────────▼─────────────────────────────┐
     │                  可读英文字符串（简易格式）               │
     │     time.asctime(struct_time) / time.ctime(timestamp)   │
     └───────────────────────────┬─────────────────────────────┘
                                 │
                                 │ time.strftime(fmt, struct_time)
                                 │ time.strptime(str, fmt)
     ┌───────────────────────────▼─────────────────────────────┐
     │              格式化时间字符串 formatted string            │
     │                 例：2025-12-23 20:15:30                  │
     └───────────────────────────┬─────────────────────────────┘
                                 │
                                 │ time.mktime(struct_time)
                                 ▼
                       回到 时间戳 timestamp
```

<p align="center"><strong>图3-1  time 模块三种时间格式与函数互转示意图</strong></p>

## 3.5.2 任务二：time.time、time.strftime、time.strptime

`time.time()` 用于获取当前时间戳，`time.strftime()` 用于把结构化时间格式化成字符串，`time.strptime()` 用于把字符串解析回结构化时间。
它们像“记录、打印、反向读取”的一条链路，先记下时间点，再写成可读文本，需要时再从文本取回字段。

**time.time + strftime + strptime 示例**

本示例模拟“起飞事件”，先取时间戳，再转本地结构化时间，格式化输出，最后把字符串解析回结构化时间。

```python
import time

fmt = "%Y-%m-%d %H:%M:%S"

# 获取当前时间戳
ts = time.time()

# 时间戳 -> 结构化时间 -> 格式化字符串
st = time.localtime(ts)
text = time.strftime(fmt, st)

# 字符串 -> 结构化时间
st2 = time.strptime(text, fmt)

print("时间戳：", ts)
print("格式化：", text)
print("解析回结构化：", st2)
```

:::{admonition} 【AI辅助小课堂】格式串含义核对
:class: tip
把 `"%Y-%m-%d %H:%M:%S"` 发给 AI，让 AI 标注每个占位符的含义（年/月/日/时/分/秒），并预测输出字符串的结构。运行示例核对格式。
:::

:::{admonition} 练习：起飞时间记录
:class: important
用 `time.time()` 记录起飞时间戳 `takeoff_ts`，用 `time.strftime()` 输出为 `YYYY-MM-DD HH:MM:SS`，再用 `time.strptime()` 解析回结构化时间并打印。要求代码可直接运行。
:::

## 3.5.3 任务三：time.mktime、time.localtime、time.gmtime

`time.localtime(ts)` 与 `time.gmtime(ts)` 都是把时间戳转成结构化时间，区别在于一个按本地时区，一个按 UTC。
可以把它们理解为同一时刻的两套时区视图，计算时仍以时间戳为准。

**localtime / gmtime 对比 + mktime 示例：**

本示例用同一个时间戳分别生成本地结构化时间与 UTC 结构化时间，并把本地结构化时间用 `mktime` 还原回时间戳。

```python
import time

ts = time.time()

local_st = time.localtime(ts)   # 本地结构化时间
utc_st = time.gmtime(ts)        # UTC 结构化时间

back_ts = time.mktime(local_st) # 本地结构化时间 -> 时间戳

print("ts：", ts)
print("localtime：", local_st)
print("gmtime：", utc_st)
print("mktime(localtime) 还原：", back_ts)
```

:::{admonition} 【AI辅助小课堂】本地与UTC差异观察
:class: tip
让 AI 说明：`localtime` 与 `gmtime` 输出的结构化时间中，哪一个字段最直观体现时区差异。运行示例对照两个输出。
:::

:::{admonition} 练习：返航时间推算
:class: important
用 `takeoff_ts = time.time()` 记录起飞时间戳；用“时间戳加减”得到 `rth_ts = takeoff_ts + 120`（两分钟后返航）；
分别用 `localtime(rth_ts)` 与 `gmtime(rth_ts)` 打印结构化时间。要求代码可直接运行。
:::

## 3.5.4 任务四：time.asctime、time.ctime

`time.asctime(struct_time)` 与 `time.ctime(timestamp)` 用于把结构化时间或时间戳快速转成可读英文字符串，输出格式固定。
它们像“快速打印条”，适合调试查看，不适合需要自定义格式的正式报表。

**asctime / ctime 示例**

本示例分别演示结构化时间与时间戳转成简易英文可读字符串。

```python
import time

ts = time.time()
st = time.localtime(ts)

print("asctime(struct_time)：", time.asctime(st))
print("ctime(timestamp)：", time.ctime(ts))
```

:::{admonition} 【AI辅助小课堂】固定格式识别
:class: tip
让 AI 写出 `time.ctime()` 典型输出的“字段顺序”（星期、月份、日期、时间、年份等），并说明它为什么不适合“自定义格式报表”。运行示例核对。
:::

:::{admonition} 练习：落地时间快速输出
:class: important
记录 `land_ts = time.time()`，分别用 `time.ctime(land_ts)` 与 `time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(land_ts))` 输出两行时间，观察差异。要求代码可运行。
:::

:::{important}
时间的加减计算优先使用“时间戳”。先用 `time.time()` 得到时间戳，再以“秒”为单位加减，例如：`end_ts = start_ts + 90`。
:::

## 3.5.5 任务五：datetime 模块概述

`datetime` 模块提供面向对象的时间表示，`datetime` 对象既能取字段也能格式化，并能与 `timedelta` 做加减。
可以把 `datetime` 看成一张“带方法的时间卡片”，既能读取年/月/日，也能生成新的时间点。

**获取当前时间 datetime.today、datetime.now**

`datetime.today()` 与 `datetime.now()` 都返回“当前本地日期时间”。在多数场景下，两者效果相同；`now()` 更常用于强调“此刻时间”，并可扩展到带时区的写法。
本任务以 `dt = datetime.now()` 为基准展示常见操作方法，`dt` 就是一张“时间卡片”，可以从中拿日期、拿时间、改字段、转元组、查星期、转 ISO 字符串等。

**datetime.now()常见操作示例**

该示例展示“取字段 + 替换 + 格式化”的组合。

```python
from datetime import datetime

dt = datetime.now()

print("dt =", dt)
print("date() =", dt.date()) # 取日期部分
print("time().strftime =", dt.time().strftime("%H:%M:%S")) # 取时间并格式化 
print("replace(09:00:00) =", dt.replace(hour=9, minute=0, second=0)) # 替换字段生成新对象
print("weekday() =", dt.weekday())  # 获取星期（周一=0）
print("isoformat() =", dt.isoformat()) # 获取ISO 字符串
print("ctime() =", dt.ctime())   # 转换为可读字符串  
print("strftime =", dt.strftime("%Y-%m-%d %H:%M:%S"))  # 转换为自定义格式化
```

:::{admonition} 【AI辅助小课堂】方法输出类型判断
:class: tip
把表3-11中任意 5 个方法名发给 AI，让 AI 判断它们返回的是“字符串/数字/日期对象/元组结构”等，并预测示例输出的形态。运行示例核对。
:::

:::{admonition} 练习：当前时间打点
:class: important
用 `dt = datetime.now()` 获取当前时间；输出一行“无人机打点：YYYY-MM-DD HH:MM:SS”。
再输出今天是星期几（用 `weekday()` 的数字形式即可）。要求代码可运行。
:::

:::{index} single: datetime.strptime()
:::
:::{index} single: fromtimestamp()
:::

## 3.5.6 任务六：datetime时间格式转换

时间格式转换用于在“时间戳、字符串、datetime 对象”之间切换，以满足计算、展示与解析需求。
可以简单记成三句话。计算偏向时间戳，展示偏向字符串，处理偏向 `datetime` 对象。

**时间戳/字符串与datetime时间转换示例**

本示例同时展示“本地/UTC”与“字符串解析”。

```python
from datetime import datetime

fmt = "%Y-%m-%d %H:%M:%S"

ts = 1700000000  # 示例时间戳（固定值便于核对）
dt_local = datetime.fromtimestamp(ts) # 时间戳 → 本地 datetime
dt_utc = datetime.utcfromtimestamp(ts) # 时间戳 → UTC datetime

text = "2025-12-23 20:00:00"
dt_parsed = datetime.strptime(text, fmt) # 字符串 → datetime 

print("fromtimestamp =", dt_local.strftime(fmt)) # 转换为自定义格式化
print("utcfromtimestamp =", dt_utc.strftime(fmt))
print("strptime =", dt_parsed.strftime(fmt))
```

:::{admonition} 【AI辅助小课堂】同一时间戳的两种视角
:class: tip
让 AI 解释：`fromtimestamp` 与 `utcfromtimestamp` 为什么可能显示不同“小时”，并指出它们都对应同一个时间戳。运行示例观察差异。
:::

:::{admonition} 练习：任务开始时间解析
:class: important
给定字符串 `start_text = "2025-12-23 08:30:00"`，用 `datetime.strptime` 解析为 datetime，
再用 `strftime("%H:%M:%S")` 输出开始时间的时分秒。要求代码可运行。
:::

:::{index} single: timedelta
:::
:::{index} single: 时间加减
:::

## 3.5.7 任务七：时间的加减计算

`timedelta` 表示“时间间隔”，可用于对 `datetime` 做加减运算（加上一个间隔得到未来时刻，减去一个间隔得到过去时刻），也可用两个 datetime 相减得到间隔。
`timedelta` 像“时长尺子”，把 5 分钟、2 小时、1 天等间隔表达出来，然后拿去对时间对象做运算。

**timedelta 加减与差值示例**

本示例模拟“预计到达时间 ETA”与“任务耗时”。

```python
from datetime import datetime, timedelta

fmt = "%Y-%m-%d %H:%M:%S"

start = datetime.now()                       # 任务开始
eta = start + timedelta(minutes=12)          # 预计 12 分钟后到达
end = start + timedelta(minutes=20, seconds=30)

duration = end - start                       # datetime 相减得到 timedelta

print("开始：", start.strftime(fmt))
print("预计到达：", eta.strftime(fmt))
print("结束：", end.strftime(fmt))
print("耗时：", duration)                    # 直接打印 timedelta
```

:::{admonition} 【AI辅助小课堂】把耗时转成秒
:class: tip
让 AI 说明如何把 `duration` 转为秒数（提示：`duration.total_seconds()`），并预测示例中耗时秒数是多少。运行示例并增加打印核对。
:::

:::{admonition} 练习：航点预计到达
:class: important
用 `start = datetime.now()` 作为起飞时间；设定“到达第一个航点需要 3 分 40 秒”，用 `timedelta` 计算 `eta` 并按 `YYYY-MM-DD HH:MM:SS` 输出。
:::

---

# 3.6 项目六：无人机“数据自检与计算小工具”——内置函数与常用库函数

**项目简介**

> 本项目把无人机一次“简化任务数据”组织为：传感器列表、采样列表、参数表达式、航点候选列表、航向角等。程序先做数据长度与类型检查，再把字符串表达式求值生成阈值，随后用数学/随机/三角函数完成“统计—抽取—换算”，最终输出一份可核对的自检与计算结果。

**项目定位**

> 本项目定位为"常用函数工具箱"的入门训练，包括内置函数：`len`、`eval`、`id`、`type` 与常用类型转换；数学函数：从 `math` 与内置函数中选取常用项完成基础计算；随机函数：从 `random` 中选取常用项完成抽取/打乱/均匀随机；三角函数：从 `math` 中选取关键项完成角度与距离的基础处理。


**需求分析**

> 本项目编写脚本 `uav_tool_check.py` 需要完成以下功能：
> - 准备数据：`uav_id`、`sensors`、`alt_samples`、`expr`、`waypoints`、`heading_deg` 等
> - 用 `len()` 输出传感器数量、采样数量，并做简单判断
> - 用 `eval()` 计算一个“阈值/规则表达式”（只演示可信固定表达式，不读取外部输入）
> - 用 `type()` 与类型转换函数检查并把“字符串数字”转为数值
> - 用 `math` 与内置数学函数做：绝对值、四舍五入、平方根/距离近似等（选取关键项即可）
> - 用 `random` 做：随机抽取、随机小数、打乱（选取关键项即可）
> - 用三角函数做：角度 ↔ 弧度、`sin/cos/atan2/hypot` 等基础换算（选取关键项即可）
> - 输出《无人机数据自检报告》

**项目代码**

```python

# uav_tool_check.py
# 项目六：无人机“数据自检与计算小工具”——内置函数与常用库函数

import math
import random

uav_id = "UAV-07"

# 任务数据（示例）
sensors = ["GPS", "IMU", "Barometer", "Camera"]
alt_samples = [52.5, 53.1, 52.9, 53.6, 53.0]
waypoints = ["P1", "P2", "P3", "P4"]

# 表达式：固定字符串（仅示范 eval 的作用，不从外部输入）
expr = "20 + 5 * 2"  # 计算得到阈值 30

# 航向角（度）与目标偏移（米）
heading_deg_text = "45"  # 用于演示类型转换
dx = 3
dy = 4

print("=== 无人机数据自检报告 ===")
print("无人机：", uav_id)
print("----------------------------------")

# len：检查列表长度
print("传感器数量：", len(sensors))
print("高度采样数量：", len(alt_samples))

# eval：从表达式得到阈值
threshold = eval(expr)  # 核心：把字符串表达式求值
print("阈值表达式：", expr, "=>", threshold)

# type + 类型转换：把字符串数字转成整型
print("heading_deg_text 的类型：", type(heading_deg_text))
heading_deg = int(heading_deg_text)  # 核心：类型转换
print("heading_deg 的类型：", type(heading_deg), "值：", heading_deg)

# math + 内置数学：距离与角度换算
distance = math.hypot(dx, dy)                 # 核心：直角三角形斜边
heading_rad = math.radians(heading_deg)       # 度 -> 弧度
cos_val = math.cos(heading_rad)
sin_val = math.sin(heading_rad)

print("位移(dx,dy)=(", dx, ",", dy, ")  距离=", distance)
print("航向(度)->(弧度)：", heading_deg, "->", heading_rad)
print("cos, sin：", round(cos_val, 3), round(sin_val, 3))

# random：随机抽取与打乱
random.seed(7)  # 核心：固定种子便于课堂复现
selected_wp = random.choice(waypoints)
random.shuffle(waypoints)  # 原地打乱

print("随机抽取航点：", selected_wp)
print("打乱后的航点列表：", waypoints)

print("----------------------------------")
print("=== 报告结束 ===")
```

:::{index} single: len函数
:::

## 3.6.1 任务一：len 函数

`len()` 用于获取“容器中元素的数量”，常用于检查列表、字符串、字典等是否为空，以及统计数据条目数。
把 `len()` 看作“点数器”：给它一个容器，它就返回里面有多少个元素。

**len 统计传感器数量示例**

本示例从项目中抽取“传感器列表”，用 `len()` 输出数量并做最简单的合格判定。

```python
sensors = ["GPS", "IMU", "Barometer", "Camera"]

count = len(sensors)  # 核心：统计元素个数
print("传感器数量：", count)

if count >= 3:
    print("传感器数量合格")
else:
    print("传感器数量不足")
```

:::{admonition} 【AI辅助小课堂】输出行数预测
:class: tip
把 `sensors` 改成只有 2 个元素发给 AI，让 AI 预测会输出哪两行提示。运行代码核对预测结果。
:::

:::{admonition} 练习：len
:class: important
给定高度采样 `alt_samples = [50.1, 49.8, 50.0]`，用 `len()` 输出采样数量；若少于 5 条，输出“采样不足”。要求代码可运行。
:::

:::{index} single: eval函数
:::

## 3.6.2 任务二：eval 函数

`eval()` 用于把“字符串形式的表达式”当作 Python 表达式计算，并返回结果。
把 `eval()` 看作“把写在纸上的算式交给解释器计算”。例如 `"3+2"` 会得到数值 `5`。

:::{admonition} eval 使用警告
:class: warning
`eval()` 不能对不可信输入使用。示例只对“固定写死的表达式字符串”求值，不从用户输入或外部文件读取表达式。
:::

**告警阈值表达式求值示例**

本示例从项目中抽取 `expr`，计算得到阈值 `threshold`。

```python
expr = "20 + 5 * 2"  # 固定表达式：仅用于演示
threshold = eval(expr)  # 核心：字符串表达式求值

print("阈值表达式：", expr)
print("阈值结果：", threshold)
```

:::{admonition} 【AI辅助小课堂】表达式改写核对
:class: tip
把表达式改为 `"100 // 3 + 7"` 发给 AI，让 AI 先手算预测结果，再运行代码核对是否一致。
:::

:::{admonition} 练习：eval
:class: important
设定 `expr = "60 - 12 * 3"` 表示“安全电量阈值计算式”，用 `eval()` 得到阈值并打印。要求代码可运行。
:::

:::{index} single: id函数
:::
:::{index} single: 对象标识
:::

## 3.6.3 任务三：id 函数

`id()` 返回对象的“身份标识”，可理解为对象在内存中的标识号，它用于区分“是不是同一个对象”。
把 `id()` 看作“对象的身份证号”，两个变量值看起来一样，并不一定是同一个对象；`id` 可以帮助观察对象是否相同。

**同值与同对象观察示例**

本示例对比两个列表：内容相同，但通常不是同一个对象。

```python
a = ["GPS", "IMU"]
b = ["GPS", "IMU"]   # 内容相同，但通常是不同对象
c = a               # c 与 a 指向同一个对象

print("id(a) =", id(a))
print("id(b) =", id(b))
print("id(c) =", id(c))

print("a == b：", a == b)   # 值相等
print("a is b：", a is b)   # 是否同一对象
print("a is c：", a is c)
```

:::{admonition} 【AI辅助小课堂】is 与 id 的对应关系
:class: tip
让 AI 说明：当 `a is c` 为 True 时，`id(a)` 与 `id(c)` 的关系是什么。运行示例核对输出。
:::

:::{admonition} 练习：id
:class: important
创建 `waypoints1 = ["P1","P2"]`，再令 `waypoints2 = waypoints1`，打印两者 `id` 并判断 `waypoints1 is waypoints2`。要求代码可运行。
:::

:::{index} single: type函数
:::
:::{index} single: 类型检查
:::

## 3.6.4 任务四：type 函数

`type()` 用于查看对象的数据类型，是排查数据错误与进行类型转换的第一步。
把 `type()` 看作“看标签”，不知道一个数据是什么类型时，先看它的类型标签，再决定如何处理。

**检查任务字段类型示例**

本示例从项目抽取“字符串数字”，用 `type()` 查看并决定转换。

```python
battery_text = "86"           # 字符串
battery_percent = int(battery_text)  # 转成整数

print("battery_text 类型：", type(battery_text))
print("battery_percent 类型：", type(battery_percent))
```

:::{admonition} 【AI辅助小课堂】类型链条描述
:class: tip
让 AI 用一句话描述：本示例中数据从“什么类型”变为“什么类型”，以及为什么需要变。运行示例核对。
:::

:::{admonition} 练习：type
:class: important
定义 `altitude = 52.5`、`uav_id = "UAV-07"`、`is_armed = True`，分别用 `type()` 打印三者类型。要求代码可运行。
:::

:::{index} single: 类型转换
:::
:::{index} single: int函数
:::
:::{index} single: float函数
:::
:::{index} single: str函数
:::

## 3.6.5 任务五：类型转换函数

类型转换函数用于把数据从一种类型转换为另一种类型，常用于“输入数据清洗”“显示输出格式化”“编码与编号转换”。
转换前可用 `type()` 先确认原类型，再选择合适的转换函数。
可以把类型转换理解为“换容器”，同一个信息换一种存放形式，便于下一步计算或展示。

常用类型转换函如表 3-7 所示。

<p align="center"><strong>表 3-7 常用类型转换函数</strong></p>

| 函数         | 描述                       | 简单示例                         |
| ------------ | -------------------------- | -------------------------------- |
| `int(x)`   | 转整数                     | `int("12") -> 12`              |
| `float(x)` | 转浮点数                   | `float("3.5") -> 3.5`          |
| `str(x)`   | 转字符串                   | `str(86) -> "86"`              |
| `repr(x)`  | 转“可再现”字符串         | `repr("A") -> "'A'"`           |
| `list(x)`  | 转列表                     | `list("GPS") -> ['G','P','S']` |
| `dict(x)`  | 转字典（从键值对序列）     | `dict([("a",1)]) -> {'a':1}`   |
| `hex(x)`   | 十进制整数转十六进制字符串 | `hex(255) -> '0xff'`           |
| `oct(x)`   | 十进制整数转八进制字符串   | `oct(8) -> '0o10'`             |
| `ord(ch)`  | 字符转 Unicode 码点        | `ord("A") -> 65`               |
| `chr(n)`   | 码点转字符                 | `chr(65) -> "A"`               |

**把“字符串数字”转为可计算数据示例**

本示例展示 `type()` 检查后用 `int/float` 转换，并把电量转换为十六进制用于“调试显示”。

```python
battery_text = "86"
alt_text = "52.5"

# 核心：先转换再计算
battery = int(battery_text)
altitude = float(alt_text)

print("battery =", battery, "type =", type(battery))
print("altitude =", altitude, "type =", type(altitude))

print("battery hex =", hex(battery))  # 调试显示：0x56
```

:::{admonition} 【AI辅助小课堂】转换失败原因定位
:class: tip
把字符串 `"52.5"` 直接用 `int("52.5")` 会发生什么？让 AI 先解释原因，再给出正确做法（提示：先 `float` 再 `int`）。自行运行验证。
:::

:::{admonition} 练习：类型转换
:class: important
给定 `gps_sat_text = "12"`、`pilot_no = 3`：
1）把 `gps_sat_text` 转为整数并打印；
2）把 `pilot_no` 转为字符串并与 `"PILOT-"` 拼接打印为 `PILOT-3`。要求代码可运行。
:::

:::{index} single: 数学函数
:::
:::{index} single: math模块
:::
:::{index} single: abs函数
:::
:::{index} single: round函数
:::

## 3.6.6 任务六：数学函数

数学函数用于完成常见计算，包括取绝对值、取整、四舍五入、求平方根、求和、取最大/最小等。
它们像一套基础算术工具，用于把一组数字快速汇总成可读的统计结果。

常用数学函数如表 3-8 所示。

<p align="center"><strong>表 3-8 常用数学函数</strong></p>

| 函数              | 来源 | 描述     | 简单示例                    |
| ----------------- | ---- | -------- | --------------------------- |
| `abs(x)`        | 内置 | 绝对值   | `abs(-3) -> 3`            |
| `round(x, n)`   | 内置 | 四舍五入 | `round(3.1415,2) -> 3.14` |
| `max(seq)`      | 内置 | 最大值   | `max([1,3]) -> 3`         |
| `min(seq)`      | 内置 | 最小值   | `min([1,3]) -> 1`         |
| `sum(seq)`      | 内置 | 求和     | `sum([1,2]) -> 3`         |
| `pow(a,b)`      | 内置 | 幂运算   | `pow(2,3) -> 8`           |
| `math.sqrt(x)`  | math | 平方根   | `sqrt(9) -> 3.0`          |
| `math.floor(x)` | math | 向下取整 | `floor(1.9) -> 1`         |
| `math.ceil(x)`  | math | 向上取整 | `ceil(1.1) -> 2`          |

**高度采样统计示例**

本示例用 `max/min/sum/round` 生成“采样摘要”。

```python
import math

alt_samples = [52.5, 53.1, 52.9, 53.6, 53.0]

# 核心：统计值
alt_max = max(alt_samples)
alt_min = min(alt_samples)
alt_avg = sum(alt_samples) / len(alt_samples)

print("最高高度：", alt_max)
print("最低高度：", alt_min)
print("平均高度：", round(alt_avg, 2))

# 核心：取整示例（用于显示）
print("平均高度向下取整：", math.floor(alt_avg))
print("平均高度向上取整：", math.ceil(alt_avg))
```

:::{admonition} 【AI辅助小课堂】平均值与取整关系
:class: tip
让 AI 预测：`floor(alt_avg)` 与 `ceil(alt_avg)` 分别会比 `alt_avg` 小多少/大多少（范围即可），运行示例核对。
:::

:::{admonition} 练习：数学函数
:class: important
给定电量采样 `bats = [86, 83, 80, 78]`：
输出最大值、最小值、平均值（保留 1 位小数）。
:::

:::{index} single: 随机函数
:::
:::{index} single: random模块
:::
:::{index} single: random.choice()
:::
:::{index} single: random.shuffle()
:::

## 3.6.7 任务七：随机函数

随机函数用于模拟不确定性与抽样，例如随机抽取航点、打乱巡检顺序、生成随机扰动值等。
把随机函数理解为“抽签器”，从一个范围或一个列表中随机选出结果，常配合 `seed()` 固定随机序列，便于复现。

常用随机函数如表 3-9 所示。

<p align="center"><strong>表 3-9 常用随机函数</strong></p>

| 函数                           | 描述                     | 简单示例                |
| ------------------------------ | ------------------------ | ----------------------- |
| `random.seed(n)`             | 设置随机种子（便于复现） | `seed(7)`             |
| `random.random()`            | 生成 [0,1) 小数          | `random() -> 0.32...` |
| `random.uniform(a,b)`        | 生成 [a,b] 小数          | `uniform(1,2)`        |
| `random.randrange(a,b,step)` | 生成整数序列中的随机值   | `randrange(0,10,2)`   |
| `random.choice(seq)`         | 从序列随机取一个         | `choice(["P1","P2"])` |
| `random.shuffle(list)`       | 原地打乱列表             | `shuffle(wps)`        |

**随机抽取备选航点示例**

本示例固定随机种子，使输出可复现。

```python
import random

waypoints = ["P1", "P2", "P3", "P4"]

random.seed(7)  # 核心：固定种子，便于复现
picked = random.choice(waypoints)
noise = random.uniform(-0.5, 0.5)

print("随机航点：", picked)
print("模拟高度噪声：", round(noise, 3))

random.shuffle(waypoints)  # 核心：打乱巡检顺序
print("打乱后的航点顺序：", waypoints)
```

:::{admonition} 【AI辅助小课堂】固定种子输出一致性
:class: tip
让 AI 解释：为什么设置同一个 `seed(7)` 后，多次运行会得到相同的“随机航点”和“随机噪声”。运行两次验证输出是否一致。
:::

:::{admonition} 练习：随机函数
:class: important
给定 `waypoints = ["A1","A2","B1","B2"]`：
设置 `seed(10)`，随机抽取一个航点并打印；再 `shuffle` 打乱列表并打印。
:::

:::{index} single: 三角函数
:::
:::{index} single: math.sin()
:::
:::{index} single: math.cos()
:::
:::{index} single: math.radians()
:::
:::{index} single: math.hypot()
:::

## 3.6.8 任务八：三角函数

三角函数用于角度与弧度转换，以及在平面坐标中计算方向角与合位移。可以把二维位移 `(dx, dy)` 看作一个直角三角形，再用对应函数求斜边长度与夹角。

- `hypot(dx,dy)` 求斜边长度
- `atan2(dy,dx)` 求指向角
- 角度与弧度之间用 `degrees/radians` 转换

常用三角函数如表 3-10 所示。

<p align="center"><strong>表 3-10 常用三角函数</strong></p>

| 函数                  | 描述                    | 简单示例                      |
| --------------------- | ----------------------- | ----------------------------- |
| `math.radians(deg)` | 度 → 弧度              | `radians(180) -> 3.1415...` |
| `math.degrees(rad)` | 弧度 → 度              | `degrees(pi) -> 180`        |
| `math.sin(rad)`     | 正弦                    | `sin(radians(30)) -> 0.5`   |
| `math.cos(rad)`     | 余弦                    | `cos(radians(60)) -> 0.5`   |
| `math.atan2(y,x)`   | 由(x,y)求方向角（弧度） | `atan2(1,1)`                |
| `math.hypot(x,y)`   | 合位移长度              | `hypot(3,4) -> 5`           |

**由位移求距离与方向角示例**

本示例把无人机在平面上移动 `(dx,dy)`，计算移动距离与朝向角（度）。

```python
import math

dx = 3
dy = 4

# 核心：距离与方向角
distance = math.hypot(dx, dy)
angle_rad = math.atan2(dy, dx)         # 弧度
angle_deg = math.degrees(angle_rad)    # 转成度

print("位移(dx,dy)=(", dx, ",", dy, ")")
print("距离：", distance)
print("方向角(度)：", round(angle_deg, 2))

# 核心：把方向角转换成弧度再算 sin/cos
rad = math.radians(angle_deg)
print("sin, cos：", round(math.sin(rad), 3), round(math.cos(rad), 3))
```

:::{admonition} 【AI辅助小课堂】atan2 的参数顺序
:class: tip
让 AI 说明：为什么 `atan2(dy, dx)` 的顺序是“先 y 后 x”，并让 AI 用一句话解释它相对 `atan(dy/dx)` 的优势。运行示例核对方向角输出。
:::

:::{admonition} 练习：三角函数
:class: important
设定无人机向东 `dx=10` 米、向北 `dy=10` 米：
1）用 `hypot` 计算距离；
2）用 `atan2` + `degrees` 计算方向角（度）。
:::

---

# 3.7 项目七：综合实践项目——无人机“巡检用时与随机抽检简报器”

## 项目简介

本项目通过编写一个脚本，把一次无人机巡检的"时间记录 + 数据自检 + 随机抽检 + 数学计算"组织成结构化结果，并输出一份可核对的巡检简报。

## 需求分析

无人机在日常巡检中常需要：记录起止时间、统计采样条目、抽取若干航点进行人工复核、计算位移距离与平均高度、对输入字段进行类型校验与转换。实践要求在 90 分钟内完成脚本 `uav_patrol_brief.py`，实现“模块导入 + 函数封装 + 内置函数应用 + 简报输出”四件事。

脚本需要完成以下功能：

1. **数据准备（变量与赋值 + 基本容器）**定义并赋值以下数据（允许自定义内容，但结构必须具备）：

   - 巡检编号 `patrol_id`（字符串，格式示例：`"PAT-20251224-01"`）
   - 无人机编号 `uav_id`（字符串，格式示例：`"UAV-07"`）
   - 飞手 `pilot`（字符串）
   - 起飞时间文本 `start_text`（字符串，格式示例：`"2025-12-24 09:10:00"`）
   - 降落时间文本 `end_text`（字符串，格式示例：`"2025-12-24 09:26:30"`）
   - 航点列表 `waypoints`（列表，至少 6 个字符串）
   - 高度采样 `alt_samples`（列表，至少 6 个浮点数）
   - 传感器列表 `sensors`（列表，至少 4 个字符串）
   - 告警列表 `alarms`（列表，允许重复项）
   - 位移分量 `dx`、`dy`（整型或浮点型）
2. **模块导入（time / datetime / math / random）**在脚本顶部导入：

   - `datetime`（用于解析时间字符串、计算用时）
   - `math`（用于距离与角度相关计算，至少使用 2 个函数）
   - `random`（用于随机抽检，至少使用 2 个函数）
     说明：本项目不强制使用 `time`；若使用可作为加分项。
3. **函数封装（函数定义 + 调用 + 返回值）**至少编写并调用 3 个函数（函数名可自定义，但要求清晰）：

   - `parse_dt(text)`：把时间字符串转为 `datetime`，返回时间对象
   - `calc_duration_sec(start_dt, end_dt)`：计算用时秒数并返回
   - `build_brief(...)`：组织简报字典并返回（返回一个字典）
     函数内部必须出现必要注释，且调用过程清晰。
4. **内置函数与类型转换（len / type / int / float / str / dict 等）**

   - 用 `len()` 统计航点数量、采样数量
   - 用 `type()` 检查关键变量类型（至少 2 处）
   - 演示 1 次类型转换（例如把 `"86"` 转为 `int`，或把 `"52.5"` 转为 `float`）
   - 用 `dict` 保存汇总信息并通过键取值输出关键字段
5. **数学与三角计算（精选）**

   - 用 `math.hypot(dx, dy)` 计算平面位移距离
   - 用 `sum / max / min / round` 统计高度采样（平均/最大/最小至少 2 项）
   - 可选：`math.degrees(math.atan2(dy, dx))` 输出位移方向角（度）
6. **随机抽检（random）**

   - 用 `random.seed(n)` 固定种子便于课堂复现
   - 从 `waypoints` 中 `random.choice()` 随机抽取 2 个航点（抽两次即可）
   - 或用 `random.shuffle()` 打乱航点列表后取前 2 个
7. **输出排版（简报输出 + 注释规范）**

   - 输出简报至少包含 4 个板块标题：基本信息 / 用时统计 / 采样摘要 / 抽检与告警
   - 使用字典取值形式（如 `brief["duration_sec"]`）输出至少 3 个字段
   - 代码包含文件头部三引号说明与单行注释；缩进统一 4 空格

## 交付物

- 文件：`uav_patrol_brief.py`
- 运行截图或运行输出文本
- 关键检查点（输出中必须能看到）：
  （1）航点数量与采样数量（len）；
  （2）用时秒数或分钟数（datetime + timedelta 或秒差）；
  （3）距离计算结果（math.hypot）；
  （4）随机抽检航点结果（random.choice 或 shuffle）；
  （5）高度统计至少 2 项（平均/最大/最小）；
  （6）简报字典建立与按键取值输出。

## 评价标准

| 项目     | 合格要求                                                         |
| -------- | ---------------------------------------------------------------- |
| 模块导入 | 正确导入并使用 `datetime`、`math`、`random`（至少各 1 次） |
| 函数使用 | 至少 3 个函数：定义清晰、调用清晰、至少 1 个返回字典             |
| 内置函数 | `len()`、`type()` 至少各出现 1 次并有效                      |
| 类型转换 | 至少 1 次 `int/float/str` 转换并用于后续计算或输出             |
| 计算能力 | 距离计算 + 高度统计（至少 2 项）输出正确                         |
| 随机抽检 | 固定种子 + 抽检结果可复现                                        |
| 代码风格 | 注释齐全、缩进规范、输出分区清晰                                 |

---
