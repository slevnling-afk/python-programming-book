(model6)=

# 模块六：面向对象基础

---

# 6.1 项目一：无人机飞控“状态模拟器”——类与对象入门

**项目简介**

> 在无人机飞行训练中，飞控（Flight Controller）会持续维护并输出状态，如是否解锁、飞行模式、电池电量与高度等。本项目把这组状态抽象为一个类，并通过创建对象与调用方法模拟状态更新，最终输出一份清晰的状态报告。

**项目定位**

> 本项目定位为“面向对象第一课”的实践化切入：首先通过案例理解**类与对象**，再用最小可运行代码完成**类的创建**与**对象的创建**，最后在一个脚本里完成“创建对象 → 调用方法 → 更新状态 → 输出报告”的完整闭环。

**需求分析**

> 脚本 `uav_fc_status_sim.py` 需要完成以下功能：
> - 创建一个“无人机飞控状态”的类，包含编号、是否解锁、模式、电池、高度等属性
> - 分别演示“无构造函数创建对象”和“有构造函数创建对象”
> - 通过方法调用模拟状态变化，如解锁、切换模式、电池下降、高度变化
> - 在关键步骤打印输出，形成《飞控状态报告》

**项目代码**

```python

# uav_fc_status_sim.py
# 项目一：无人机飞控“状态模拟器”（类与对象入门）

# -------------------------------
# 类的创建：FlightController
# -------------------------------
class FlightController:
    """飞控状态类：描述一类飞控"都具有的结构与行为"""

    def __init__(self, uav_id, battery_percent=100):
        # 实例属性：每台无人机各自独立
        self.uav_id = uav_id
        self.is_armed = False
        self.mode = "STABILIZE"
        self.battery_percent = battery_percent
        self.altitude_m = 0.0

    def arm(self):
        """解锁"""
        self.is_armed = True

    def disarm(self):
        """上锁"""
        self.is_armed = False

    def set_mode(self, mode):
        """切换飞行模式"""
        self.mode = mode

    def update_battery(self, cost):
        """消耗电量：cost 为消耗的百分比"""
        self.battery_percent -= cost
        if self.battery_percent < 0:
            self.battery_percent = 0

    def climb(self, delta):
        """爬升/下降：delta 为变化的米数（可为负）"""
        self.altitude_m += delta
        if self.altitude_m < 0:
            self.altitude_m = 0.0

    def report(self):
        """输出当前状态简报"""
        print("无人机：", self.uav_id)
        print("解锁：", self.is_armed)
        print("模式：", self.mode)
        print("电量：", self.battery_percent, "%")
        print("高度：", self.altitude_m, "m")


print("=== 《飞控状态报告》开始 ===")

# 有构造函数创建对象：创建时完成初始化（推荐）
print("\n【B】有构造函数创建对象（飞控对象）")
fc = FlightController("UAV-07", battery_percent=86)  # 创建对象并初始化
fc.report()

print("\n【C】模拟任务：解锁 -> 切模式 -> 爬升 -> 电量消耗 -> 输出")
fc.arm()
fc.set_mode("ALT_HOLD")
fc.climb(5.0)
fc.update_battery(3)
fc.report()

fc.climb(8.0)
fc.update_battery(5)
fc.report()

fc.disarm()
print("\n任务结束：已上锁")
fc.report()

print("=== 《飞控状态报告》结束 ===")
```

:::{admonition} 运行检查点
:class: important
运行输出中至少应出现：

- 初始状态报告（创建后立即 report）
- 两次状态更新后的报告（电量递减、高度递增）
- 任务结束后的上锁状态报告
  :::

:::{index} single: 类
:::
:::{index} single: 对象
:::
:::{index} single: 实例化
:::
:::{index} single: Class
:::

## 6.1.1 任务一：类与对象

类与对象是面向对象的起点。类描述一类事物的共同结构与行为，对象表示类的一个具体实例。可以把类理解为“图纸或表格模板”，把对象理解为“按模板生成的具体成品或一行记录”：

- 类规定有哪些属性与方法
- 对象拥有各自的属性取值
- 实例化是用类创建对象的过程

**如何抽象出一个类**

- 先列出这类东西都有什么信息，作为属性
- 再列出这类东西要做什么动作，作为方法
- 把变化的具体值放到对象里，把通用规则写进类里

**类、对象、实例化的对照如表6-1所示**

<p align="center"><strong>表6-1 类、对象、实例化对照表（无人机飞控场景）</strong></p>

| 概念                  | 一句话理解             | 无人机场景例子                        |
| --------------------- | ---------------------- | ------------------------------------- |
| 类（Class）           | 一类事物的抽象模板     | “飞控状态”模板：编号/模式/电量/高度 |
| 对象（Object）        | 某一类事物的具体实例   | `UAV-07` 这台无人机的飞控状态       |
| 实例化（Instantiate） | 用类“创建对象”的过程 | 用“飞控状态类”创建 `UAV-07` 对象  |

:::{admonition} 【AI辅助小课堂】把文字描述转成“类设计草图”
:class: tip
把下面两句发给 AI：
我要表示一台无人机飞控的状态，包含编号、模式、电量、高度、是否解锁；能做解锁、上锁、切模式、更新电量、爬升。请输出：建议的类名；建议的属性清单；建议的方法清单。
你再对照本项目的 `FlightController`，看看是否一致。
:::

:::{index} single: 类的创建
:::
:::{index} single: class关键字
:::
:::{index} single: 类名
:::
:::{index} single: 类体
:::
:::{index} single: self参数
:::

## 6.1.2 任务二：类的创建

创建类是用 `class` 定义一种新类型，把数据和操作组织在同一个结构中。可以把它理解为先写好一份可复用的模板，后续创建多个对象时都遵循同一套规则。

**类的创建语法**

```python
class 类名:
    """类说明（可选）"""

    # 类属性（可选）：属于类本身，所有对象共享
    class_attr = 值

    # 方法（常见）：描述对象行为
    def 方法名(self, 参数...):
        方法体
```

**类的组成**

- **类头（class header）**：`class 类名:` —— 声明并命名一个新类型
- **类体（class body）**：缩进块内所有内容 —— 可包含类说明、类属性、方法

**类的三要素**

- **类名**：表示“这一类事物”的名称（如“飞控”“电池”“航点队列”）
- **属性**：表示“这一类事物具备的数据/状态”（如模式、解锁状态、电量）
- **方法**：表示“这一类事物能执行的行为/功能”（如解锁、上锁、切换模式）

**`self` 参数**

- 在类的实例方法中，`self` 用来接收“调用该方法的那个对象本身”，表示“当前实例（当前对象）”
- self 可以把它理解成“这一个对象自己”，就是用来指向“当前正在操作的那一台对象”，让方法知道：要读/改的是谁的属性

**例如：**

创建一个“飞控面板”类（只演示类名、类属性、方法）

```python
class FlightPanel:
    """飞控面板：用于输出固定提示信息"""

    # 类属性：属于“类”，不依赖具体对象
    panel_name = "UAV Flight Panel"

    # 方法：写在类体中的行为（此处不引入 self，不讲实例）
    def show_title():
        print("=== ", FlightPanel.panel_name, " ===")


# ---- 运行 ----
print("类名：", FlightPanel.__name__)
print("类属性：", FlightPanel.panel_name)
FlightPanel.show_title()
```

该示例展示通过类名读取类属性并调用不依赖实例的方法，同时用 `__name__` 查看类名。

:::{admonition} 【AI辅助小课堂】类的三要素一句话识别
:class: tip
让AI针对电池设计一个简单的类，并指出类的三要素：类名、属性和方法。
:::

:::{admonition} 练习：创建“飞控模式表”类
:class: important
编写一个脚本，创建一个类 `FlightModeTable`：
- 在类体中定义 2 个类属性：`mode_1 = "Stabilize"`、`mode_2 = "AltHold"`
- 在类体中定义 1 个方法 `show()`：依次打印两行——`模式1: Stabilize`、`模式2: AltHold`
- 在类外部依次完成：打印 `FlightModeTable.mode_1`，再调用 `FlightModeTable.show()`
  :::

:::{index} single: 对象的创建
:::
:::{index} single: 无构造函数创建对象
:::
:::{index} single: 有构造函数创建对象
:::
:::{index} single: __init__方法
:::
:::{index} single: 构造函数
:::

## 6.1.3 任务三：对象的创建

对象的创建就是从类得到一个具体实例。可以把它理解为从模板生成一份具体记录，随后再填入或初始化需要的字段。

### 1.无构造函数创建对象

无构造函数创建对象是指类中不定义 `__init__`，先实例化对象，再手动为对象补齐属性。可以把它理解为先拿到一张空白表格，再按需要逐项填写。

**语法格式**

```python
class 类名:
    pass

obj = 类名()
obj.属性名 = 值
```

**例如：**

```python
class SimpleRecord:
    """空类：不写构造函数，也能创建对象并动态绑定属性"""
    pass

rec = SimpleRecord()          # 创建对象
rec.uav_id = "UAV-TEST"       # 动态添加属性
rec.note = "用于临时记录"     # 再添加一个属性

print("记录对象：", rec.uav_id, "|", rec.note)
```

该示例演示创建空类实例后，给对象动态添加新属性并读取打印。

:::{admonition} 字段遗漏风险
:class: warning
无构造函数创建对象时，如果忘记为对象补某个属性，例如忘记写 `rec.note = ...`，后面访问 `rec.note` 可能会触发异常。
:::

**练习：无构造函数对象创建**
:::{admonition} 练习：记录一个“起飞点”
:class: important
创建一个空类 `TakeoffPoint`，然后创建对象 `tp`，再动态添加 `lat`、`lon` 两个属性（自定数值即可），最后打印 `起飞点：(lat, lon)`。
:::

### 2.有构造函数创建对象

有构造函数创建对象是指类中定义 `__init__`，实例化时自动完成初始化。可以把它理解为用一张“带默认值的表格模板”直接生成完整记录，减少漏填字段的风险。

**语法格式**

```python
class 类名:
    def __init__(self, 参数...):
        self.属性名 = 值

    def 实例方法名(self):
        ...

obj = 类名(实参...)
obj.实例方法名()
```

**例如：**

```python
class FlightController:
    """带构造函数的类：创建时就初始化"""

    def __init__(self, uav_id, battery_percent):
        # 关键字段：创建即初始化
        self.uav_id = uav_id
        self.battery_percent = battery_percent
        self.mode = "STABILIZE"

    def report(self):
        """实例方法：输出对象当前状态（读取 self 的属性）"""
        print("无人机：", self.uav_id, "| 电量：", self.battery_percent, "% | 模式：", self.mode)


fc = FlightController("UAV-01", 90)  # 创建对象（自动执行 __init__）
fc.report()

# 修改对象属性后，再输出一次（用于观察对象状态变化）
fc.mode = "ALT_HOLD"
fc.report()
```

该示例展示 `__init__` 在实例化时初始化必备属性，并通过修改属性观察对象状态变化。

:::{admonition} 初始化优势
:class: important
带构造函数的对象创建可以保证关键字段“创建即完整”，便于对飞控状态等固定结构数据进行建模。
:::

:::{admonition} 【AI辅助小课堂】两次输出差异判断
:class: tip
把示例发给 AI，让 AI 用一句话说明两次 `report()` 输出为什么会不一样。
运行代码核对，并指出是哪一行改变了对象的状态。
:::

:::{admonition} 练习：编写“电池包”类 `BatteryPack`并创建对象
:class: important

- 类中定义构造函数 `__init__(self, percent)`，把参数保存为实例属性 `self.percent`
- 再定义一个实例方法 `report(self)`，输出 `电池电量：xx%`
- 创建两个对象 `bat1 = BatteryPack(90)`、`bat2 = BatteryPack(75)`
- 分别调用 `bat1.report()` 与 `bat2.report()` 输出结果
  :::

---

# 6.2 项目二：飞控“参数配置与自检器”——类与属性

**项目简介**

> 定义飞控类 `FlightController`：类属性负责“全局规则”，如安全电量阈值、允许模式、对象计数；实例属性负责“单机状态”，如编号、电量、模式、是否解锁。程序通过三类方法协同完成：实例方法更新状态并执行自检；类方法修改/查看全局规则并统计对象数量；静态方法完成格式化与范围判断等工具处理。

**项目定位**

> 本项目定位为“类的成员体系”训练：区分类属性与实例属性，掌握实例方法（操作对象自身）、类方法（操作类级别配置/计数）、静态方法（工具函数，不依赖对象与类状态），完成它们的访问、修改与调用。

**需求分析**

> 脚本 `uav_fc_config_check.py` 需要完成以下功能：
> - 定义 `FlightController` 类，并设置至少 2 个类属性，如阈值、允许模式或计数器
> - 创建至少 2 个飞控对象，并让它们具有不同的电量/模式
> - 通过类名与对象名两种方式访问/修改类属性并进行对比
> - 直接通过对象名访问/修改实例属性的访问与修改
> - 实例方法、类方法、静态方法的定义与调用
> - 输出《飞控配置与自检报告》，包含清晰过程与结论

**项目代码**

```python

# uav_fc_config_check.py
# 项目二：飞控“参数配置与自检器”


class FlightController:
    """飞控类：既包含"全局规则"，也包含"单机状态"""

    # ===== 类属性：所有对象共享 =====
    SAFE_BATTERY_MIN = 30  # 安全电量下限（%）
    ALLOWED_MODES = ["STABILIZE", "ALT_HOLD", "LOITER"]  # 允许的模式
    created_count = 0  # 已创建对象数量

    def __init__(self, uav_id, battery_percent=100, mode="STABILIZE"):
        # ===== 实例属性：每个对象独有 =====
        self.uav_id = uav_id
        self.battery_percent = battery_percent
        self.mode = mode
        self.is_armed = False

        # 统计对象数量：修改类属性（用类名更清晰）
        FlightController.created_count += 1

    # ===== 实例方法：操作“对象自身状态” =====
    def arm(self):
        """解锁（实例方法：改变对象状态）"""
        self.is_armed = True

    def set_mode(self, mode):
        """切换模式（实例方法：改变对象状态）"""
        self.mode = mode

    def drain(self, cost):
        """消耗电量（实例方法：改变对象状态）"""
        self.battery_percent -= cost
        if self.battery_percent < 0:
            self.battery_percent = 0

    def self_check(self):
        """自检（实例方法：读取类属性规则 + 检查实例状态）"""
        ok_battery = self.battery_percent >= FlightController.SAFE_BATTERY_MIN
        ok_mode = self.mode in FlightController.ALLOWED_MODES
        return ok_battery and ok_mode

    def report(self):
        """打印对象当前状态（实例方法）"""
        print("无人机：", self.uav_id)
        print("解锁：", self.is_armed)
        print("模式：", self.mode)
        print("电量：", self.battery_percent, "%")
        print("自检：", "通过" if self.self_check() else "不通过")

    # ===== 类方法：操作“类级别信息/规则” =====
    @classmethod
    def set_safe_battery_min(cls, new_min):
        """修改安全电量阈值（类方法：作用于类属性）"""
        cls.SAFE_BATTERY_MIN = new_min

    @classmethod
    def show_global_rules(cls):
        """输出全局规则（类方法）"""
        print("安全电量下限：", cls.SAFE_BATTERY_MIN, "%")
        print("允许模式：", cls.ALLOWED_MODES)
        print("已创建对象数：", cls.created_count)

    # ===== 静态方法：工具函数（不依赖 cls / self） =====
    @staticmethod
    def format_percent(x):
        """把数字格式化为百分比字符串（静态方法：只做计算/格式化）"""
        return str(x) + "%"

    @staticmethod
    def in_range(value, low, high):
        """判断数值是否在闭区间内（静态方法：纯工具）"""
        return low <= value <= high


print("=== 《飞控配置与自检报告》开始 ===")

print("\n【1】查看全局规则（类方法）")
FlightController.show_global_rules()

print("\n【2】创建两个飞控对象（实例）")
fc1 = FlightController("UAV-01", battery_percent=86, mode="STABILIZE")
fc2 = FlightController("UAV-07", battery_percent=25, mode="ALT_HOLD")

print("\n【3】类属性访问（通过类名）")
print("SAFE_BATTERY_MIN =", FlightController.SAFE_BATTERY_MIN)
print("ALLOWED_MODES =", FlightController.ALLOWED_MODES)

print("\n【4】类属性访问（通过对象名也能访问，但更推荐用类名）")
print("fc1.SAFE_BATTERY_MIN =", fc1.SAFE_BATTERY_MIN)

print("\n【5】修改类属性：用类方法修改阈值（推荐）")
FlightController.set_safe_battery_min(20)
FlightController.show_global_rules()

print("\n【6】实例属性访问与修改（只影响该对象）")
print("fc2 电量（修改前）：", fc2.battery_percent)
fc2.battery_percent = 40  # 直接修改实例属性
print("fc2 电量（修改后）：", fc2.battery_percent)

print("\n【7】实例方法：解锁、切模式、消耗电量")
fc1.arm()
fc1.set_mode("ALT_HOLD")
fc1.drain(10)
fc1.report()

print("\n【8】fc2 状态报告")
fc2.report()

print("\n【9】静态方法：格式化与范围判断")
print("fc1 电量格式化：", FlightController.format_percent(fc1.battery_percent))
print("fc1 电量是否在[0,100]：", FlightController.in_range(fc1.battery_percent, 0, 100))

print("\n=== 《飞控配置与自检报告》结束 ===")
```

:::{admonition} 运行检查点
:class: important
运行输出中至少应出现：
- 类方法打印的全局规则（阈值、允许模式、对象数）
- 两台无人机的状态报告（含“自检通过/不通过”）
- 一次类属性修改后的规则变化
- 一次实例属性修改仅影响单个对象
- 静态方法输出的百分比字符串与范围判断结果
  :::

:::{index} single: 类属性
:::
:::{index} single: 类属性的访问
:::
:::{index} single: 类属性的修改
:::
:::{index} single: 共享属性
:::

## 6.2.1 任务一：类属性

类属性是定义在类上的属性，由所有对象共享，常用于默认配置、规则常量与统计计数。可以把它理解为一条“共享规则”，修改一次，所有对象读取到的值都会随之变化。

**类属性的访问与修改**

```python
# 访问（推荐：用类名）
类名.类属性名
实例名.类属性名

# 修改
类名.类属性名 = 新值
# 或在类方法内通过 cls 修改
@classmethod
def 方法(cls, ...):
    cls.类属性名 = 新值
```

**例如：**

```python
class FC:
    SAFE_MIN = 30  # 类属性

print("修改前：", FC.SAFE_MIN)
FC.SAFE_MIN = 20  # 直接修改类属性
print("修改后：", FC.SAFE_MIN)
```

该示例演示通过类名读取与修改类属性 `SAFE_MIN`，修改结果会直接反映在类上。

:::{admonition} 【AI辅助小课堂】共享特性验证
:class: tip
让 AI 预测：针对上述示例，如果创建两个对象 `a`、`b`，再把 `类名.类属性` 改掉，`a` 与 `b` 访问到的类属性会不会一起改变？
运行以上代码并自行扩展验证。
:::

:::{admonition} 练习：设置全局安全阈值
:class: important
定义类 `MiniFC`，包含类属性 `SAFE_BATTERY_MIN=35`，打印初始阈值，把阈值改为 25，再次打印阈值。
:::

:::{index} single: 实例属性
:::
:::{index} single: 实例属性的访问
:::
:::{index} single: 实例属性的修改
:::

## 6.2.2 任务二：实例属性

实例属性属于某个对象自身，每个对象各有一份，互不影响，适合存放个体差异与当前状态。可以把它理解为“每个人自己的信息”，改动只会发生在这一个对象上。

**实例属性的访问与修改**

```python
# 访问
对象名.实例属性名

# 修改
对象名.实例属性名 = 新值
```

**例如：**

```python
class UAV:
    def __init__(self, uav_id, battery):
        self.uav_id = uav_id      # 实例属性
        self.battery = battery    # 实例属性

u1 = UAV("UAV-01", 80)
u2 = UAV("UAV-02", 50)

u1.battery = 70  # 修改 u1 的实例属性
print(u1.uav_id, u1.battery)
print(u2.uav_id, u2.battery)  # u2 不受影响
```

该示例演示两个对象分别拥有独立的 `battery` 实例属性，修改 `u1.battery` 不会影响 `u2`。

:::{admonition} 【AI辅助小课堂】“互不影响”推理
:class: tip
把上面示例发给 AI，让 AI 用一句话解释为什么改了 `u1.battery`，`u2.battery` 不变？
:::

:::{admonition} 练习：两台无人机的电量更新
:class: important
定义类 `UAVState`，构造函数接收 `uav_id` 与 `battery`；创建两个对象 `UAV-01` 电量 90，`UAV-07` 电量 60；把 `UAV-07` 电量改为 55，并打印两台无人机的编号与电量。

:::

:::{index} single: 实例方法
:::
:::{index} single: 实例方法的定义
:::
:::{index} single: 实例方法的调用
:::

## 6.2.3 任务三：实例方法

实例方法是通过对象调用的方法，调用时第一个参数接收当前对象 `self`，用于读取或修改该对象的实例属性。可以把它理解为对象自带的“操作按钮”，按下后只会影响这个对象自己的状态。

**实例方法的定义与使用**

```python
class 类名:
    def 方法名(self, 参数...):
        # 使用 self 访问/修改实例属性
        self.xxx = ...

对象名.方法名(实参...)
```

**例如：**

```python
class FC:
    def __init__(self, uav_id):
        self.uav_id = uav_id
        self.is_armed = False

    def arm(self):
        # 核心：实例方法通过 self 改变对象状态
        self.is_armed = True

fc = FC("UAV-07")
print("解锁前：", fc.is_armed)
fc.arm()
print("解锁后：", fc.is_armed)
```

该示例演示实例方法 `arm()` 通过 `self` 修改当前对象的 `is_armed` 状态。

:::{admonition} 【AI辅助小课堂】self 的含义
:class: tip
针对上述示例，让 AI 解释在 `fc.arm()` 执行时，`self` 指向谁？为什么能改到 `fc.is_armed`？
:::

:::{admonition} 练习：实现“电量消耗”
:class: important
定义类 `BatteryPack`：构造函数接收 `percent`，定义实例方法 `drain(cost)`让电量减少 `cost`（电量最低不小于 0）；创建对象初始电量 40；调用 `drain(15)` 后打印电量。
:::

:::{index} single: 类方法
:::
:::{index} single: @classmethod
:::
:::{index} single: cls参数
:::
:::{index} single: 类方法的定义
:::

## 6.2.4 任务四：类方法

类方法是通过类调用的方法，调用时第一个参数接收类本身 `cls`，常用于读写类属性或提供统一的创建入口。可以把它理解为“管理员入口”，用来维护全体对象共享的规则。

**类方法的定义与使用**

```python
class 类名:
    @classmethod
    def 方法名(cls, 参数...):
        cls.类属性名 = ...

类名.方法名(实参...)
# 也可以用对象调用，但本质仍作用于类
对象名.方法名(实参...)
```

**例如：**

```python
class FC:
    SAFE_MIN = 30

    @classmethod
    def set_safe_min(cls, x):
        cls.SAFE_MIN = x

print("修改前：", FC.SAFE_MIN)
FC.set_safe_min(25)
print("修改后：", FC.SAFE_MIN)
```

该示例演示类方法通过 `cls` 修改共享的类属性 `SAFE_MIN`。

:::{admonition} 【AI辅助小课堂】cls 的含义
:class: tip
让 AI 用一句话说明：`cls` 与 `self` 的区别是什么？分别在什么方法里出现？
:::

:::{admonition} 练习：统一修改允许模式
:class: important
定义类 `ModeRule`，包含类属性 `ALLOWED=["STABILIZE","ALT_HOLD"]`，写一个类方法 `add_mode(mode)`，把新模式追加到 `ALLOWED` 中；调用 `add_mode("LOITER")` 后打印 `ALLOWED`。
:::

:::{index} single: 静态方法
:::
:::{index} single: @staticmethod
:::
:::{index} single: 静态方法的定义
:::

## 6.2.5 任务五：静态方法

静态方法是放在类里面的工具函数，不接收 `self` 或 `cls`，也不依赖对象状态或类状态。可以把它理解为“类名下面的工具箱”，把相关的小判断与小计算集中放在一起方便调用。

**静态方法的定义与使用**

```python
class 类名:
    @staticmethod
    def 方法名(参数...):
        return 结果

类名.方法名(实参...)
# 也可用对象调用，但一般推荐用类名调用更清晰
```

**例如：**

```python
class Tool:
    @staticmethod
    def in_range(x, low, high):
        return low <= x <= high

print(Tool.in_range(80, 0, 100))
print(Tool.in_range(120, 0, 100))
```

该示例演示静态方法只做范围判断，不需要访问或修改任何对象与类的数据。

:::{admonition} 使用建议
:class: important
静态方法不需要 `self`/`cls`，适合写“纯计算、纯判断、纯格式化”的小工具；
当方法需要访问或修改对象状态时，应使用实例方法；需要修改类级别规则时，使用类方法。
:::

:::{admonition} 【AI辅助小课堂】静态方法识别：要不要 `self/cls`
:class: tip
把“电池百分比是否在 0~100”、“无人机编号是否以 `UAV-` 开头”和“两点距离是否超出安全半径”这三句功能描述发给 AI，让它分别标注应写成：实例方法 / 类方法 / 静态方法，并在每条后面补一句理由（是否需要用到对象数据 `self.xxx` 或类数据 `cls.xxx`）。
你再用自己的判断复核：凡是不依赖任何对象状态、也不依赖类属性/类状态、只做独立计算或规则校验的，统一归为“静态方法”。
:::

:::{admonition} 练习：电量合法性检查
:class: important
定义类 `Check`，写静态方法 `is_battery_ok(percent)`：若 percent 在 0~100 之间返回 True，否则返回 False。分别测试 `80` 与 `-5`，打印结果。
:::

---

# 6.3 项目三：飞控“机型扩展与安全封装器”——类的继承与方法重写

**项目简介**

> 用 `BaseController` 表达“飞控共性”：编号、电量、模式、自检报告；用 `QuadController`、`FixedWingController` 继承 `BaseController`，并重写自检规则；用 `LogMixin`、`GeoFenceMixin` 与飞控类进行多继承组合，形成“可记录日志 + 围栏判定”的增强型飞控，同时演示公有/保护/私有成员的访问方式。

**项目定位**

> 本项目定位为“面向对象进阶控制”：掌握单继承与多继承的语法与使用场景，掌握方法重写（override）实现差异化规则，掌握类成员访问限制的命名规范（公有/保护/私有）与可访问范围。

**需求分析**

> 脚本 `uav_fc_inherit_secure.py` 需要完成以下功能：
> - 定义基础类 `BaseController`，包含：公有成员、保护成员、私有成员各至少 1 个
> - 完成单继承：创建 `QuadController(BaseController)` 与 `FixedWingController(BaseController)`
> - 完成多继承：创建 `SmartController(LogMixin, GeoFenceMixin, BaseController)`（顺序可按示例）
> - 完成方法重写：子类重写 `self_check()` 或 `report()`，并给出差异输出
> - 输出对比报告，并在代码中写出必要注释
> - 给出访问限制表格（公有/保护/私有的外部访问、子类访问、类内部访问与“如何访问”）

**项目代码**

```python

# uav_fc_inherit_secure.py
# 项目三：飞控“机型扩展与安全封装器”


class BaseController:
    """基础飞控：承载共性规则"""

    # 公有：所有人都能用（类属性）
    ALLOWED_MODES = ["STABILIZE", "ALT_HOLD", "LOITER"]

    def __init__(self, uav_id, battery_percent=100, mode="STABILIZE"):
        # 公有实例属性：外部可直接访问（但仍建议通过方法修改）
        self.uav_id = uav_id

        # 保护成员：约定“类内部/子类可用”，外部尽量别直接用
        self._battery_percent = battery_percent

        # 私有成员：用于封装敏感信息（外部不应直接访问）
        self.__arm_code = "ARM-OK"   # 模拟“解锁口令/敏感标记”

        self.mode = mode
        self.is_armed = False

    # 公有实例方法：外部可调用
    def arm(self, code):
        """解锁：演示私有成员的“类内访问”"""
        if code == self.__arm_code:
            self.is_armed = True
            return True
        return False

    def set_mode(self, mode):
        """切换模式：只允许切到允许列表里的模式"""
        if mode in BaseController.ALLOWED_MODES:
            self.mode = mode
            return True
        return False

    def self_check(self):
        """
        自检：基础版规则（可被子类重写）
        - 电量 >= 30
        - 模式在允许列表中
        """
        ok_battery = self._battery_percent >= 30
        ok_mode = self.mode in BaseController.ALLOWED_MODES
        return ok_battery and ok_mode

    def report(self):
        """输出报告（可被子类重写）"""
        print("无人机：", self.uav_id)
        print("模式：", self.mode)
        print("电量：", self._battery_percent, "%")
        print("解锁：", self.is_armed)
        print("自检：", "通过" if self.self_check() else "不通过")


# ========== 单继承：四旋翼 ==========
class QuadController(BaseController):
    """四旋翼飞控：继承基础飞控，并重写自检规则"""

    def self_check(self):
        # 核心：方法重写（override）
        # 四旋翼规则：基础规则 + 电量阈值更高（>= 35）
        ok_base = super().self_check()  # 调用父类规则
        ok_battery = self._battery_percent >= 35
        return ok_base and ok_battery


# ========== 单继承：固定翼 ==========
class FixedWingController(BaseController):
    """固定翼飞控：继承基础飞控，并重写自检规则"""

    def self_check(self):
        # 固定翼规则：基础规则 + 必须在 LOITER 或 STABILIZE（示例规则）
        ok_base = super().self_check()
        ok_mode = self.mode in ["STABILIZE", "LOITER"]
        return ok_base and ok_mode


# ========== 多继承：两个“功能混入” ==========
class LogMixin:
    """日志混入：提供记录功能（不依赖飞控内部状态也能工作）"""
    def log(self, msg):
        print("[LOG]", msg)

class GeoFenceMixin:
    """围栏混入：提供围栏判断功能"""
    def in_fence(self, x, y):
        # 简化：围栏为 0~100 的正方形
        return 0 <= x <= 100 and 0 <= y <= 100


class SmartController(LogMixin, GeoFenceMixin, BaseController):
    """增强飞控：多继承组合（日志 + 围栏 + 基础飞控）"""

    def report(self):
        # 重写 report：在输出前后加日志
        self.log("开始生成智能飞控报告")
        super().report()
        self.log("报告生成结束")


print("=== 《机型扩展与自检报告》开始 ===\n")

# 基础飞控
base = BaseController("UAV-BASE", battery_percent=32, mode="ALT_HOLD")
base.arm("ARM-OK")  # 正确口令
base.report()
print("-" * 40)

# 四旋翼子类（单继承 + 重写）
quad = QuadController("UAV-QUAD", battery_percent=32, mode="ALT_HOLD")
quad.arm("ARM-OK")
quad.report()  # 由于阈值更高，可能不通过
print("-" * 40)

# 固定翼子类（单继承 + 重写）
fw = FixedWingController("UAV-FW", battery_percent=40, mode="ALT_HOLD")
fw.arm("ARM-OK")
fw.report()  # 由于模式限制，可能不通过
print("-" * 40)

# 多继承组合类
smart = SmartController("UAV-SMART", battery_percent=80, mode="LOITER")
smart.arm("ARM-OK")
smart.report()
print("围栏检查(50,50)：", smart.in_fence(50, 50))
print("围栏检查(120,50)：", smart.in_fence(120, 50))
print("-" * 40)

# 访问限制演示（可运行且不报错）
print("【访问限制演示】")
print("公有成员 uav_id：", base.uav_id)           # ✅ 外部可访问
print("保护成员 _battery_percent：", base._battery_percent)  # △ 外部可访问，但不推荐
# 私有成员 __arm_code：外部直接访问会报错，这里用“安全方式”演示（不让程序崩）
try:
    print(base.__arm_code)  # ❌ 通常会 AttributeError
except AttributeError:
    print("私有成员 __arm_code：外部直接访问失败（符合预期）")

# 通过“名称重整”可访问（不推荐，仅用于理解机制）
print("通过名称重整访问私有成员（不推荐）：", base._BaseController__arm_code)

print("\n=== 《机型扩展与自检报告》结束 ===")
```

```text
BaseController
 ├─ QuadController         （单继承：重写 self_check）
 ├─ FixedWingController     （单继承：重写 self_check）
 └─ SmartController         （多继承：LogMixin + GeoFenceMixin + BaseController）
```

:::{admonition} 运行检查点
:class: important
运行输出中应至少能看到：
- Base/Quad/FixedWing 三种对象的自检结果不同（体现“重写差异”）
- SmartController 输出前后带 [LOG]（体现“重写 report”）
- 外部访问 `uav_id` 成功、访问 `_battery_percent` 成功但提示“约定不推荐”
- 外部直接访问 `__arm_code` 失败（try/except 捕获到），并能看到名称重整形式 `_BaseController__arm_code`
  :::

:::{index} single: 继承
:::
:::{index} single: 单继承
:::
:::{index} single: 多继承
:::
:::{index} single: 父类
:::
:::{index} single: 子类
:::
:::{index} single: MRO
:::

## 6.3.1 任务一：类的继承

继承用于表达“**is-a（是一种）**”关系，子类会获得父类的属性与方法，并在此基础上扩展。可以把父类理解为基础模板，子类是在模板上加特性的版本，用来复用共性并集中管理差异。

### 1. 单继承

单继承指一个子类只继承一个父类，是最常见、最易理解的继承方式。可以把它理解为在同一份基础模板上做一次定制。

**单继承语法格式**

```python
class 子类名(父类名):
    子类内容
```

**例如：**

```python
class BaseFC:
    def hello(self):
        print("我是基础飞控")

class QuadFC(BaseFC):
    pass

q = QuadFC()
q.hello()  # 子类对象可直接使用父类方法
```

该示例演示子类继承父类方法，子类实例可以直接调用父类定义的 `hello()`。

:::{admonition} 【AI辅助小课堂】“继承后能用哪些东西？”
:class: tip
把上面示例发给 AI，让 AI 列出：`QuadFC()` 创建出的对象能使用哪些成员？这些成员来自哪里（父类/子类）？
:::

:::{admonition} 练习：机型子类扩展
:class: important
定义类 `BaseController`，包含方法 `self_check()`（返回 True 即可）。
再定义子类 `VtolController(BaseController)`，新增方法 `vtol_tip()` 打印“垂直起降检查”。
创建 `VtolController` 对象，分别调用 `self_check()` 与 `vtol_tip()`。
:::

### 2. 多继承

多继承指一个类同时继承多个父类，用于把多个能力“组合到一起”。可以把它理解为把多个功能模块拼装成一个整体，父类顺序会影响同名方法的查找顺序。

**多继承语法格式**

```python
class 子类名(父类1, 父类2, ...):
    子类内容
```

**例如：**

```python
class A:
    def fa(self):
        print("来自 A")

class B:
    def fb(self):
        print("来自 B")

class C(A, B):
    pass

c = C()
c.fa()
c.fb()
```

该示例演示多继承把两个父类的方法合并到同一个子类实例上使用。

:::{admonition} 多继承提示
:class: warning
多继承的“父类顺序”会影响方法查找顺序（MRO）。入门阶段建议：
MixIn 放前面，核心父类放后面，避免同名方法冲突。
:::

:::{admonition} 【AI辅助小课堂】父类顺序影响什么？
:class: tip
让 AI 用一句话解释：当两个父类都有同名方法时，Python 会优先用哪一个？并提示“父类列表的先后顺序”与此有关。
:::

:::{admonition} 练习：日志、定位组合
:class: important
写两个类：`LogMixin`（方法 `log(msg)` 打印 `[LOG] msg`），`GpsMixin`（方法 `gps_ok()` 返回 True）。
再写 `UavHelper(LogMixin, GpsMixin)`，创建对象后调用 `log("start")` 与 `gps_ok()`。
:::

:::{index} single: 方法重写
:::
:::{index} single: override
:::
:::{index} single: super()函数
:::

## 6.3.2 任务二：方法的重写

方法重写指子类定义一个与父类同名的方法，从而替换父类的默认实现并改变行为。可以把它理解为同一个按钮在不同型号上执行不同策略，但调用方式保持一致。

**例如：**

```python
class BaseFC:
    def self_check(self):
        return True

class SpecialFC(BaseFC):
    def self_check(self):
        # 重写：改变规则
        return False

b = BaseFC()
s = SpecialFC()
print("Base:", b.self_check())
print("Special:", s.self_check())
```

该示例演示子类用同名 `self_check()` 覆盖父类实现，从而改变返回结果。

:::{admonition} 【AI辅助小课堂】为什么要用 super()？
:class: tip
让 AI 说明：在 `QuadController.self_check()` 中为什么先 `super().self_check()`？
提示：这样能复用父类共性规则，再叠加子类差异规则。
:::

:::{admonition} 练习：重写报告输出
:class: important
定义父类 `BaseReporter`，方法 `report()` 打印“基础报告”。
定义子类 `WarnReporter(BaseReporter)`，重写 `report()`：在基础报告前打印“⚠警告：注意安全”。创建子类对象调用 `report()`。
:::

:::{index} single: 访问限制
:::
:::{index} single: 公有成员
:::
:::{index} single: 保护成员
:::
:::{index} single: 私有成员
:::
:::{index} single: 名称重整
:::
:::{index} single: _name
:::
:::{index} single: __name
:::

## 6.3.3 任务三：类成员的访问限制

Python 通过命名约定表达成员的可访问范围。`name` 表示公有，`_name` 表示约定保护，`__name` 会触发名称重整以增强封装。可以把它理解为公开抽屉、内部抽屉和上锁抽屉，越往后越不建议在类外直接触碰。

公有/保护/私有成员的访问范围与访问方式如表6-2所示。

<p align="center"><strong>表6-2 公有/保护/私有成员的访问范围与访问方式</strong></p>

| 成员类型 | 命名形式   | 类外部（obj.）                         | 类内部（方法中） | 子类内部（方法中）          | 如何访问/说明                                      |
| -------- | ---------- | -------------------------------------- | ---------------- | --------------------------- | -------------------------------------------------- |
| 公有成员 | `name`   | ✅ 可访问                              | ✅ 可访问        | ✅ 可访问                   | 推荐正常使用                                       |
| 保护成员 | `_name`  | △ 能访问但不推荐                      | ✅ 可访问        | ✅ 可访问                   | 约定“内部/子类使用”                              |
| 私有成员 | `__name` | ❌ 直接访问失败（常见 AttributeError） | ✅ 可访问        | △ 一般不直接用（会被重整） | 机制上会重整为 `_类名__name`（不推荐在外部使用） |

:::{admonition} 关键提醒
:class: warning
保护成员 `_name` 与私有成员 `__name` 的差别是：

* `_name` 只是“约定不推荐外部用”，技术上仍能访问
* `__name` 会触发名称重整，使“外部直接访问”通常失败，从而更像封装
  :::

**例如：**

```python
class Demo:
    def __init__(self):
        self.public_v = 1
        self._protected_v = 2
        self.__private_v = 3  # 私有：会名称重整

    def show_inside(self):
        # 类内部方法中：三者都能访问
        print(self.public_v, self._protected_v, self.__private_v)

d = Demo()
print("公有：", d.public_v)
print("保护：", d._protected_v)

# 私有：外部直接访问通常失败，这里用 try/except 保证可运行
try:
    print(d.__private_v)
except AttributeError:
    print("私有：外部直接访问失败（符合预期）")

# 名称重整访问（不推荐，仅用于理解）
print("私有（名称重整，不推荐）：", d._Demo__private_v)

d.show_inside()
```

该示例演示公有与保护成员可直接访问，私有成员外部直接访问会失败，并用名称重整形式帮助理解封装机制。

:::{admonition} 【AI辅助小课堂】封装与安全
:class: tip
让 AI 用飞控例子解释：为什么“解锁口令/密钥/敏感阈值”更适合做成私有成员 `__xxx`？
并让 AI 提示：即使能通过名称重整访问，也不应在外部代码中这样写。
:::

:::{admonition} 练习：保护与私有对比
:class: important
定义类 `MiniFC`：包含公有属性 `uav_id`，包含保护属性 `_battery`，包含私有属性 `__key`，成员方法 `show()` 在类内部打印三者。在类外部：打印 `uav_id` 与 `_battery`，对 `__key` 用 try/except 捕获访问失败，最后调用 `show()`。
:::

---

# 6.4 项目四：综合实践项目——无人机飞控“机型实例化与报告中心”

## 项目简介

本项目通过编写一个脚本，把多台无人机的飞控信息用“类与对象”进行建模与实例化，并由“报告中心”统一输出一份结构清晰、可核对的《飞控报告中心》文本报告，用于外场训练前的标准化检查与对比展示。

## 需求分析

在无人机外场训练中，同一套飞控逻辑常需要快速生成不同机型的飞控实例，并完成：模式校验、电量阈值自检、围栏判定、操作日志输出与封装访问控制等。课堂实践要求学生在 90 分钟内完成脚本 `uav_fc_report_center.py`，实现“类设计 + 机型扩展 + 报告输出 + 访问限制演示”四件事。

脚本需要完成以下功能：

1. **创建类与对象（实例化）**
   至少创建 3 个飞控对象，并在同一份报告中输出差异对比：

   * 基础飞控对象（Base）
   * 四旋翼飞控对象（Quad，继承 + 重写）
   * 智能飞控对象（Smart，多继承组合）
2. **对象创建两种方式（无构造函数 vs 有构造函数）**
   在脚本中同时体现两种创建对象方式：

   * 无构造函数创建对象：先实例化，再手动补齐属性（用于体验“对象可动态加属性”）
   * 有构造函数创建对象：通过 `__init__` 统一初始化 `uav_id / 电量 / 模式` 等关键字段
3. **类属性与实例属性（共享 vs 私有）**
   需要清晰演示“类属性”和“实例属性”的访问与修改：

   * 类属性：报告标题 `REPORT_TITLE`、允许模式 `ALLOWED_MODES`（要求演示用类名/类方法修改一次）
   * 实例属性：如 `uav_id`、`mode`、`is_armed`、`battery_percent`（要求演示用对象名修改一次）
4. **三种方法类型（实例方法/类方法/静态方法）**
   在脚本中必须出现并被调用：

   * 实例方法：如 `arm()`、`self_check()`、`report_line()`（输出一行报告）
   * 类方法：如 `set_title()`（修改类属性）、`from_quick()`（快速创建对象）
   * 静态方法：如 `in_fence(x, y)`（围栏判定工具，不依赖对象状态）
5. **继承与重写（单继承）**
   创建四旋翼子类继承基础飞控类，并重写 `self_check()`：

   * 基础飞控：电量阈值（例如 ≥30）+ 模式在允许列表
   * 四旋翼飞控：阈值更严格（例如 ≥35），并能在报告中体现差异
6. **多继承组合（混入能力）**
   通过多继承把“日志能力（LogMixin）”组合进智能飞控：

   * 生成报告行时输出日志（如 `[LOG] UAV-xx 生成报告行`），体现组合能力
7. **访问限制演示（公有/保护/私有 + try/except）**
   在报告末尾演示三类成员访问效果，且程序必须可运行不中断：

   * 公有成员：可直接访问
   * 保护成员（以下划线开头）：可访问但强调“不推荐”
   * 私有成员（双下划线）：外部直接访问触发 `AttributeError`，必须用 `try/except` 捕获并给出“符合预期”的提示，同时展示名称重整访问方式（仅理解机制）

## 交付物

- 文件：`uav_fc_report_center.py`
- 运行截图或运行输出文本
- 关键检查点（输出中必须能看到）：
  （1）无构造函数对象 `SimpleFC()` 的“先创建再赋值”效果
  （2）报告标题被类方法修改后的新标题
  （3）三类飞控对象（Base/Quad/Smart）至少各出现 1 行报告
  （4）围栏检查两次（一个在内、一个越界）
  （5）私有成员 `__arm_code` 外部访问失败被捕获（程序不中断）

## 评价标准

| 项目            | 合格要求                                               |
| --------------- | ------------------------------------------------------ |
| 类与对象        | 至少创建 3 个对象并输出可核对结果                      |
| 两种对象创建    | 同时出现“无构造函数创建对象”和“有构造函数创建对象” |
| 类属性/实例属性 | 能分别演示访问与修改（至少各 1 次）                    |
| 方法类型        | 实例方法/类方法/静态方法均出现并正确调用               |
| 继承与重写      | 至少 1 个子类重写父类方法，并在报告中体现差异          |
| 多继承          | 至少 1 个类使用多继承组合能力（如日志混入）            |
| 访问限制        | 公有/保护/私有成员演示完整且程序可运行                 |
| 代码风格        | 文件头注释、核心代码注释、缩进规范（4空格）            |