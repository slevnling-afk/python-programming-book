(model2)=

# 模块二：控制语句

---

# 2.1 项目一：无人机"飞行计算与安全判定器"——运算符和表达式

**项目简介**

> 在无人机训练飞行与巡检作业中，需要对飞行数据进行实时计算与安全条件判定。本项目通过编写脚本，运用各类运算符对"飞行时长、飞行距离、电池阈值、告警码、传感器状态"等关键数据进行计算与逻辑判断，最终生成一份结构清晰的飞行计算与安全评估报告。

**项目定位**

> 本项目定位为“运算符入门到综合运用”的实战练习。学习者在一个统一的无人机场景中，依次完成**计算—比较—更新—组合判定—位掩码告警处理—成员与同一性判断—优先级验证**，形成对 Python 运算符体系的整体认识，并能用规范表达式写出可读的判定逻辑。

**需求分析**

> 本项目编写脚本 `uav_flight_calc.py`，完成以下功能：

> - 使用**算术运算符**计算：公里换算、平均速度、剩余电量、功率估算等
> - 使用**关系运算符**比较：电量是否低于阈值、速度是否超限、高度是否超限等
> - 使用**赋值运算符**累加/更新：累计飞行距离、累计电量消耗等
> - 使用**逻辑运算符**组合条件：同时满足多个安全条件、出现任一风险即判定风险
> - 使用**位运算符**处理“告警位掩码”（bitmask）：合并告警、判断某告警是否出现
> - 使用**成员运算符**判断：某告警码是否在告警列表中、某传感器是否在清单中
> - 使用**同一性运算符**比较对象是否为同一对象（强调 `is` 的语义）
> - 理解并验证**运算符优先级**，必要时使用括号明确表达式含义

**项目代码**

```python

# uav_flight_calc.py
# 项目一：无人机飞行计算与安全判定器（运算符综合训练）

# ===== 基础数据（固定数据，便于观察运算结果）=====
uav_id = "UAV-07"
flight_minutes = 18
flight_distance_m = 3600
battery_percent = 38
battery_low_threshold = 30

speed_limit_kmh = 30
altitude_m = 52.5
altitude_limit_m = 120.0

sensors = ["GPS", "IMU", "Barometer", "Camera"]
alarm_list = ["LOW_BAT", "GPS_WEAK", "LOW_BAT"]  # 故意包含重复项

print("=== 无人机飞行计算与安全判定 ===")
print("无人机编号：", uav_id)

# ===== 算术运算符（计算）=====
distance_km = flight_distance_m / 1000
hours = flight_minutes / 60
avg_speed_kmh = distance_km / hours

print("飞行距离(km)：", distance_km)
print("飞行时长(h)：", hours)
print("平均速度(km/h)：", avg_speed_kmh)

# ===== 赋值运算符（累计/更新）=====
total_distance_km = 0
total_distance_km += distance_km

battery_after_takeoff = battery_percent
battery_after_takeoff -= 3  # 起飞阶段消耗 3%

print("累计距离(km)：", total_distance_km)
print("起飞后电量(%)：", battery_after_takeoff)

# ===== 关系运算符（比较）=====
is_low_battery = battery_percent < battery_low_threshold
is_speed_over = avg_speed_kmh > speed_limit_kmh
is_alt_over = altitude_m > altitude_limit_m

print("电量低于阈值？", is_low_battery)
print("速度超限？", is_speed_over)
print("高度超限？", is_alt_over)

# ===== 逻辑运算符（组合条件）=====
# 任一风险：电量低 或 速度超限 或 高度超限
any_risk = is_low_battery or is_speed_over or is_alt_over
# 关键安全条件：电量不低 且 未超限速度 且 未超限高度
all_safe = (not is_low_battery) and (not is_speed_over) and (not is_alt_over)

print("是否存在任一风险？", any_risk)
print("是否全部安全？", all_safe)

# ===== 成员运算符（in / not in）=====
has_gps = "GPS" in sensors
has_rc_lost_alarm = "RC_LOST" in alarm_list

print("传感器包含 GPS？", has_gps)
print("告警列表包含 RC_LOST？", has_rc_lost_alarm)

# ===== 位运算符（告警位掩码）=====
# 定义告警位：每一位代表一种告警
ALARM_LOW_BAT = 1 << 0   # 0001
ALARM_GPS_WEAK = 1 << 1  # 0010
ALARM_IMU_WARN = 1 << 2  # 0100

alarm_mask = 0
alarm_mask |= ALARM_LOW_BAT
alarm_mask |= ALARM_GPS_WEAK

is_low_bat_mask = (alarm_mask & ALARM_LOW_BAT) != 0
is_imu_warn_mask = (alarm_mask & ALARM_IMU_WARN) != 0

print("告警掩码：", alarm_mask)
print("掩码判断：是否低电量告警？", is_low_bat_mask)
print("掩码判断：是否IMU告警？", is_imu_warn_mask)

# ===== 同一性运算符（is / is not）=====
# 同一性：判断是否为同一个对象（不是判断内容相等）
a = ["LOW_BAT", "GPS_WEAK"]
b = ["LOW_BAT", "GPS_WEAK"]
c = a

print("a == b ?", a == b)
print("a is b ?", a is b)
print("a is c ?", a is c)

# ===== 运算符优先级（括号的重要性）=====
expr1 = 2 + 3 * 4
expr2 = (2 + 3) * 4
print("2 + 3 * 4 =", expr1)
print("(2 + 3) * 4 =", expr2)

print("=== 结束：报告生成完毕 ===")
```

## 2.1.1 任务一：算术运算符

:::{index} single: 算术运算符
:::
:::{index} single: 加法 (+)
:::
:::{index} single: 减法 (-)
:::
:::{index} single: 乘法 (*)
:::
:::{index} single: 除法 (/)
:::
:::{index} single: 整除 (//)
:::
:::{index} single: 取余 (%)
:::
:::{index} single: 幂运算 (**)
:::

算术运算符用于对数值做数学运算并得到新的数值结果，常用于单位换算、平均速度、累计距离等计算。
可以把它理解为代码里的“计算器按键”，把已知数据按公式算成指标，当表达式较长时用括号把计算顺序写清楚，避免算错。

以操作数 `a=3，b=2` 为例，Python中各个算术运算符的功能与示例如表 2-1 所示。

<p align="center"><strong>表2-1  Python 算术运算符功能与示例</strong></p>

| 运算符 | 功能             | 示例       | 结果    |
| ------ | ---------------- | ---------- | ------- |
| `+`  | 加法             | `a + b`  | `5`   |
| `-`  | 减法             | `a - b`  | `1`   |
| `*`  | 乘法             | `a * b`  | `6`   |
| `/`  | 除法（得到浮点） | `a / b`  | `1.5` |
| `//` | 整除（向下取整） | `a // b` | `1`   |
| `%`  | 取余             | `a % b`  | `1`   |
| `**` | 幂运算           | `b ** a` | `8`   |

**例如：**

平均速度计算（km/h）

```python
distance_km = flight_distance_m / 1000
hours = flight_minutes / 60
avg_speed_kmh = distance_km / hours
print(avg_speed_kmh)
```

该示例演示用算术运算完成单位换算与平均速度计算。

**例如：**
把字符串当数字相加会报错

```python
flight_minutes = "18"
# hours = flight_minutes / 60      # TypeError：字符串不能直接参与除法
```

该示例用于提醒该写法会导致错误或异常。

:::{admonition} 【AI辅助小课堂】混合运算表达式检查
:class: tip
把“平均速度计算”相关的三行代码发给 AI，要求它逐行解释每个变量的单位，并指出是否存在“单位不一致”的风险，
将 AI 的单位说明与本机运行结果对照核查。
:::

:::{admonition} 练习：算术运算符
:class: important
已知飞行距离 `4800` 米，飞行时长 `24` 分钟，换算距离（km），换算时长（h）， 计算平均速度（km/h） 并输出。
:::

## 2.1.2 任务二：关系运算符

:::{index} single: 关系运算符
:::
:::{index} single: 等于 (==)
:::
:::{index} single: 不等于 (!=)
:::
:::{index} single: 大于 (>)
:::
:::{index} single: 小于 (<)
:::
:::{index} single: 大于等于 (>=)
:::
:::{index} single: 小于等于 (<=)
:::

关系运算符用于比较两个值的大小或是否相等，比较结果是布尔值（`True` 或 `False`），常用于阈值判断（如电量是否低于阈值）。
可以把它理解为一把“比较尺”，量一量是否达标，得到的 True/False 往往直接交给 `if`，或与逻辑运算符组合成更复杂的判定条件。

以操作数 `a=3，b=2` 为例，Python中各个关系运算符的功能与示例如表 2-2 所示。

<p align="center"><strong>表2-2  Python 关系运算符功能与示例</strong></p>

| 运算符 | 功能     | 示例       | 结果      |
| ------ | -------- | ---------- | --------- |
| `==` | 相等     | `a == b` | `False` |
| `!=` | 不相等   | `a != b` | `True`  |
| `>`  | 大于     | `a > b`  | `True`  |
| `<`  | 小于     | `a < b`  | `False` |
| `>=` | 大于等于 | `a >= b` | `True`  |
| `<=` | 小于等于 | `a <= b` | `False` |

**例如：**

```python
# 电量是否低于阈值
is_low_battery = battery_percent < battery_low_threshold 
print(is_low_battery)
```

该示例演示用关系运算符把阈值比较转换为 True/False 结果。

**例如：**

```python
# 用 `=` 代替 `==`会语法错误
if battery_percent = 30:    # SyntaxError：比较应使用 ==
    print("电量等于30")
```

该示例用于提醒该写法会导致错误或异常。

:::{admonition} 【AI辅助小课堂】比较表达式结果预测
:class: tip
把三条比较表达式发给 AI（电量阈值/速度超限/高度超限），要求它先预测每个表达式结果为 True 还是 False，并说明原因，最后在本机运行验证预测是否正确。
:::

:::{admonition} 练习：关系运算符
:class: important
设定：`battery_percent = 29`，`battery_low_threshold = 30`。
- 写出“电量是否低于阈值”的比较表达式并打印结果；
- 再把 `battery_percent` 改为 `30`，用 `>=` 判断“电量是否达到阈值”，并打印结果。
  :::

## 2.1.3 任务三：赋值运算符

:::{index} single: 赋值运算符
:::
:::{index} single: 简单赋值 (=)
:::
:::{index} single: 复合赋值 (+=, -=, *=, /=)
:::

赋值运算符用于把右侧结果绑定到变量，或在原值基础上原地更新变量（如累计、扣减）。
可以把它理解为“把结果写回记录”，`=` 是写入新值，`+=`/`-=` 等是在原记录上增减并写回，如做累计距离、耗电更新等状态维护。

以操作数 x=3 为例，Python中各个赋值运算符的功能与示例如表 2-3 所示。

<p align="center"><strong>表2-3  Python 赋值运算符功能与示例</strong></p>

| 运算符  | 功能       | 示例        | 等价写法       | 结果（设初始 x=3） |
| ------- | ---------- | ----------- | -------------- | ------------------ |
| `=`   | 赋值       | `x = 3`   | —             | `x` 变为 `3`   |
| `+=`  | 加并赋值   | `x += 2`  | `x = x + 2`  | `x` 变为 `5`   |
| `-=`  | 减并赋值   | `x -= 2`  | `x = x - 2`  | `x` 变为 `1`   |
| `*=`  | 乘并赋值   | `x *= 2`  | `x = x * 2`  | `x` 变为 `6`   |
| `/=`  | 除并赋值   | `x /= 2`  | `x = x / 2`  | `x` 变为 `1.5` |
| `//=` | 整除并赋值 | `x //= 2` | `x = x // 2` | `x` 变为 `1`   |
| `%=`  | 取余并赋值 | `x %= 2`  | `x = x % 2`  | `x` 变为 `1`   |
| `**=` | 幂并赋值   | `x **= 2` | `x = x ** 2` | `x` 变为 `9`   |

**例如：**

```python
total_distance_km = 0
total_distance_km += distance_km

battery_after_takeoff = battery_percent
battery_after_takeoff -= 3
```

该示例演示用 += 做累计、用 -= 做扣减更新变量值。

:::{admonition} 【AI辅助小课堂】赋值运算符等价改写
:class: tip
把包含 `+=`、`-=`、`*=` 的三行代码发给 AI，要求它分别改写为“等价的普通赋值写法”，并逐行说明变量值变化，并在本机运行对比两种写法输出是否一致。
:::

:::{admonition} 练习：赋值运算符
:class: important
设定 `battery = 50`：

- 起飞消耗 2%，用 `-=` 更新
- 巡航再消耗 7%，继续用 `-=` 更新
- 打印最终电量
  要求：电量变量名保持不变，仅用赋值运算符更新。
  :::

## 2.1.4 任务四：逻辑运算符

:::{index} single: 逻辑运算符
:::
:::{index} single: 逻辑或 (or)
:::
:::{index} single: 逻辑与 (and)
:::
:::{index} single: 逻辑非 (not)
:::
:::{index} single: 短路规则
:::

逻辑运算符用于把多个布尔条件组合为一个整体条件，结果仍是 `True/False`，常用于"任一风险/全部满足"这类综合判定。
可以把它理解为把多条规则串成一个"总开关"：`or` 表示"有一个满足就通过"，`and` 表示"都满足才通过"，`not` 用来把条件取反。

**1.`or`**

`or` 用于连接两个条件，只要其中一个为真，结果就为真。
`or` 可以理解为“或者”，当左边条件已经为真时，整体结果已确定为真，右边条件不会再计算，这称为**短路**，如无人机安全判定中常用“任一风险触发”的逻辑。 。

Python中 `or` 运算符的功能与示例如表 2-4 所示。

<p align="center"><strong>表 2-4 Python “or” 运算符的功能与示例</strong></p>

| 表达式             | 结果      | 说明     |
| ------------------ | --------- | -------- |
| `True or True`   | `True`  | 左右都真 |
| `True or False`  | `True`  | 左真即可 |
| `False or True`  | `True`  | 右真即可 |
| `False or False` | `False` | 全假才假 |

:::{warning}
`or` 运算符遵循短路规则：

* 左边为 `True`：右边不再计算
* 左边为 `False`：需要计算右边决定结果
  :::

**例如：**

```python
any_risk = is_low_battery or is_speed_over or is_alt_over
print(any_risk)
```

该示例演示用 or 把多个风险条件合并为“任一风险”的判定结果。

:::{admonition} 【AI辅助小课堂】短路现象观察
:class: tip
把 `or` 连接的三个条件发给 AI，要求它写出“在什么情况下只计算左边、不会计算右边”的文字说明，并举一个具体条件组合例子，在本机运行输出对照理解短路规则。
:::

:::{admonition} 练习：or
:class: important
设定：`is_low_battery = False`，`is_speed_over = True`，`is_alt_over = False`。
用 `or` 计算 `any_risk` 并打印，说明为何结果为 True（用一句话）。
:::

**2.`and`**

`and` 用于连接两个条件，只有全部为真，结果才为真。无人机安全判定中常用“所有条件都满足才安全”的逻辑。
`and` 可以理解为“并且”。当左边条件已经为假时，整体结果已确定为假，右边条件不会再计算，这同样是**短路**。

Python中 `and` 运算符的功能与示例如表2-5 所示。

<p align="center"><strong>表2-5 Python中“and”运算符的功能与示例</strong></p>

| 表达式              | 结果      | 说明       |
| ------------------- | --------- | ---------- |
| `True and True`   | `True`  | 全真才真   |
| `True and False`  | `False` | 右假则假   |
| `False and True`  | `False` | 左假则假   |
| `False and False` | `False` | 任一假就假 |

:::{warning}
`and` 运算符遵循短路规则：

* 左边为 `False`：右边不再计算；
* 左边为 `True`：需要计算右边决定结果。
  :::

**例如：**

```python
all_safe = (not is_low_battery) and (not is_speed_over) and (not is_alt_over)
print(all_safe)
```

该示例演示用 not 与 and 组合条件，得到“全部满足才安全”的判定。

:::{admonition} 【AI辅助小课堂】安全条件拆解
:class: tip
把 `all_safe` 这一行发给 AI，要求它把括号中的三个子条件逐个解释为自然语言句子，并说明三个条件为何要用 `and` 连接。
将解释与脚本输出对照核查。
:::

:::{admonition} 练习：and
:class: important
设定：`is_low_battery = False`，`is_speed_over = False`，`is_alt_over = True`。
用 `and` 计算 `all_safe` 并打印，说明为何结果为 False（用一句话）。
:::

**3.`not`**

`not` 用于对布尔值取反：真变假，假变真。无人机判定中常用于表达“不是低电量”“不超限”等条件。
`not` 可以理解为“否定”。它只作用于一个表达式。

Python中 `not` 运算符的功能与示例如表2-6 所示。

<p align="center"><strong>表2-6  Python中"not"运算符的功能与示例</strong></p>

| 表达式        | 结果      |
| ------------- | --------- |
| `not True`  | `False` |
| `not False` | `True`  |

**例如：**

```python
is_low_battery = True
print(not is_low_battery)
```

该示例演示用 not 对布尔条件取反，得到相反的判断结果。

:::{admonition} 【AI辅助小课堂】把 not 条件翻译成中文
:class: tip
把 `not is_low_battery`、`not is_speed_over` 这类表达式发给 AI，要求它逐条翻译成自然语言（中文），并保持“否定关系”准确。
本机运行并对照判断逻辑是否一致。
:::

:::{admonition} 练习：not
:class: important
设定：`is_low_battery = True`：

- 打印 `not is_low_battery`
- 用一句话说明 `not` 的作用
  :::

## 2.1.5 任务五：位运算符

位运算符用于直接操作整数的二进制位，常用“位掩码（bitmask）”把多个开关状态（如多种告警）压缩到一个整数里。
可以把一个整数想成一排灯：每一位是一盏灯（0 灭 1 亮），通过按位与/或/移位等操作来开灯、关灯或检查某盏灯是否亮。

Python中位运算符的功能与示例如表2-7 所示。

<p align="center"><strong>表2-7  Python中位运算符的功能与示例</strong></p>

| 运算符 | 功能     | 示例       | 结果                 |
| ------ | -------- | ---------- | -------------------- |
| `<<` | 左移     | `1 << 2` | `001` → `100`   |
| `>>` | 右移     | `8 >> 2` | `1000` → `10`   |
| `&`  | 按位与   | `6 & 3`  | `110 & 011 = 010`  |
| `\|`  | 按位或   | `6 \| 3`  | `110 \| 011 = 111`  |
| `^`  | 按位异或 | `6 ^ 3`  | `110 ^ 011 = 101`  |
| `~`  | 按位取反 | `~1`     | `1` → `...1110` |

:::{tip}
 `~` 按位取反（补码）：~x = -(x + 1)
:::

**例如：**

```python
ALARM_LOW_BAT = 1 << 0
ALARM_GPS_WEAK = 1 << 1

alarm_mask = 0
alarm_mask |= ALARM_LOW_BAT
alarm_mask |= ALARM_GPS_WEAK

is_low_bat_mask = (alarm_mask & ALARM_LOW_BAT) != 0
print(is_low_bat_mask)
```

该示例演示用位移定义告警位、用 | 写入告警位、用 & 检测告警是否出现。

:::{admonition} 【AI辅助小课堂】位掩码含义解释
:class: tip
把 `ALARM_LOW_BAT = 1 << 0`、`ALARM_GPS_WEAK = 1 << 1` 与 `alarm_mask |= ...` 的代码发给 AI，要求它用二进制形式写出每一步 alarm_mask 的变化过程。
对照脚本输出理解“设置告警位”的含义。
:::

:::{admonition} 练习：位运算符
:class: important
定义三种告警位：低电量、GPS弱、IMU告警（分别用 `1<<0`、`1<<1`、`1<<2`）。
把“低电量”和“IMU告警”写入 `alarm_mask`，再用 `&` 判断 IMU 告警是否出现，并打印 True/False。
:::

## 2.1.6 任务六：成员运算符

成员运算符 `in`/`not in` 用于判断一个元素是否包含在某个序列或集合中，结果为 `True/False`。
可以把它理解为“查清单”：看某个传感器是否在传感器列表里，或某告警码是否出现在告警列表中。

Python中成员运算符的功能与示例如表2-8 所示。

<p align="center"><strong>表2-8  Python中成员运算符的功能与示例</strong></p>

| 运算符     | 功能               | 示例                            | 结果           |
| ---------- | ------------------ | ------------------------------- | -------------- |
| `in`     | 成员判断（存在）   | `"GPS" in sensors`            | `True/False` |
| `not in` | 成员判断（不存在） | `"RC_LOST" not in alarm_list` | `True/False` |

**例如：**

```python
has_gps = "GPS" in sensors
has_rc_lost_alarm = "RC_LOST" in alarm_list
print(has_gps, has_rc_lost_alarm)
```

该示例演示用 in 判断某元素是否包含在列表中（如传感器或告警码）。

:::{admonition} 【AI辅助小课堂】成员判断题生成
:class: tip
把 `sensors` 与 `alarm_list` 两个列表发给 AI，要求它自动生成 6 道成员判断题（in / not in 各 3 道），并给出答案。
本机运行列表并人工核对答案是否正确。
:::

:::{admonition} 练习：成员运算符
:class: important
给定：

```python
sensors = ["GPS", "IMU", "Camera"]
```

- 判断 `"Barometer" in sensors` 并打印
- 判断 `"Camera" not in sensors` 并打印
  :::

## 2.1.7 任务七：同一性运算符

同一性运算符 `is`/`is not` 用于判断两个变量是否指向同一个对象（同一块内存），它与 `==`（内容是否相等）不同。
可以把它理解为“是不是同一个箱子”：`==` 比较箱子里东西像不像，`is` 比较是不是同一个箱子本身。

以 `a='m'`，`b='n'`为例，Python中同一性运算符的功能与示例如表2-9 所示。

<p align="center"><strong>表2-9  Python中同一性运算符的功能与示例</strong></p>

| 运算符     | 功能       | 示例           | 含义           | 结果  |
| ---------- | ---------- | -------------- | -------------- | ----- |
| `is`     | 同一对象   | `a is b`     | 是否同一个对象 | False |
| `is not` | 非同一对象 | `a is not b` | 是否不同对象   | True  |

**例如：**

```python
a = ["LOW_BAT", "GPS_WEAK"]
b = ["LOW_BAT", "GPS_WEAK"]
c = a

print(a == b)   # 内容相等
print(a is b)   # 不是同一对象
print(a is c)   # 同一对象
```

该示例演示内容相等（==）与同一对象（is）在列表上的差异。

:::{admonition} 【AI辅助小课堂】is 与 == 的区别归纳
:class: tip
把 `a == b`、`a is b` 的输出结果发给 AI，要求它用两句话分别说明 `==` 与 `is` 的比较对象是什么，并指出它们在列表上的典型表现。
对照运行结果理解差异。
:::

:::{admonition} 练习：同一性运算符
:class: important
创建列表 `p1 = ["GPS", "IMU"]`，再创建 `p2 = ["GPS", "IMU"]`，并令 `p3 = p1`，
分别打印 `p1 == p2`、`p1 is p2`、`p1 is p3` 的结果。
:::

## 2.1.8 任务八：运算符的优先级

运算符优先级指一个表达式里同时出现多种运算符时，Python 默认“先算哪一部分、后算哪一部分”的规则。
可以把它理解为算式的“先后顺序”：不确定时就加括号，把意图写得一眼可读，避免结果与预期不一致。

Python运算符优先级顺序表如表2-10 所示。

<p align="center"><strong>表2-10  Python运算符优先级顺序表（同类运算符一行）</strong></p>

| 优先级（高→低） | 运算符（同类一行）                                       | 简要说明           | 
| ---------------- | -------------------------------------------------------- | ------------------ | 
| 1                | `()`                                                   | 括号内先计算       |
| 2                | `**`                                                   | 幂运算             | 
| 3                | `+x` `-x` `~x`                                     | 一元正负、按位取反 |
| 4                | `*` `/` `//` `%`                                 | 乘、除、整除、取余 |
| 5                | `+` `-`                                              | 加、减             |
| 6                | `<<` `>>`                                            | 位移               | 
| 7                | `&`                                                    | 按位与             | 
| 8                | `^`                                                    | 按位异或           | 
| 9                | `\|`                                                      | 按位或                 |  
| 10               | `==` `!=` `>` `<` `>=` `<=`                  | 比较运算           |        |
| 11               | `not`                                                  | 逻辑非             |     
| 12               | `and`                                                  | 逻辑与             |     
| 13               | `or`                                                   | 逻辑或             |      
| 14               | `=` `+=` `-=` `*=` `/=` `//=` `%=` `**=` | 赋值与增强赋值     |      

:::{admonition} 运算优先级注意
:class: tip

- 需要“先算一部分再算另一部分”时使用括号
- 当表达式包含比较与逻辑运算时，优先用括号让条件结构清晰
- 同一性 `is` 与成员 `in` 属于比较类运算，常与逻辑运算一起使用时应加括号增强可读性
  :::

**例如：**

```python
expr1 = 2 + 3 * 4
expr2 = (2 + 3) * 4
print(expr1, expr2)
```

该示例演示默认优先级与括号如何改变表达式的计算顺序。

:::{admonition} 【AI辅助小课堂】优先级结果预测与验证
:class: tip
把两条表达式 `2 + 3 * 4` 与 `(2 + 3) * 4` 发给 AI，要求它先预测结果并解释“为什么先乘后加”。
本机运行对照验证预测是否正确。
:::

:::{admonition} 练习：运算符优先级
:class: important
设定：`distance_km = 3.6`，`hours = 0.3`，`speed_limit = 30`。
写出并打印下面表达式的结果（注意括号）：
`distance_km / hours > speed_limit and battery_percent > 30`
要求：用括号把"速度判断"和"电量判断"两部分分别括起来。
:::



## 本项目小结

本项目围绕无人机飞行数据，完成了 Python 运算符体系的集中训练：用算术运算符完成单位换算与速度计算；用关系运算符将“阈值比较”转化为布尔结果；用赋值运算符实现累计与扣减的状态更新；用逻辑运算符将多个判定条件组合为“任一风险/全部安全”的整体结论，并通过短路规则理解表达式求值过程；用位运算符建立告警位掩码，实现告警合并与按位检测；用成员运算符完成清单与告警列表的包含性判断；用同一性运算符区分“内容相等”与“对象相同”；最后通过括号对比验证运算符优先级对结果的影响。完成本项目后，学习者能够在无人机场景中写出结构清晰、可读性强的表达式，为后续条件分支与循环结构的学习奠定基础。

---

# 2.2 项目二：无人机"起飞许可判定器"——条件语句

**项目简介**

> 本项目编写一个“起飞许可判定器”，将无人机起飞前的关键指标写成变量，通过分支语句生成判定报告：当某项指标不满足时输出风险提示，当指标满足时输出通过信息，并给出最终“允许/禁止起飞”的结论。

**项目定位**

> 本项目以无人机起飞前检查为业务背景，训练 Python 分支结构的核心写法与执行逻辑，覆盖 `if`、`if...else...`、`if...elif...else...` 与 `if` 嵌套四种形式，并在统一脚本中输出判定结论与原因。

**需求分析**

> 本项目编写脚本 `uav_takeoff_check.py` 需要完成以下功能：
> - 使用变量给出无人机基础数据：编号、电量、GPS 卫星数、是否解锁、当前高度、告警列表等
> - 用 `if` 实现“单条件提示”（例如：电量低则提示）
> - 用 `if...else...` 实现“二选一判定”（例如：GPS 是否达标）
> - 用 `if...elif...else...` 实现“分级结论”（例如：电量等级：危险/偏低/正常）
> - 用 `if` 嵌套实现“先总体后细化”的判定逻辑（例如：先看是否解锁，再判断是否允许起飞）
> - 输出一份结构清晰的《起飞许可判定报告》

**项目代码**

```python
# uav_takeoff_check.py
# 项目二：无人机起飞许可判定器（分支结构）

# ===== 基础数据 =====
uav_id = "UAV-07"
battery_percent = 38          # 电量(%)
gps_satellites = 10           # GPS卫星数
is_armed = False              # 是否解锁
altitude_m = 0.0              # 起飞前高度(米)
alarm_list = ["LOW_BAT", "GPS_WEAK", "LOW_BAT"]  # 告警（含重复项）

# 阈值设置
BATTERY_LOW = 30
BATTERY_WARN = 40
GPS_MIN = 12

print("=== 起飞许可判定报告 ===")
print("无人机编号：", uav_id)
print("电量(%)：", battery_percent, "| GPS卫星数：", gps_satellites, "| 是否解锁：", is_armed)
print("告警列表：", alarm_list)
print("----------------------------------")

# ===== if：单条件提示 =====
if "LOW_BAT" in alarm_list:
    print("提示：检测到低电量告警（LOW_BAT）")

# ===== if...else：二选一判定 =====
if gps_satellites >= GPS_MIN:
    print("GPS判定：通过（卫星数达标）")
else:
    print("GPS判定：不通过（卫星数不足）")

# ===== if...elif...else：分级结论 =====
if battery_percent < BATTERY_LOW:
    battery_level = "危险"
elif battery_percent < BATTERY_WARN:
    battery_level = "偏低"
else:
    battery_level = "正常"
print("电量等级：", battery_level)

# ===== if 嵌套：先总体再细化 =====
if is_armed:
    # 已解锁，再进一步判断电量与GPS是否达标
    if battery_percent >= BATTERY_LOW and gps_satellites >= GPS_MIN:
        decision = "允许起飞"
    else:
        decision = "禁止起飞（参数未达标）"
else:
    decision = "禁止起飞（未解锁）"

print("----------------------------------")
print("最终结论：", decision)
print("=== 报告结束 ===")
```

## 2.2.1 任务一：if语句

:::{index} single: if语句
:::
:::{index} single: 条件判断
:::
:::{index} single: 代码块
:::

if 语句用于在条件成立时才执行一段代码：条件为 `True` 执行缩进代码块，为 `False` 则跳过。
可以把它理解为“门禁触发器”：满足规则才放行执行，用来做单项风险提示最直观。

**代码格式**

```python
if condition:
    # 语句块（缩进 4 空格）
    pass
```

**格式解析**

* `if` 后面写条件表达式，结果为布尔值；
* 冒号 `:` 表示下面进入代码块；
* 缩进的语句块是“条件为真时执行”的内容。

**例如：**

```python
alarm_list = ["LOW_BAT", "GPS_WEAK", "LOW_BAT"]  # 告警（含重复项）
if "LOW_BAT" in alarm_list:
    print("提示：检测到低电量告警（LOW_BAT）")
```

该示例演示 if 在条件成立时执行代码块，用于单项告警提示。

**图示：if 执行流程**

```text
开始
  |
判断条件？
  |—— True ——> 执行语句块 ——> 继续
  |
  |—— False —> 跳过语句块 ——> 继续
```

图示解析：if 只有在条件为 True 时才进入执行分支；否则直接进入后续语句。

:::{admonition} 【AI辅助小课堂】输出预测：不同告警下的提示变化
:class: tip
把 `alarm_list` 分别改为三种情况发给 AI：
包含 "LOW_BAT"、不包含 "LOW_BAT"、只有 "LOW_BAT"。
让 AI 预测程序输出中“提示行”是否出现，并写出预测原因。
最后运行脚本核对。
:::

:::{admonition} 练习：if语句
:class: important
给定 `altitude_m = 125.0`，阈值 `altitude_limit = 120.0`。
用 if 语句实现：若高度超过阈值，输出“提示：高度超限”。
:::

## 2.2.2 任务二：if...else...语句

:::{index} single: if...else语句
:::
:::{index} single: 二选一分支
:::

`if...else...` 用于二选一分支：条件为 `True` 执行 if 块，否则执行 else 块，二者必走其一。
可以把它理解为“岔路口”：满足条件走一条路，不满足走另一条路，适合输出“通过/不通过”“允许/禁止”这类对立结论。

**代码格式**

```python
if condition:
    # 语句块 A
    pass
else:
    # 语句块 B
    pass
```

**格式解析**

* 条件为 True：执行语句块A；
* 条件为 False：执行语句块B；
* 两者必居其一，不会同时执行。

**例如：**

```python
gps_satellites = 10           # GPS卫星数
GPS_MIN = 12  # GPS卫星数阈值
if gps_satellites >= GPS_MIN:
    print("GPS判定：通过（卫星数达标）")
else:
    print("GPS判定：不通过（卫星数不足）")
```

该示例演示 if...else 的二选一分支判定（达标/不达标）。

**图示：if...else... 执行流程**

```text
开始
  |
判断条件？
  |—— True ——> 执行A ——> 继续
  |
  |—— False —> 执行B ——> 继续
```

:::{admonition} 【AI辅助小课堂】条件阈值敏感性预测
:class: tip
把 `gps_satellites` 分别设为 `11`、`12`、`13` 三种情况，让 AI 预测三次输出的 GPS 判定结果。
运行脚本核对阈值边界（等于阈值时的结果）。
:::

:::{admonition} 练习：if...else...
:class: important
设定 `is_armed = True`。
用 if...else... 实现：若已解锁输出“电机已解锁”，否则输出“电机未解锁”。
:::

## 2.2.3 任务三：if...elif...else语句

:::{index} single: if...elif...else语句
:::
:::{index} single: 多分支判断
:::
:::{index} single: elif
:::

if...elif...else 用于多选一分级判定：从上到下依次判断，命中第一条为 `True` 的分支就执行并结束；若都不满足则进入 else。
可以把它理解为“分档规则表”：按阈值把状态分成不同等级，注意条件顺序就是判定优先级。

**代码格式**

```python
if 条件1:
    语句块1
elif 条件2:
    语句块2
elif 条件3:
    语句块3
else:
    语句块默认
```

**格式解析**

* 判断顺序从上到下；
* 命中一个分支后，后续 `elif` 不再判断；
* 若没有任何条件为 True，则执行 `else`。

**例如：**

```python
battery_percent = 38          # 电量(%)
# 阈值设置
BATTERY_LOW = 30
BATTERY_WARN = 40
if battery_percent < BATTERY_LOW:
    battery_level = "危险"
elif battery_percent < BATTERY_WARN:
    battery_level = "偏低"
else:
    battery_level = "正常"
print("电量等级：", battery_level)
```

该示例演示 if...elif...else 按阈值分级输出电量等级。

**图示：if...elif...else 执行流程**

```text
开始
  |
条件1？
  |—— True ——> 执行1 ——> 继续
  |
  |—— False —> 条件2？
               |—— True ——> 执行2 ——> 继续
               |
               |—— False —> ... -> else 执行默认 ——> 继续
```

:::{admonition} 【AI辅助小课堂】分级边界解释
:class: tip
把电量阈值 `BATTERY_LOW=30`、`BATTERY_WARN=40` 发给 AI，并给出电量 `29、30、39、40、80` 五组数据，让 AI 逐一写出电量等级。运行脚本核对边界值（30、40）的分类结果。
:::

:::{admonition} 练习：if...elif...else
:class: important
设定 `gps_satellites` 的分级规则：

* 小于 8：`"很差"`
* 8 到 11：`"一般"`
* 大于等于 12：`"良好"`
  用 if...elif...else 计算 `gps_level` 并打印。
  :::

## 2.2.4 任务四：if语句嵌套

if 嵌套是在一个 if 的分支内部再写 if，用于表达“先满足前置条件，再做细分判断”的层级规则。
可以把它理解为“关卡判定”：外层先决定要不要进入内层，外层不过时内层就无需计算。

**代码格式**

```python
if 条件A:
    if 条件B:
        语句块1
    else:
        语句块2
else:
    语句块3
```

**格式解析**

* 外层 if 控制是否进入内层判断；
* 内层 if 只在外层条件为 True 时才会执行；
* 层级结构用缩进体现。

**例如：**

```python
gps_satellites = 10           # GPS卫星数
battery_percent = 38          # 电量(%)
# 阈值设置
BATTERY_LOW = 30
GPS_MIN = 12
if is_armed:
    if battery_percent >= BATTERY_LOW and gps_satellites >= GPS_MIN:
        decision = "允许起飞"
    else:
        decision = "禁止起飞（参数未达标）"
else:
    decision = "禁止起飞（未解锁）"
```

该示例演示 if 嵌套的层级判定：先解锁，再综合判断电量与 GPS。

**图示：if 嵌套执行流程**

```text
开始
  |
外层条件A？
  |—— False —> 执行语句块3 ——> 结束/继续
  |
  |—— True ——> 内层条件B？
                 |—— True ——> 执行语句块1 ——> 结束/继续
                 |
                 |—— False —> 执行语句块2 ——> 结束/继续
```

:::{admonition} 【AI辅助小课堂】多组数据下的最终结论预测
:class: tip
给出三组参数（is_armed、电量、GPS），让 AI 逐组预测最终结论 `decision`：
未解锁、已解锁但电量不足、已解锁且电量与GPS均达标。
运行脚本逐组修改数据核对输出。
:::

:::{admonition} 练习：if 嵌套
:class: important
设定规则：只有在 `is_armed` 为 True 时才检查 `battery_percent`：

* 若电量小于 30：输出“禁止起飞：电量不足”；
* 否则输出“允许起飞：电量满足”；
* 若未解锁：输出“禁止起飞：未解锁”。
  要求：用 if 嵌套实现，并打印最终结论。
  :::

## 本项目小结

本项目以无人机起飞前安全检查为情境，完成了分支结构的系统训练：`if` 用于单条件提示，`if...else...` 用于二选一判定，`if...elif...else...` 用于分级结论输出，`if` 嵌套用于层级化的综合判定。通过对电量、GPS、解锁状态与告警信息的组合判断，程序能够输出结构清晰的《起飞许可判定报告》，实现“规则可复用、结论可解释、输出可核对”的判定流程。

---

# 2.3 项目三：无人机"巡检数据汇总器"——循环结构

**项目简介**

> 本项目编写“巡检数据汇总器”脚本，使用列表保存多次巡检采样数据，通过 `for` 循环逐条输出采样简报并完成累计统计；通过 `range()` 生成固定次数的采样序号；通过 `while` 模拟“电量逐步下降直到触发返航阈值”的持续过程，最终形成完整的巡检汇总报告。

**项目定位**

> 本项目以无人机巡检采样为业务背景，系统训练 Python 的循环结构：使用 `for` 遍历可迭代对象（列表/字符串/集合等）；使用 `for ... in range()` 进行指定次数的重复操作；使用 `while` 完成“满足条件前持续执行”的循环，项目输出以“巡检数据汇总报告”为核心，突出循环对重复任务的表达能力。

**需求分析**

> 脚本 `uav_patrol_summary.py` 需要完成以下功能：
> - 准备无人机编号、采样列表（例如高度采样、速度采样）等基础数据
> - 使用 `for 临时变量 in 可迭代对象` 遍历列表，逐条输出采样并累计总量
> - 使用 `for 临时变量 in range()` 生成采样序号，实现指定次数的重复输出
> - 使用 `while` 模拟“持续执行直到条件不满足”的过程，例如电量逐步消耗直到低于阈值
> - 输出结构清晰的《无人机巡检采样汇总报告》

**项目代码**

```python
# uav_patrol_summary.py
# 项目三：无人机巡检数据汇总器（循环结构）

uav_id = "UAV-07"

# 巡检采样数据（示例）
alt_samples = [50.2, 51.0, 52.5, 52.2, 51.8]     # 高度(m)
speed_samples = [5.2, 5.6, 6.1, 5.9, 6.3]        # 速度(m/s)

print("=== 无人机巡检采样汇总报告 ===")
print("无人机编号：", uav_id)
print("----------------------------------")

# ===== for 遍历可迭代对象：逐条输出 + 累计 =====
sum_alt = 0.0
for alt in alt_samples:
    sum_alt += alt
print("高度采样总和(m)：", sum_alt)

print("----------------------------------")

# ===== for + range：生成序号输出采样简报 =====
print("采样简报（序号-高度-速度）：")
for i in range(0, len(alt_samples)):
    print("采样", i, "：", alt_samples[i], "m ,", speed_samples[i], "m/s")

print("----------------------------------")

# ===== while：持续执行直到触发阈值（模拟耗电）=====
battery_percent = 45
battery_low_threshold = 30
step_cost = 3

print("电量耗电模拟：")
while battery_percent > battery_low_threshold:
    battery_percent -= step_cost
    print("当前电量(%)：", battery_percent)

print("触发阈值：电量已不高于", battery_low_threshold, "%，建议返航")
print("=== 报告结束 ===")
```

## 2.3.1 任务一：for循环语句

:::{index} single: for循环
:::
:::{index} single: 循环遍历
:::
:::{index} single: 可迭代对象
:::
:::{index} single: range()函数
:::

for 循环用于遍历一个可迭代对象或按指定次数重复执行一段代码，循环次数通常由数据长度或 `range()` 决定。
可以把它理解为“按清单逐项处理”：清单有多少项就处理多少次，每次拿到一项就做同样的动作。

**1.for 临时变量 in 可迭代对象**

`for 临时变量 in 可迭代对象` 用于按顺序取出元素：每次循环把一个元素赋给临时变量，并执行缩进循环体。常见可迭代对象包括列表、字符串、元组、集合等。

**代码格式**

```python
for 临时变量 in 可迭代对象:
    循环体（缩进4空格）
```

**格式解析**

* `临时变量`：每次循环临时接收一个元素；
* `可迭代对象`：提供一系列元素；
* 循环体：对每个元素重复执行。

**例如：**

```python
sum_alt = 0.0
for alt in alt_samples:
    sum_alt += alt
print(sum_alt)
```

该示例演示 for 遍历列表并对元素进行累计求和。

:::{admonition} 【AI辅助小课堂】循环次数与变量变化预测
:class: tip
把 `alt_samples` 发给 AI，让 AI 预测 for 循环将执行多少次，并写出 `sum_alt` 的最终数值。
运行脚本核对预测是否正确。
:::

:::{admonition} 练习：for 遍历可迭代对象
:class: important
给定：

```python
sensors = ["GPS", "IMU", "Camera"]
```

使用 `for 临时变量 in 可迭代对象` 逐个打印传感器名称，输出格式为：`传感器：GPS`。
:::

**2.for 临时变量 in range函数**

当需要重复固定次数或需要索引序号时，常用 `range()` 生成整数序列再用 for 循环遍历。`range()` 生成的是左闭右开区间（不包含结束值）。

**代码格式**

```python
for 临时变量 in range(起始, 结束, 步长):
    循环体
```

**格式解析**

* `起始`：从哪个数开始（可省略，默认为 0）；
* `结束`：到哪个数结束（不包含结束值）；
* `步长`：每次递增多少（可省略，默认为 1）。

**例如：**

```python
for i in range(0, len(alt_samples)):
    print("采样", i, "：", alt_samples[i])
```

该示例演示 range 生成序号，配合列表下标输出“带索引的采样”。

:::{admonition} 【AI辅助小课堂】range 输出理解
:class: tip
把 `range(0, len(alt_samples))` 发给 AI，让 AI 写出它生成的整数序列（用列表形式表示），并说明为何“不包含结束值”。
运行脚本核对采样序号是否与预测一致。
:::

:::{admonition} 练习：for + range
:class: important
给定：

```python
waypoints = ["P0", "P1", "P2", "P3"]
```

使用 `for i in range(...)` 输出每个航点，格式为：`航点0：P0`、`航点1：P1`……
:::

## 2.3.2 任务二：while循环语句

:::{index} single: while循环
:::
:::{index} single: 条件循环
:::

while 循环用于在条件为 `True` 时重复执行一段代码，直到条件变为 `False` 才停止，适合循环次数不确定的场景。
可以把它理解为“只要还没达到停止条件就继续”：例如电量仍高于阈值就持续消耗并打印，直到触发返航阈值才退出。

**代码格式**

```python
while 条件表达式:
    循环体（缩进4空格）
```

**格式解析**

* 进入循环前先判断条件；
* 条件为 True 执行循环体；
* 循环体中通常要改变某些变量，否则可能导致无限循环。

**例如：**

```python
battery_percent = 45
battery_low_threshold = 30
step_cost = 3

while battery_percent > battery_low_threshold:
    battery_percent -= step_cost
    print(battery_percent)
```

该示例演示 while 在条件成立时循环执行，并通过变量变化触发退出。

while 每次回到“条件判断”处，条件为 True 就继续执行循环体；条件为 False 就退出循环。

:::{admonition} 【AI辅助小课堂】while 终止次数预测
:class: tip
把 `battery_percent=45`、`battery_low_threshold=30`、`step_cost=3` 发给 AI，让 AI 预测 while 循环将打印多少行电量，并写出最后一次打印的电量值。
运行脚本核对预测。
:::

:::{admonition} 练习：while循环
:class: important
设定 `battery_percent = 50`，阈值 `battery_low_threshold = 35`，每次消耗 `step_cost = 5`。
用 while 实现：只要电量仍高于阈值就继续消耗并打印电量；当循环结束后打印“建议返航”。
:::

## 本项目小结

本项目以无人机巡检采样为主线，完成了循环结构的核心训练：`for` 用于遍历序列并对每个元素重复处理；`range()` 用于生成序号与固定次数循环；`while` 用于条件驱动的持续执行并在条件改变后退出循环。通过对采样列表的逐条输出与累计统计，以及对电量阈值的循环模拟，程序能够生成结构清晰的《无人机巡检采样汇总报告》，实现对重复任务的自动化处理。

---

# 2.4 项目四：无人机"网格航点巡检器"——嵌套循环

**项目简介**

> 本项目把巡检区域抽象为 `rows × cols` 的航点网格。程序按既定顺序扫描航点，并在航点内遍历传感器列表输出检查结果。当巡检到指定航点触发返航时，使用 `break` 终止扫描；当遇到指定传感器轻微异常时，使用 `continue` 跳过该项检查并继续后续检查，最终形成一份可核对的巡检输出。

**项目定位**

> 本项目定位为“循环控制结构”的综合训练，覆盖三类嵌套形式（for 嵌套、while 嵌套、for 与 while 混合嵌套），并在巡检过程中引入 `break` 与 `continue` 实现“提前终止”和“跳过本轮”的业务控制。

**需求分析**

> 本项目编写脚本 `uav_grid_patrol.py` 需要完成以下功能：
> - 定义网格尺寸：`rows`、`cols`
> - 定义传感器列表：`sensors`
> - 实现三类循环嵌套：for-for、while-while、for-while（或 while-for）
> - 在巡检过程中加入业务规则：到达指定航点触发返航，使用 `break` 提前终止，检查到指定传感器轻微异常，使用 `continue` 跳过
> - 输出《网格航点巡检报告》，包含清晰的过程输出与结束状态

**项目代码**

```python

# uav_grid_patrol.py
# 项目四：无人机网格航点巡检器（循环嵌套 + break/continue）

uav_id = "UAV-07"

rows = 2
cols = 3
sensors = ["GPS", "IMU", "Barometer"]

# 返航触发航点（用于演示 break）
rth_row = 1
rth_col = 1

# 轻微异常传感器（用于演示 continue）
skip_sensor = "Barometer"

print("=== 网格航点巡检报告 ===")
print("无人机编号：", uav_id)
print("网格大小：", rows, "行 ×", cols, "列")
print("返航触发航点：(", rth_row, ",", rth_col, ")")
print("跳过传感器：", skip_sensor)
print("----------------------------------")

# for-for：网格航点扫描
print("【1】for-for：航点扫描 + 传感器检查")
scan_stopped = False
for r in range(rows):
    for c in range(cols):
        print("航点(", r, ",", c, ")：开始巡检")

        if r == rth_row and c == rth_col:
            print("!! 触发返航告警：停止巡检（break）")
            scan_stopped = True
            break

        for s in sensors:
            if s == skip_sensor:
                print(" -", s, "：轻微异常，跳过（continue）")
                continue
            print(" -", s, "：检查通过")

        print("航点(", r, ",", c, ")：巡检完成")
    if scan_stopped:
        break

print("----------------------------------")

# while-while：网格航点扫描
print("【2】while-while：航点扫描（仅输出航点坐标）")
r = 0
while r < rows:
    c = 0
    while c < cols:
        print("航点(", r, ",", c, ")")
        c += 1
    r += 1

print("----------------------------------")

# for-while：外层 for，内层 while（输出每行的列坐标）
print("【3】for-while：外层按行，内层按列（while）")
for r in range(rows):
    c = 0
    while c < cols:
        print("行", r, "的列", c)
        c += 1

print("----------------------------------")
print("=== 报告结束 ===")
```

**循环嵌套**
是指在一个循环的循环体内再写一个循环，用于描述“二维结构”或“分层任务”。无人机网格巡检具有天然的二维结构（行 × 列），因此循环嵌套是最直接的表达方式。
本任务归纳三种常见形式：`for-for`、`while-while`、`for-while`（或 `while-for`），并给出可直接运行的示例单元。

**循环嵌套的形式**

- `for-for`：外层与内层均为 `for`；
- `while-while`：外层与内层均为 `while`；
- `for-while`：外层 `for`、内层 `while`（或反过来）。

## 2.4.1 任务一：for循环嵌套

for 循环嵌套是在外层 for 的循环体里再写一个 for，用于遍历二维结构或“外层—内层”的分层任务。
可以把外层想成“按行走”，内层想成“在这一行逐列走”，两层合起来就能扫描整张网格。

**代码格式**

```python
for r in range(rows):
    for c in range(cols):
        循环体
```

**格式解析**
外层 for r 控制行方向遍历，每执行一次就进入新的一行；内层 for c 在当前行内完成列方向遍历。因此，内层循环会在外层每一次取值时完整执行一轮，整体形成“按行逐列”的二维扫描过程。

**例如：**

```python
rows = 2
cols = 3

for r in range(rows):
    for c in range(cols):
        print("航点(", r, ",", c, ")")
```

:::{admonition} 【AI辅助小课堂】循环次数与输出行数预测
:class: tip
把 `rows=2, cols=3` 发给 AI，让 AI 计算“print 会执行几次”，并写出理由。
运行示例核对。
:::

:::{admonition} 练习：for-for 网格航点输出
:class: important
设定 `rows=3, cols=2`，用 for-for 输出所有航点坐标，格式为：`航点(r,c)`。要求代码可直接运行。
:::

## 2.4.2 任务二：while循环嵌套

while 循环嵌套是在外层 while 的循环体里再写 while，用于条件驱动的二维遍历，需要手动更新行列计数器。
可以把 `r`、`c` 当作两只“计数器”：一只管行、一只管列，任何一个不递增都可能导致循环无法结束。

**代码格式**

```python
r = 0
while r < rows:
    c = 0
    while c < cols:
        循环体
        c += 1
    r += 1
```

**格式解析**
r 与 c 充当行、列计数器：外层 while 负责控制行数，内层 while 负责控制列数；
c += 1 与 r += 1 是推动循环结束的关键语句，缺少任意一个都会导致条件无法变化，从而引发死循环。

**例如：**

```python
rows = 2
cols = 3
r = 0
while r < rows:
    c = 0
    while c < cols:
        print("航点(", r, ",", c, ")")
        c += 1
    r += 1
```

该示例演示 while-while 嵌套遍历二维网格，并用计数器推进避免死循环。

:::{admonition} 循环变量固定不变警告
:class: warning
while 嵌套中若遗漏 `c += 1` 或 `r += 1`，循环条件不会变化，程序将无法结束。
:::

:::{admonition} 【AI辅助小课堂】死循环风险识别
:class: tip
把 while 示例发给 AI，让 AI 标出哪些语句用于“推动条件变化”，并说明去掉它们会发生什么。运行示例核对输出是否能正常结束。
:::

:::{admonition} 练习：while-while 网格航点输出
:class: important
设定 `rows=3, cols=3`，用 while-while 输出所有航点坐标。要求代码可直接运行且能正常结束。
:::

## 2.4.3 任务三：for与while混合循环嵌套

for 与 while 的混合嵌套用于把“次数已知”和“条件驱动”两类循环组合在一起，适合外层固定次数、内层依条件推进的场景。
可以把它理解为“外层按计划走几趟，内层看情况走到头”：外层决定行数，内层靠条件更新列坐标。

**代码格式**

```python
for r in range(rows):
    c = 0
    while c < cols:
        循环体
        c += 1
```

**格式解析**
外层 for 用于处理次数已知的行遍历，内层 while 用于处理条件驱动的列遍历；
这种结构体现了“外层定次数，内层靠条件推进”的混合思想，适合在行数确定、列数由运行过程控制的场景中使用。

**例如：**

```python
rows = 2
cols = 3

for r in range(rows):
    c = 0
    while c < cols:
        print("航点(", r, ",", c, ")")
        c += 1
```

该示例演示 for-while 混合嵌套：外层定次数，内层靠条件推进。

:::{admonition} 【AI辅助小课堂】三种嵌套写法对照
:class: tip
让 AI 将 for-for、while-while、for-while 三段示例的输出结果进行对照，判断输出是否一致，并说明原因。运行三段示例核对。
:::

:::{admonition} 练习：混合循环嵌套
:class: important
设定 `rows=3, cols=2`，用“外层 while、内层 for”的方式输出航点坐标。要求代码可直接运行并能正常结束。
:::

跳转语句用于改变循环的执行流程。无人机巡检中常见两类控制：出现重大风险时立即停止（对应 `break`），出现可忽略异常时跳过当前项（对应 `continue`）。

- `break`：结束当前循环；在嵌套循环中只结束所在的那一层；
- `continue`：跳过本轮循环剩余语句，进入下一轮，在 while 中使用时要注意控制变量更新。

## 2.4.4 任务四：break语句

:::{index} single: break语句
:::
:::{index} single: 提前终止循环
:::

`break` 用于立刻结束当前所在的循环层级，程序跳出循环并继续执行后续语句。
可以把它理解为“紧急停止按钮”：一旦触发重大风险就停止扫描；在嵌套循环里只会停止最近一层，外层需配合额外逻辑退出。

**代码格式**

```python
for ...:
    ...
    if 条件:
        break
```

**格式解析**
break 会立即终止当前所在的循环层级，程序跳出该循环体并继续执行后续语句；
在嵌套循环中，break 只作用于最近的一层循环，若需要同时结束外层循环，必须借助标志变量或外层判断进行配合控制。

**例如：**

```python
# 到达返航航点提前终止
rows = 2
cols = 3
rth_row = 1
rth_col = 1

stopped = False
for r in range(rows):
    for c in range(cols):
        print("航点(", r, ",", c, ")")
        if r == rth_row and c == rth_col:
            print("触发返航：停止扫描（break）")
            stopped = True
            break
    if stopped:
        break
```

该示例演示 break 只退出当前层循环，并用标志变量配合退出外层。

:::{admonition} break跳出循环警告
:class: warning
在嵌套循环中，`break` 只结束当前这一层循环。若要外层也结束，需要使用标志变量或外层判断配合退出。
:::

:::{admonition} 【AI辅助小课堂】break 作用层级判断
:class: tip
把上面的 break 示例发给 AI，让 AI 指出 break 跳出的是哪一层循环，并解释 `stopped` 变量为什么必须存在。运行示例核对输出。
:::

:::{admonition} 练习：break
:class: important
设定 `rows=3, cols=3`，输出航点坐标；当到达航点 `(1,2)` 时打印“触发返航”，并停止所有扫描。要求代码可直接运行。
:::

## 2.4.5 任务五：continue语句

:::{index} single: continue语句
:::
:::{index} single: 跳过本轮循环
:::

`continue` 用于跳过当前这一轮循环剩余语句，直接进入下一轮判断（循环不结束）。
可以把它理解为“本轮跳过”：遇到可忽略项就略过继续；在 while 里使用时要先更新控制变量，避免死循环。

**代码格式**

```python
while 条件:
    if 跳过条件:
        continue
    其它语句
```

**格式解析**

continue 用于跳过当前这一轮剩余语句，直接进入下一次循环判断；
在 while 循环中使用时，必须保证在 continue 之前已经更新控制变量，否则循环条件始终为真，程序将无法结束。

**例如：**

```python
# 模拟“航点编号巡检”，当编号为 2 时跳过，并保证控制变量 `i` 在 continue 前仍然更新，避免死循环。
i = 0
while i < 5:
    if i == 2:
        print("航点", i, "轻微异常，跳过（continue）")
        i += 1
        continue
    print("航点", i, "检查完成")
    i += 1
```

该示例演示 continue 跳过指定轮次，并在 while 中先更新计数器避免死循环。

:::{admonition} continue 使用注意事项
:class: important
在 `while` 循环中使用 `continue` 时，要确保在 `continue` 之前更新控制变量（如 `i += 1`），否则循环条件可能一直为真，程序无法结束。
:::

:::{admonition} 【AI辅助小课堂】continue 输出顺序预测
:class: tip
让 AI 写出上述 while 示例的完整输出顺序，并标注哪一行由 continue 触发跳过。运行示例核对。
:::

:::{admonition} 练习：continue
:class: important
用 while 从 0 数到 6，遇到数字 4 时输出“跳过航点4”，并使用 `continue`；其余数字输出“航点X检查完成”。要求代码可直接运行且能正常结束。
:::

## 本项目小结

本项目以无人机网格巡检为主线，系统呈现了循环嵌套的三种常见形式（`for-for`、`while-while`、`for-while`），并在巡检过程中引入跳转语句完成业务控制：`break` 用于重大告警下的提前终止，`continue` 用于轻微异常项的跳过处理。所有示例均为可直接运行的完整代码单元，变量定义完整、输出可核对，便于在 90 分钟内完成练习与掌握核心机制。

---

# 2.5 项目五：无人机“飞行日志校验器”

**项目简介**

> 本项目以字典表示单条飞行日志，以列表保存多条日志，程序逐条检查：把可能是字符串的数字字段转换为数值；在转换、取值、计算过程中捕获异常并给出提示；对不合理数据用 `raise`/`assert` 主动终止本条处理；最终输出一份可阅读的校验结果。

**项目定位**

> 本项目定位为“错误与异常处理”的入门实战，围绕无人机日志的常见录入问题，学习：错误与异常的区别、常见异常类型识别、`try...except` 捕获、捕获单个/多个/所有异常、`else` 与 `finally` 子句、`raise` 与 `assert` 主动抛出异常。
> 项目只使用已学过的基础语法（变量、数据类型、运算符、if、for/while、列表/字典），不使用函数等后续内容。

**需求分析**

> 本项目编写脚本 `uav_log_checker.py` 需要完成如下功能：
> - 准备多条日志数据（包含“正常数据”和“常见问题数据”）
> - 能说明“错误（Error）”与“异常（Exception）”差异，并用可运行示例体现
> - 列出常见异常种类表
> - 实现捕获异常
> - 实现主动抛出：`raise` 与 `assert`，用于检查不合理的无人机日志字段

**项目代码**

```python
# uav_log_checker.py
# 项目五：无人机飞行日志校验器（错误与异常处理）

# 多条飞行日志：用字典表示一条日志
logs = [
    {"uav_id": "UAV-07", "battery_percent": 86,   "flight_min": 12,   "altitude_m": 52.5},
    {"uav_id": "UAV-08", "battery_percent": "72", "flight_min": "9",  "altitude_m": "35.0"},  # 字符串数字
    {"uav_id": "UAV-09", "battery_percent": None, "flight_min": 10,   "altitude_m": 40.0},    # None
    {"uav_id": "UAV-10", "battery_percent": 50,   "flight_min": 0,    "altitude_m": 30.0},    # 0分钟（可能不合理）
    {"uav_id": "UAV-11", "battery_percent": 80,   "flight_min": 8,    "altitude_m": -5},      # 负高度（不合理）
]

print("=== 飞行日志校验报告 ===")

for log in logs:
    print("----------------------------------")
    print("无人机：", log.get("uav_id"))

    try:
        # 1) 取值：如果键不存在会触发 KeyError（此处用 [] 演示）
        battery_raw = log["battery_percent"]
        flight_raw  = log["flight_min"]
        alt_raw     = log["altitude_m"]

        # 2) 转换：字符串数字可转为 int/float；None/非数字会触发 TypeError/ValueError
        battery = int(battery_raw)
        flight_min = int(flight_raw)
        altitude = float(alt_raw)

        # 3) 业务校验：不合理数据主动抛出异常
        if flight_min <= 0:
            raise ValueError("飞行时长必须为正数")
        assert 0 <= battery <= 100, "电量百分比应在 0~100"
        assert altitude >= 0, "高度不应为负数"

        # 4) 计算：单位耗电（仅用于演示可能的计算步骤）
        cost_per_min = battery / flight_min

    except KeyError as e:
        print("校验失败：字段缺失（KeyError）->", e)

    except (TypeError, ValueError) as e:
        print("校验失败：类型/数值错误（TypeError/ValueError）->", e)

    except AssertionError as e:
        print("校验失败：断言不通过（AssertionError）->", e)

    else:
        # try 块无异常才会执行
        print("校验通过：电量", battery, "%，时长", flight_min, "min，高度", altitude, "m")
        print("辅助指标：单位耗电 =", round(cost_per_min, 2), "%/min")

    finally:
        # 无论是否异常都会执行：用于收尾、打印结束标记等
        print("本条日志处理结束（finally）")

print("=== 报告结束 ===")
```

## 2.5.1 任务一：错误和异常概述

在 Python 中，错误（Error）通常指语法/缩进等导致程序无法正常解释执行的问题，需要先改代码；异常（Exception）是运行过程中出现的可预期问题，可以用 `try...except` 捕获处理。
可以把错误理解为“路断了车开不起来”，异常理解为“路上出现坑需要绕开”：前者必须修路（改代码），后者可以在程序里写应对策略。

**例如：**

```python
# 异常示例：把无人机编号转为整数（会触发 ValueError，可捕获）
uav_id = "UAV-07"

try:
    num = int(uav_id)  # 核心代码：此处会抛出 ValueError
    print("转换结果：", num)
except ValueError as e:
    print("捕获到异常：ValueError ->", e)
```

该示例演示运行期异常（ValueError）可以被 try...except 捕获并提示。

:::{admonition} 【AI辅助小课堂】“错误/异常”输出预测
:class: tip
把上面示例发给 AI，让 AI 预测程序输出的每一行，并指出异常类型名称。运行代码核对。
:::

:::{admonition} 练习：区分错误与异常
:class: important
写一个可运行程序：令 `battery_text = "86%"`，尝试执行 `int(battery_text)` 并捕获异常，打印“这是运行期异常”，再用一句话写出：为什么“缩进错误/语法错误”不能靠 try 捕获（写在注释里即可）。
:::

## 2.5.2 任务二：异常的种类

异常类型是对“出了什么问题”的分类标签（如 `KeyError`、`ValueError`、`TypeError`），用于帮助定位原因并选择合适的捕获方式。
可以把它理解为设备的“故障码”：看到类型就能大致判断问题是缺字段、类型转换失败，还是数值不合法。

Python常见异常类型与含义如表2-11 所示。

<p align="center"><strong>表2-11 常见异常类型与含义</strong></p>

| 异常类型              | 含义（通俗描述）        | 常见触发场景示例                      |
| --------------------- | ----------------------- | ------------------------------------- |
| `ValueError`        | 值的内容不合法          | `int("UAV-07")`                     |
| `TypeError`         | 类型不匹配/不支持该操作 | `int(None)`                         |
| `KeyError`          | 字典缺少指定键          | `log["battery_percent"]` 且键不存在 |
| `IndexError`        | 序列索引越界            | `sensors[10]`                       |
| `ZeroDivisionError` | 除数为 0                | `battery / 0`                       |
| `AssertionError`    | 断言条件不成立          | `assert altitude >= 0`              |
| `NameError`         | 使用了未定义变量名      | `print(x)` 但 x 未定义              |

**例如：**

```python
log = {"uav_id": "UAV-08", "battery_percent": "72"}  # 故意缺少 flight_min

try:
    flight = log["flight_min"]      # 核心代码：触发 KeyError
    battery = int(log["battery_percent"])
    print("时长：", flight, "电量：", battery)
except Exception as e:
    print("异常类型：", type(e).__name__)
    print("异常信息：", e)
```

该示例演示通过打印 type(e).__name__ 来识别具体异常类型（如 KeyError）。

:::{admonition} 【AI辅助小课堂】异常类型识别训练
:class: tip
让 AI 给出 3 个"无人机日志输入错误"的例子，并为每个例子匹配最可能出现的异常类型（从表2-11中选）。选其中 1 个复制到本机运行验证。
:::

:::{admonition} 练习：异常类型识别
:class: important
给定 `sensors = ["GPS","IMU"]`，分别写出两段可运行代码：

- 触发 `IndexError` 并捕获打印 `type(e).__name__`；
- 触发 `ZeroDivisionError` 并捕获打印 `type(e).__name__`。
  要求每段代码独立可运行，变量完整定义。
  :::

## 2.5.3 任务三：捕获异常

:::{index} single: try...except
:::
:::{index} single: 捕获异常
:::
:::{index} single: finally子句
:::
:::{index} single: else子句
:::

`try...except` 用于捕获运行期异常：把可能出错的语句放在 `try`，出错时进入匹配的 `except` 分支处理，从而让程序不中断或给出更清晰的提示。
可以把它理解为“安全护栏”：一条日志出问题就提示原因并继续处理下一条，而不是整段程序直接崩溃。

**1.try...except语句**

`try...except` 是最基础的异常捕获结构：try 放可能出错的代码，except 放对应的处理逻辑。

**语法格式**

`try:` ：放置可能发生异常的语句；
`except:` ：捕获异常后执行的处理语句。

**例如：**

```python
battery_raw = None

try:
    # 核心代码：这里可能发生 TypeError
    battery = int(battery_raw)
    print("电量：", battery)
except TypeError as e:
    print("捕获到 TypeError：", e)
```

该示例演示 int(None) 触发 TypeError，并由指定 except 分支捕获处理。

:::{admonition} 【AI辅助小课堂】异常分支判断
:class: tip
把示例中的 `battery_raw` 分别改成 `"86"`、`"86%"`、`None`，让 AI 预测每次会走 try 还是 except，并说明原因。运行三次核对。
:::

:::{admonition} 练习：try...except
:class: important
设定 `alt_text = "35.0m"`，尝试执行 `float(alt_text)`，捕获异常并打印“高度格式错误”。要求代码可直接运行。
:::

**2.捕获异常**

捕获异常可以更精确：只捕获某一种、同时捕获多种、或用 `Exception` 捕获所有异常。捕获越精确，越能给出更明确的提示。

**（1）捕获单个异常**
只处理某一种异常，其他异常会继续向外抛出。

```python
try:
    ...
except ValueError:
    ...
```

**例如：**

```python
uav_id = "UAV-07"

try:
    # 核心代码：触发 ValueError
    num = int(uav_id)
    print(num)
except ValueError as e:
    print("单个异常捕获：ValueError ->", e)
```

该示例演示只捕获 ValueError 的写法，用于处理特定类型转换失败。

:::{admonition} 【AI辅助小课堂】单异常捕获边界
:class: tip
让 AI 思考：如果把 `uav_id` 改成 `None`，上面 except 还能捕获吗？预测异常类型并运行验证。
:::

:::{admonition} 练习：捕获单个异常
:class: important
设定 `battery_text = "72%"`，执行 `int(battery_text)`，只捕获 `ValueError` 并输出“电量格式不合法”。要求代码可直接运行。
:::

**（2）捕获多个异常**

多个异常用元组写在一起，任意一种发生都会进入同一处理分支。

```python
try:
    ...
except (TypeError, ValueError):
    ...
```

**例如：**

```python
battery_raw = "86%"  # 可改为 None 观察 TypeError

try:
    # 核心代码：可能 ValueError 或 TypeError
    battery = int(battery_raw)
    print("电量：", battery)
except (TypeError, ValueError) as e:
    print("多个异常捕获：", type(e).__name__, "->", e)
```

该示例演示用一个 except 同时捕获 TypeError/ValueError，并输出异常类型。

:::{admonition} 【AI辅助小课堂】同一处理分支的优缺点
:class: tip
让 AI 分析：多个异常合并处理时，输出该如何写才能仍然清楚（提示：打印 type(e).**name**）。把 AI 的建议复制到代码中试跑。
:::

:::{admonition} 练习：捕获多个异常
:class: important
设定 `flight_raw = None`，尝试 `int(flight_raw)`；再设定 `flight_raw = "9min"`，尝试 `int(flight_raw)`。用同一段代码同时捕获 `TypeError` 与 `ValueError` 并打印异常类型名。要求代码可直接运行。
:::

**（3）捕获所有异常**

用 `except Exception as e:` 捕获几乎所有运行期异常，并统一处理。

```python
try:
    ...
except Exception as e:
    ...
```

**例如：**

```python
log = {"uav_id": "UAV-12"}  # 故意缺少 battery_percent

try:
    # 核心代码：触发 KeyError
    battery = log["battery_percent"]
    print("电量：", battery)
except Exception as e:
    print("捕获所有异常：", type(e).__name__, "->", e)
```

该示例演示 except Exception 捕获未知运行期异常并输出类型信息。

:::{admonition} 捕获所有异常的注意
:class: warning
捕获所有异常会让错误不易暴露，应在输出中至少打印异常类型（如 type(e).**name**），否则难以定位问题。
:::

:::{admonition} 练习：捕获所有异常
:class: important
写一段代码：`log = {"uav_id":"UAV-13","battery_percent":"xx"}`，先取值再转换 `int(...)`，用 `except Exception as e` 捕获并打印异常类型与信息。要求代码可直接运行。
:::

**3.else子句**

`else` 只有在 `try` 中完全没有异常时才会执行，适合放“成功时才做的后续操作”。
`try` 成功 → 执行 `else`；`try` 失败 → 跳过 `else`，进入 `except`。

**例如：**

```python
battery_raw = "80"
flight_raw = "10"

try:
    # 核心代码：转换可能失败
    battery = int(battery_raw)
    flight_min = int(flight_raw)
    cost_per_min = battery / flight_min
except (TypeError, ValueError, ZeroDivisionError) as e:
    print("失败：", type(e).__name__, "->", e)
else:
    print("成功：单位耗电 =", cost_per_min)
```

该示例演示 try 成功时进入 else 分支输出结果，失败则进入 except。

:::{admonition} 【AI辅助小课堂】else 触发条件
:class: tip
让 AI 说明：把 `flight_raw` 改为 `"0"`、`"xx"`、`None` 时，分别会进入 except 还是 else，并说明异常类型。运行验证。
:::

:::{admonition} 练习：else 子句
:class: important
设定 `alt_raw="35.0"`，在 try 中执行 `float(alt_raw)`；若成功在 else 中打印“高度合法”。将 `alt_raw` 改为 `"35m"` 再运行观察。要求代码可直接运行。
:::

**4.finally子句**

`finally` 无论是否发生异常都会执行，常用于“收尾动作”，例如打印结束标志、关闭资源等。
可以把 `finally` 理解为“无论成功还是失败，都要做的最后一步”。

**例如：**

```python
battery_raw = "xx"

try:
    # 核心代码：会 ValueError
    battery = int(battery_raw)
    print("电量：", battery)
except ValueError as e:
    print("失败：ValueError ->", e)
finally:
    print("本次处理结束（finally）")
```

该示例演示 finally 无论是否发生异常都会执行，用于统一收尾。

:::{admonition} 【AI辅助小课堂】finally 必执行验证
:class: tip
让 AI 预测：把 `battery_raw` 改为 `"86"` 时输出会如何变化，finally 行是否还会出现。运行核对。
:::

:::{admonition} 练习：finally 子句
:class: important
写一段代码：尝试将 `flight_raw="9min"` 转成 int 并捕获异常；无论成功失败，都在 finally 打印“飞行时长处理结束”。要求代码可直接运行。
:::

## 2.5.4 任务四：主动抛出异常

主动抛出异常指程序在发现数据不满足业务规则时，主动报错并中断当前处理，而不是等到后续计算才“被动崩溃”。常用 `raise`（抛出异常）和 `assert`（断言必须成立）实现。
可以把它理解为“质检关卡”：不合格就当场拦下并说明原因，让问题更早暴露、更好定位。

**1.raise语句**

`raise` 用于在发现不合法数据时主动中断，并提供清晰的错误原因。
当程序判断“这条数据不该继续算”时，就 `raise` 一个异常，把原因写进异常信息。
如 `raise ValueError("说明")`  主动抛出 ValueError 并附带信息， `raise TypeError("说明")`  | 主动抛出 TypeError 并附带信息。

**例如：**

```python
flight_min = 0  # 不合理：用于演示

try:
    # 核心代码：业务校验不通过时主动抛出
    if flight_min <= 0:
        raise ValueError("飞行时长必须为正数")
    print("时长合法：", flight_min)
except ValueError as e:
    print("捕获到 raise 的异常：", e)
```

该示例演示用 raise 主动抛出异常，把业务规则违规转成明确错误。

:::{admonition} 【AI辅助小课堂】业务规则转 raise
:class: tip
让 AI 把“高度不能为负数、电量必须在0~100”两条规则各写成一段含 raise 的可运行代码。任选一段复制运行。
:::

:::{admonition} 练习：raise
:class: important
设定 `altitude = -3`。若高度小于 0，则 `raise ValueError("高度不应为负数")`，并用 try 捕获后打印提示。要求代码可直接运行。
:::

**2.assert语句**

断言的语气是“必须如此”。例如：电量必须在 0~100；高度必须非负。
`assert` 用于快速检查“必须成立”的条件，条件不成立时抛出 `AssertionError`，使用格式如下：
`assert 条件`：条件为 False 时抛出 AssertionError；
 `assert 条件, "说明"`：抛出 AssertionError 并附带信息。

**例如：**

```python
battery = 120  # 不合理：用于演示

try:
    # 核心代码：断言电量范围
    assert 0 <= battery <= 100, "电量百分比应在 0~100"
    print("电量合法：", battery)
except AssertionError as e:
    print("断言失败：", e)
```

该示例演示 assert 校验业务条件，不满足时触发 AssertionError 便于定位问题。

:::{admonition} 【AI辅助小课堂】assert 条件设计
:class: tip
让 AI 为“飞行时长必须为正数、GPS卫星数必须>=0”各写一个 assert 条件与提示文本，并组成可运行示例。任选一段复制运行。
:::

:::{admonition} 练习：assert
:class: important
设定 `gps_sat = -1`，使用 `assert gps_sat >= 0, "GPS卫星数不能为负"`；用 try 捕获并输出“GPS数据异常”。要求代码可直接运行。
:::

## 本项目小结

通过“飞行日志校验器”把错误与异常处理串成一条完整链路：识别异常类型、选择合适捕获方式、使用 else/finally 组织执行路径，并用 raise/assert 把业务规则转成可追踪的错误。

---

# 2.6 项目六：综合实践项目——无人机“安全起飞检查与飞行日志处理器”

## 项目简介

本项目通过编写一个脚本，把“起飞前检查（控制语句）”与“日志数据校验（异常处理）”组合成一条完整流程：先判断是否具备起飞条件，再对飞行日志逐条处理并输出简报。实践要求在 90 分钟内完成脚本后，应能清楚解释：分支判断如何影响流程、循环如何组织批处理、`break/continue` 如何控制巡检节奏，以及异常捕获与主动抛出如何提升脚本健壮性。

## 需求分析

无人机执行任务前通常需要进行安全起飞检查（电量、GPS、解锁状态、风速提示等）。任务结束后又需要对飞行日志做基础校验（类型转换、字段缺失、数值合法性）。课堂实践要求学生在 90 分钟内完成一个脚本 `uav_safety_and_log.py`，实现“起飞检查 + 日志处理 + 报告输出”三件事。

脚本需要完成以下功能：

1. **数据准备（变量与赋值 + 基本类型）**定义并赋值以下数据（允许自定义内容，但结构必须具备）：

   - 无人机编号 `uav_id`（字符串，例如 `"UAV-07"`）
   - 飞手 `pilot`（字符串）
   - 电池电量 `battery_percent`（整型）
   - GPS 卫星数 `gps_satellites`（整型）
   - 是否解锁 `is_armed`（布尔型）
   - 检查清单 `check_items`（列表，至少 5 项字符串，例如 `"battery" "gps" "arm" "camera" "propeller"`）
   - 忽略项 `ignore_item`（字符串，用于 continue 演示，例如 `"camera"`）
   - 飞行日志列表 `logs`（列表，元素为字典；至少 4 条，包含“正常”与“异常”两类数据）
     - 每条日志建议包含：`"uav_id"`、`"battery_percent"`、`"flight_min"`、`"altitude_m"`
     - 至少出现一次：字符串数字、`None`、缺字段、数值不合理（如飞行时长为 0 或高度为负）
2. **起飞检查流程（if/elif/else + for/while + break/continue）**编写“起飞检查”流程并输出检查过程：

   - 逐项遍历 `check_items`（for 循环），输出“正在检查：xxx”；
   - 若检查项等于 `ignore_item`，输出“该项可忽略，跳过”，使用 `continue` 跳过；
   - 若发现**不满足起飞条件**，使用 if 判断并 `break` 立即停止检查：
     - `battery_percent < 30`（电量过低）
     - `gps_satellites < 6`（GPS不足）
     - `is_armed == False`（未解锁）
   - 检查结束后，用 `if...else` 输出“允许起飞/禁止起飞”。
3. **日志处理（for/while + try/except/else/finally + 异常类型识别）**对 `logs` 逐条处理并输出“日志校验结果”：

   - 用 for 遍历日志；
   - 在 try 中完成“取值 + 类型转换 + 简单计算”（如单位耗电 `battery/flight_min`）；
   - 捕获并区分：
     - `KeyError`（缺字段）
     - `TypeError/ValueError`（类型或数值转换失败）
     - `ZeroDivisionError`（飞行时长为 0 造成除 0）
     - `AssertionError`（断言不通过）
   - 在 else 中输出“校验通过”简报；
   - 在 finally 中输出“本条日志处理结束”。
4. **主动抛出（raise 与 assert）**在日志处理过程中加入业务规则：

   - 若 `flight_min <= 0`：使用 `raise ValueError("飞行时长必须为正数")`
   - 使用 `assert 0 <= battery <= 100, "电量范围应在0~100"`
   - 使用 `assert altitude >= 0, "高度不应为负数"`
     以上规则必须在代码中出现并可触发。
5. **输出排版与代码风格（注释 + 清晰输出）**

   - 脚本输出至少包含 3 个区块标题：`起飞检查`、`日志校验`、`总结`；
   - 代码必须包含文件头部三引号说明（文档字符串）与单行注释；
   - 核心代码必须带注释（例如“这里可能抛出 KeyError/ValueError”）；
   - 缩进统一 4 空格，不混用 Tab。

## 交付物

- 文件：`uav_safety_and_log.py`
- 运行截图或运行输出文本
- 关键检查点（输出中必须能看到）：
  （1）起飞检查逐项输出，至少出现 1 次 `continue` 跳过提示；
  （2）至少出现 1 次 `break` 停止检查提示（通过设置低电量或低 GPS 触发）；
  （3）日志校验至少出现 2 种不同异常类型的提示（例如 KeyError、ValueError）；
  （4）至少出现 1 次 `raise` 报错提示与 1 次 `assert` 断言失败提示；
  （5）每条日志最后都有 `finally` 的“结束”提示。

## 评价标准

| 项目           | 合格要求                                                  |
| -------------- | --------------------------------------------------------- |
| 起飞检查逻辑   | 能正确根据电量/GPS/解锁状态判定是否允许起飞               |
| 循环控制       | for/while 至少各使用 1 次；break/continue 至少各触发 1 次 |
| 异常处理完整性 | try/except/else/finally 均出现且能解释执行路径            |
| 异常识别       | 能区分并打印至少 3 种异常类型名称                         |
| 主动抛出       | raise 与 assert 均出现且能触发                            |
| 代码规范       | 注释齐全、变量定义完整、缩进正确、输出清晰                |
