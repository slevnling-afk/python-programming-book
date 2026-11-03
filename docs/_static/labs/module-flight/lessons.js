// 模块三 · 项目四：模块、包与库。多文件 Python 真实导入，动作来自实际计算。
export const lessons = [
  {
    "id": "01",
    "shortTitle": "打开数学盒",
    "title": "import math：把计算出的距离变成两次定高飞行",
    "kicker": "3.4.1 · 导入整个标准库模块",
    "description": "先导入数学工具盒，再用 math.sqrt() 算出水平位移长度。距离乘以倍率决定第一次高度，第二次使用距离的两倍。",
    "objective": "补全 import 语句和“模块名.成员”调用，预测两条高度指令的实际数值。",
    "concept": "import math 在当前文件绑定模块名 math。sqrt 是其中的函数，调用时写 math.sqrt(...)；导入本身不产生飞行动作，计算结果被主流程用于定高。",
    "traceHint": "参考 dx=3、dy=4，距离为 5 m，第一次高度 20 m，第二次 10 m。改变坐标或倍率，比较先升后降与先降后升。",
    "blanks": [
      {
        "id": "m01_import",
        "answer": "import",
        "hint": "把整个模块导入程序，使用哪个关键字？",
        "explanation": "import math 让当前文件可以通过 math 访问模块成员。"
      },
      {
        "id": "m01_module",
        "answer": "math",
        "hint": "平方根工具属于哪个标准库模块？",
        "explanation": "math 是 Python 自带标准库，本关无需安装第三方包。"
      },
      {
        "id": "m01_dx",
        "answer": "3",
        "hint": "横向位移参考为 3，可探索 1～9 m。",
        "explanation": "dx 的平方进入距离公式，会实际改变后续高度。",
        "numberRange": [
          1,
          9
        ]
      },
      {
        "id": "m01_dy",
        "answer": "4",
        "hint": "纵向位移参考为 4，可探索 1～9 m。",
        "explanation": "dy 与 dx 一起决定直角三角形的斜边长度。",
        "numberRange": [
          1,
          9
        ]
      },
      {
        "id": "m01_sqrt",
        "answer": "sqrt",
        "hint": "math 中计算平方根的成员名。",
        "explanation": "math.sqrt(dx*dx + dy*dy) 返回实际距离。"
      },
      {
        "id": "m01_factor",
        "answer": "4",
        "hint": "第一次高度倍率参考为 4，可探索 2～4。",
        "explanation": "倍率乘以算出的距离得到绝对目标高度。",
        "numberRange": [
          2,
          4
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m01_import}} {{m01_module}}\n\ndx = {{m01_dx}}\ndy = {{m01_dy}}\ndistance = math.{{m01_sqrt}}(dx * dx + dy * dy)\nprint(\"实际水平距离：\", round(distance, 2), \"m\")\n\naction = \"altitude\"\nheight = distance * {{m01_factor}}\nspeed = 4\n# @event command\n\nheight = distance * 2\n# @event command"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "distance",
        "label": "距离控制高度",
        "description": "参考计算 3²+4²=25，开方为 5；导入成功后，两个计算结果依次成为飞机的目标高度。",
        "prelude": ""
      }
    ],
    "defaultScenario": "distance",
    "expectedActions": [
      "altitude",
      "altitude"
    ]
  },
  {
    "id": "02",
    "shortTitle": "给工具起别名",
    "title": "import random as rd：同一个种子生成同一条探测路线",
    "kicker": "3.4.1 · 模块别名",
    "description": "给 random 起名 rd，用 randint() 生成两个随机航点。修改随机种子，再比较路线；同一种子重复运行可以复现。",
    "objective": "理解 as 绑定的别名，并用别名调用标准库成员。",
    "concept": "import random as rd 把模块对象绑定为 rd，因此调用写 rd.randint(...)。seed 固定随机序列，便于课堂对照；坐标仍是随机模块实际产生的数值。",
    "traceHint": "先固定种子重飞，确认两个航点可复现；再改种子或切换探测范围。random 属于标准库，不需要额外安装。",
    "blanks": [
      {
        "id": "m02_import",
        "answer": "import",
        "hint": "导入 random 模块的关键字。",
        "explanation": "import 会加载标准库模块并绑定名称。"
      },
      {
        "id": "m02_as",
        "answer": "as",
        "hint": "给模块起别名，使用哪个关键字？",
        "explanation": "as 后面的名字成为本文件访问模块的名称。"
      },
      {
        "id": "m02_alias",
        "answer": "rd",
        "hint": "后文用 rd.seed 和 rd.randint，别名应是什么？",
        "explanation": "模块别名与调用位置的名称必须一致。"
      },
      {
        "id": "m02_seed",
        "answer": "7",
        "hint": "随机种子参考为 7，可填 1～99 的整数。",
        "explanation": "相同种子配合相同调用顺序，会产生相同的伪随机坐标。",
        "numberRange": [
          1,
          99
        ],
        "integer": true
      },
      {
        "id": "m02_randint",
        "answer": "randint",
        "hint": "在两个整数边界之间产生随机整数的函数名。",
        "explanation": "randint(a,b) 会把两个端点也纳入可选范围。"
      },
      {
        "id": "m02_speed",
        "answer": "6",
        "hint": "移动速度参考为 6 m/s，可探索 2～12。",
        "explanation": "生成的航点不变时，速度会改变模拟移动快慢。",
        "numberRange": [
          2,
          12
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m02_import}} random {{m02_as}} {{m02_alias}}\n\nrd.seed({{m02_seed}})\naction = \"move\"\nspeed = {{m02_speed}}\nx = rd.{{m02_randint}}(-boundary, boundary)\ny = rd.randint(-boundary, boundary)\nprint(\"第一个随机航点：\", x, y)\n# @event command\n\nx = rd.randint(-boundary, boundary)\ny = rd.randint(-boundary, boundary)\nprint(\"第二个随机航点：\", x, y)\n# @event command"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "near",
        "label": "小范围探测 · ±18 m",
        "description": "两个点都落在横纵坐标 -18～18 范围内。",
        "prelude": "boundary = 18"
      },
      {
        "id": "wide",
        "label": "扩大探测 · ±28 m",
        "description": "随机种子保持一致，边界改变后实际坐标也会改变。",
        "prelude": "boundary = 28"
      }
    ],
    "defaultScenario": "near",
    "expectedActions": [
      "move",
      "move"
    ]
  },
  {
    "id": "03",
    "shortTitle": "指名取工具",
    "title": "from math import sqrt：直接调用成员，完成航点与升降",
    "kicker": "3.4.1 · 导入指定成员",
    "description": "只从 math 中拿出 sqrt。在当前文件直接用 sqrt(...)，再把结果用作移动速度和悬停高度。",
    "objective": "比较 import math 与 from math import sqrt 两种写法的名称绑定和调用形式。",
    "concept": "from math import sqrt 绑定的是成员名 sqrt；当前文件可直接调用它。模块被加载与主程序中是否拥有 math 这个名字，是两件需要区分的事。",
    "traceHint": "3、4 对应距离 5，5、12 对应距离 13。先看直接调用的结果，再观察同一结果怎样影响速度与高度。",
    "blanks": [
      {
        "id": "m03_from",
        "answer": "from",
        "hint": "从某个模块取出指定成员，语句开头是什么？",
        "explanation": "from 后面写模块路径。"
      },
      {
        "id": "m03_module",
        "answer": "math",
        "hint": "sqrt 来自哪个模块？",
        "explanation": "本关继续使用标准库 math。"
      },
      {
        "id": "m03_import",
        "answer": "import",
        "hint": "模块路径和成员名之间用哪个关键字？",
        "explanation": "from 模块 import 成员 是完整结构。"
      },
      {
        "id": "m03_member",
        "answer": "sqrt",
        "hint": "只导入平方根函数，应写哪个名称？",
        "explanation": "导入完成后，本文件可直接使用 sqrt。"
      },
      {
        "id": "m03_call",
        "answer": "sqrt",
        "hint": "已经导入指定成员，调用时写哪个名字？",
        "explanation": "此处直接调用 sqrt，不再加 math. 前缀。"
      },
      {
        "id": "m03_factor",
        "answer": "3",
        "hint": "把基础坐标放大多少倍，参考 3，可填 2～4。",
        "explanation": "这个倍率改变目标点位置，距离计算仍来自原始 dx、dy。",
        "numberRange": [
          2,
          4
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m03_from}} {{m03_module}} {{m03_import}} {{m03_member}}\n\ndistance = {{m03_call}}(dx * dx + dy * dy)\nprint(\"直接调用 sqrt，距离：\", distance)\naction = \"move\"\nx = dx * {{m03_factor}}\ny = dy * 3\nspeed = distance\n# @event command\n\naction = \"altitude\"\nheight = distance * 5\nspeed = 4\n# @event command\n\ntry:\n    print(math)\nexcept NameError:\n    print(\"当前文件只导入了 sqrt，没有绑定 math 这个名字。\")"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "small",
        "label": "3、4 位移",
        "description": "距离为 5 m，移动后前往 25 m 高度。",
        "prelude": "dx = 3\ndy = 4"
      },
      {
        "id": "large",
        "label": "5、12 位移",
        "description": "距离为 13 m，移动后前往 65 m 高度。",
        "prelude": "dx = 5\ndy = 12"
      }
    ],
    "defaultScenario": "small",
    "expectedActions": [
      "move",
      "altitude"
    ]
  },
  {
    "id": "04",
    "shortTitle": "自制旋转工具",
    "title": "把函数放进 flight_utils.py，再导入它让飞机自旋",
    "kicker": "3.4.1 · 自定义模块",
    "description": "左侧切换两个真实 Python 文件：工具模块负责计算圈数，main.py 负责导入、调用并下发自旋指令。",
    "objective": "把自定义模块的文件名、导入名、函数定义与调用位置对应起来。",
    "concept": "flight_utils.py 是一个自定义模块，导入时写 flight_utils，不写 .py。函数可以从独立文件复用；主程序拿到实际返回值后才生成动作。",
    "traceHint": "圈数=count/倍率。查看 flight_utils.py 的实际计算，再回 main.py 看调用；改模块里的数字，主程序不变也会飞出不同圈数。",
    "blanks": [
      {
        "id": "m04_import",
        "answer": "import",
        "hint": "主程序要加载另一个 .py 文件，使用哪个关键字？",
        "explanation": "自定义模块与标准库一样使用 import 导入。"
      },
      {
        "id": "m04_module",
        "answer": "flight_utils",
        "hint": "要导入的工具文件去掉 .py 后是什么名字？",
        "explanation": "文件名 flight_utils.py 对应模块名 flight_utils。"
      },
      {
        "id": "m04_call",
        "answer": "spin_turns",
        "hint": "通过模块名调用哪个计算圈数的函数？",
        "explanation": "flight_utils.spin_turns(...) 调用独立文件里的函数。"
      },
      {
        "id": "m04_function",
        "answer": "spin_turns",
        "hint": "模块中定义的函数名必须与调用处一致。",
        "explanation": "统一函数名才能让主程序找到工具。"
      },
      {
        "id": "m04_divisor",
        "answer": "2",
        "hint": "圈数=count/倍率；倍率参考 2，可探索 1～4。",
        "explanation": "改变模块函数内部计算，会改变主程序得到的返回值。",
        "numberRange": [
          1,
          4
        ]
      },
      {
        "id": "m04_return",
        "answer": "return",
        "hint": "把模块函数算出的 turns 交给调用方。",
        "explanation": "return 返回数据，动作由 main.py 后续语句生成。"
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m04_import}} {{m04_module}}\n\nturns = flight_utils.{{m04_call}}(alarm_count)\nprint(\"模块返回的自旋圈数：\", turns)\naction = \"spin\"\ndirection = spin_direction\nspeed = 90\n# @event command"
      },
      {
        "path": "flight_utils.py",
        "code": "# 自定义模块：可被多个主程序导入复用。\ndef {{m04_function}}(count):\n    turns = count / {{m04_divisor}}\n    # @event scope\n    {{m04_return}} turns"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "right",
        "label": "2 条告警 · 右旋",
        "description": "参考返回 1 圈，实际执行一次完整右旋。",
        "prelude": "alarm_count = 2\nspin_direction = \"right\""
      },
      {
        "id": "left",
        "label": "4 条告警 · 左旋",
        "description": "同一个模块处理更多条目，参考返回 2 圈，改为左旋。",
        "prelude": "alarm_count = 4\nspin_direction = \"left\""
      }
    ],
    "defaultScenario": "right",
    "expectedActions": [
      "spin"
    ]
  },
  {
    "id": "05",
    "shortTitle": "同名覆盖实验",
    "title": "from 模块 import *：为什么原来的 TURNS 被换掉了？",
    "kicker": "3.4.1 · 星号导入与名称冲突",
    "description": "先按主程序 TURNS=0.5 自旋，再执行星号导入。导入后同名变量被模块中的 TURNS 覆盖，第二次自旋使用新值。",
    "objective": "认识星号导入会把一批公开名称带入当前文件，并观察同名覆盖的真实结果。",
    "concept": "from flight_utils import * 会把该模块的公开名称导入主程序命名空间。名称方便直接使用，但同名覆盖会让来源变得难辨，因此不宜滥用。",
    "traceHint": "第一次固定半圈；第二次使用模块中的实际 TURNS。对照两条动作与打印结果，讨论为什么显式导入成员通常更清楚。",
    "blanks": [
      {
        "id": "m05_from",
        "answer": "from",
        "hint": "从自定义模块导入名称，开头用哪个关键字？",
        "explanation": "from 指明名称的来源。"
      },
      {
        "id": "m05_module",
        "answer": "flight_utils",
        "hint": "当前工程中包含 TURNS 的模块名。",
        "explanation": "模块内容在另一个文件页签中可查看。"
      },
      {
        "id": "m05_import",
        "answer": "import",
        "hint": "来源模块后面接哪个导入关键字？",
        "explanation": "import 后面列出要绑定到当前文件的名称。"
      },
      {
        "id": "m05_star",
        "answer": "*",
        "hint": "本关观察导入所有公开名称，使用哪个符号？",
        "explanation": "星号导入会把公开成员带入当前命名空间。"
      },
      {
        "id": "m05_turns",
        "answer": "2",
        "hint": "模块的 TURNS 参考为 2，可探索 0.5～3 圈。",
        "explanation": "导入后它会覆盖 main.py 中原来的同名变量。",
        "numberRange": [
          0.5,
          3
        ]
      },
      {
        "id": "m05_read",
        "answer": "TURNS",
        "hint": "第二次自旋应读取刚导入的哪个同名变量？",
        "explanation": "此时 TURNS 已经指向模块提供的新值。"
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "TURNS = 0.5\nprint(\"星号导入前 TURNS：\", TURNS)\naction = \"spin\"\nturns = TURNS\ndirection = \"right\"\nspeed = 90\n# @event command\n\n{{m05_from}} {{m05_module}} {{m05_import}} {{m05_star}}\nprint(\"星号导入后 TURNS：\", TURNS)\nturns = {{m05_read}}\ndirection = \"left\"\nspeed = TURN_RATE\n# @event command"
      },
      {
        "path": "flight_utils.py",
        "code": "# 这两个公开名称会被星号导入。\nTURNS = {{m05_turns}}\nTURN_RATE = 90"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "collision",
        "label": "半圈与导入后的圈数",
        "description": "第一条右旋使用原始 0.5；第二条左旋使用导入后覆盖的值。",
        "prelude": ""
      }
    ],
    "defaultScenario": "collision",
    "expectedActions": [
      "spin",
      "spin"
    ]
  },
  {
    "id": "06",
    "shortTitle": "包里的传感器",
    "title": "uav_toolkit.sensor_utils：把告警数量变成三角巡航",
    "kicker": "3.4.2 · 包路径、模块别名与工具复用",
    "description": "在 uav_toolkit 包内组织传感器工具。主程序通过 su 调用去重、计数和格式化函数，依据去重后的告警数量生成三个航点。",
    "objective": "对应包目录、__init__.py、模块文件与点号导入路径，并从同一模块复用多个函数。",
    "concept": "本项目使用包含 __init__.py 的常规包。uav_toolkit 是包名，sensor_utils 是模块名，su 是主程序中的别名；初始化包后才能沿包路径访问模块。",
    "traceHint": "先看原始告警与去重告警；count 是去重后的条目数。航点为 (-5×count,-10)、(5×count,-10)、(0,5×count)。",
    "blanks": [
      {
        "id": "m06_import",
        "answer": "import",
        "hint": "导入整个包内模块的关键字。",
        "explanation": "导入路径使用点号连接包名和模块名。"
      },
      {
        "id": "m06_module",
        "answer": "sensor_utils",
        "hint": "uav_toolkit 目录里提供传感器工具的模块名。",
        "explanation": "模块文件名是 sensor_utils.py。"
      },
      {
        "id": "m06_as",
        "answer": "as",
        "hint": "为包内模块设置短别名的关键字。",
        "explanation": "别名可以减少后续调用时的书写长度。"
      },
      {
        "id": "m06_alias",
        "answer": "su",
        "hint": "后面用 su 调用工具，别名应是什么？",
        "explanation": "su 引用的是实际导入的 sensor_utils 模块。"
      },
      {
        "id": "m06_unique",
        "answer": "unique_alarms",
        "hint": "调用哪个函数取得去重后的告警列表？",
        "explanation": "函数定义与调用名要对应。"
      },
      {
        "id": "m06_set",
        "answer": "set",
        "hint": "在工具模块中用哪个内置类型去重？",
        "explanation": "set 去重后再转回 list；这里仅用条目数量生成航线，不依赖集合顺序。"
      },
      {
        "id": "m06_len",
        "answer": "len",
        "hint": "计数工具要返回列表长度，使用哪个内置函数？",
        "explanation": "count_alarms 对传入列表返回实际条目数。"
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m06_import}} uav_toolkit.{{m06_module}} {{m06_as}} {{m06_alias}}\n\nprint(su.format_sensors(sensors))\nprint(\"原始告警：\", alarms)\nclean = su.{{m06_unique}}(alarms)\ncount = su.count_alarms(clean)\nprint(\"去重后：\", clean, \"条目数：\", count)\naction = \"route\"\npoints = ((-count * 5, -10), (count * 5, -10), (0, count * 5))\nspeed = 6\n# @event command"
      },
      {
        "path": "uav_toolkit/__init__.py",
        "code": "# 本项目采用常规包；导入包时先执行这个文件。\nPACKAGE_NAME = \"uav_toolkit\"\nprint(\"[包初始化]\", PACKAGE_NAME)"
      },
      {
        "path": "uav_toolkit/sensor_utils.py",
        "code": "# 传感器工具模块：这些函数可被多个主程序复用。\ndef unique_alarms(alarms):\n    return list({{m06_set}}(alarms))\n\ndef count_alarms(alarms):\n    return {{m06_len}}(alarms)\n\ndef format_sensors(sensors):\n    text = \"Sensors: \"\n    i = 0\n    while i < len(sensors):\n        text += sensors[i]\n        if i != len(sensors) - 1:\n            text += \", \"\n        i += 1\n    return text"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "two",
        "label": "两类告警 · 小三角",
        "description": "三个原始条目去重后剩两类，参考航点 (-10,-10)、(10,-10)、(0,10)。",
        "prelude": "sensors = [\"GPS\", \"IMU\", \"Barometer\"]\nalarms = [\"GPS_WEAK\", \"GPS_WEAK\", \"IMU_WARN\"]"
      },
      {
        "id": "three",
        "label": "三类告警 · 大三角",
        "description": "告警条目去重后有三类，相同模块会生成更大的三角巡航。",
        "prelude": "sensors = [\"GPS\", \"IMU\", \"Camera\"]\nalarms = [\"GPS_WEAK\", \"IMU_WARN\", \"CAM_WARN\", \"GPS_WEAK\"]"
      }
    ],
    "defaultScenario": "two",
    "expectedActions": [
      "route"
    ]
  },
  {
    "id": "07",
    "shortTitle": "带条件的8字",
    "title": "从包内模块导入电量规则，决定是否执行 8 字任务",
    "kicker": "3.4.2 · 从包内模块导入指定函数",
    "description": "复用教材中的 can_takeoff() 与 rth_suggest()。主程序按实际布尔结果决定执行 8 字任务或保持当前安全悬停。",
    "objective": "写对 包名.模块名 与指定成员，正确使用导入函数的返回值。",
    "concept": "from uav_toolkit.flight_utils import can_takeoff, rth_suggest 只把列出的函数名绑定到主程序。函数本身计算规则，后面的 if allowed 才决定动作。",
    "traceHint": "仿真从 10 m 悬停开始。这里将教材起飞规则作为本次任务许可：30% 及以上执行 8 字，低于门槛时保持安全悬停，打印实际返航建议。",
    "blanks": [
      {
        "id": "m07_from",
        "answer": "from",
        "hint": "从包内模块取出指定函数，开头使用哪个关键字？",
        "explanation": "from 后面写完整模块路径。"
      },
      {
        "id": "m07_package",
        "answer": "uav_toolkit",
        "hint": "flight_utils.py 所在的包目录名。",
        "explanation": "uav_toolkit.flight_utils 对应包内实际文件位置。"
      },
      {
        "id": "m07_import",
        "answer": "import",
        "hint": "模块路径之后写哪个关键字？",
        "explanation": "import 后列出要直接使用的成员名。"
      },
      {
        "id": "m07_member",
        "answer": "can_takeoff",
        "hint": "要导入的电量判定函数名。",
        "explanation": "该函数返回 True 或 False。"
      },
      {
        "id": "m07_call",
        "answer": "can_takeoff",
        "hint": "调用刚刚导入的哪个函数取得许可？",
        "explanation": "导入指定成员后可以直接用函数名调用。"
      },
      {
        "id": "m07_loops",
        "answer": "1",
        "hint": "整圈填 1，半圈填 0.5，可探索 0.5～2 圈。",
        "explanation": "仅在许可通过时，这个数值才作为 8 字圈数。",
        "numberRange": [
          0.5,
          2
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m07_from}} {{m07_package}}.flight_utils {{m07_import}} {{m07_member}}, rth_suggest\n\nallowed = {{m07_call}}(battery_percent)\nsuggestion = rth_suggest(battery_percent)\nprint(\"电量：\", battery_percent, \"许可：\", allowed, \"建议：\", suggestion)\nif allowed:\n    action = \"figure8\"\n    loops = {{m07_loops}}\n    scale = 16\n    speed = 6\n    # @event command\nelse:\n    action = \"hold\"\n    duration = 2\n    message = \"任务许可未通过，保持安全悬停。\" + suggestion\n    # @event command"
      },
      {
        "path": "uav_toolkit/__init__.py",
        "code": "# 本项目采用常规包；导入包时先执行这个文件。\nPACKAGE_NAME = \"uav_toolkit\"\nprint(\"[包初始化]\", PACKAGE_NAME)"
      },
      {
        "path": "uav_toolkit/flight_utils.py",
        "code": "# 飞行工具模块：教材中的电量判定与返航建议。\ndef can_takeoff(battery_percent):\n    if battery_percent >= 30:\n        return True\n    return False\n\ndef rth_suggest(battery_percent):\n    if battery_percent < 20:\n        return \"建议立即返航\"\n    if battery_percent < 40:\n        return \"建议准备返航\"\n    return \"电量充足\""
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "ready",
        "label": "72% 电量 · 许可通过",
        "description": "函数返回 True，主流程执行填写圈数的 8 字。",
        "prelude": "battery_percent = 72"
      },
      {
        "id": "boundary",
        "label": "30% 边界 · 许可通过",
        "description": "等于门槛也返回 True，用边界值检验规则。",
        "prelude": "battery_percent = 30"
      },
      {
        "id": "low",
        "label": "18% 低电量 · 暂停任务",
        "description": "实际返回 False，保留安全悬停并输出“建议立即返航”。",
        "prelude": "battery_percent = 18",
        "expectedActions": [
          "hold"
        ]
      }
    ],
    "defaultScenario": "ready",
    "expectedActions": [
      "figure8"
    ]
  },
  {
    "id": "08",
    "shortTitle": "只装载一次",
    "title": "重复 import 两次，模块顶层为什么只输出一次？",
    "kicker": "3.4.1 · 模块执行与导入缓存",
    "description": "同一轮运行中，用两个名字导入同一个工具模块。模块顶层输出只出现一次，模块中的函数却可以按不同实参调用多次。",
    "objective": "区分导入模块时执行顶层代码、复用已加载模块，以及调用模块函数三种行为。",
    "concept": "第一次 import 会加载并执行模块顶层代码；同一轮再次导入会复用缓存。两个别名引用同一个模块，但 next_height() 每次调用都会重新计算。重新运行本实验会开始新的一轮。",
    "traceHint": "观察控制台中的 [MODULE LOAD] 只出现一次，以及 flight_utils is fu 的 True。参考两次高度为 40、15，函数可以复用而不必重新加载模块。",
    "blanks": [
      {
        "id": "m08_module",
        "answer": "flight_utils",
        "hint": "第一次导入实际存在的工具模块。",
        "explanation": "文件 flight_utils.py 会在第一次导入时执行顶层代码。"
      },
      {
        "id": "m08_import_again",
        "answer": "import",
        "hint": "第二次继续导入同一模块的关键字。",
        "explanation": "同一轮第二次 import 会复用模块缓存。"
      },
      {
        "id": "m08_alias",
        "answer": "fu",
        "hint": "第二次给同一模块起短别名。",
        "explanation": "fu 与 flight_utils 将引用同一个模块对象。"
      },
      {
        "id": "m08_call",
        "answer": "next_height",
        "hint": "通过 fu 调用哪个模块函数？",
        "explanation": "调用函数会执行函数体，不等于重新执行模块顶层。"
      },
      {
        "id": "m08_base",
        "answer": "20",
        "hint": "模块基准高度参考为 20，可探索 10～40。",
        "explanation": "两次函数调用共用该模块值，分别加 20 和减 5。",
        "numberRange": [
          10,
          40
        ]
      },
      {
        "id": "m08_return",
        "answer": "return",
        "hint": "模块函数用哪个关键字交回 result？",
        "explanation": "每次返回实际 BASE_HEIGHT + offset 的结果。"
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "import {{m08_module}}\n{{m08_import_again}} flight_utils as {{m08_alias}}\n\nprint(\"两个名字引用同一个模块：\", flight_utils is fu)\nprint(\"注意：下面的两次调用都会执行函数体。\")\naction = \"altitude\"\nspeed = 4\nheight = flight_utils.next_height(20)\n# @event command\n\nheight = fu.{{m08_call}}(-5)\n# @event command"
      },
      {
        "path": "flight_utils.py",
        "code": "print(\"[MODULE LOAD] flight_utils 顶层执行一次\")\nBASE_HEIGHT = {{m08_base}}\n\ndef next_height(offset):\n    result = BASE_HEIGHT + offset\n    # @event scope\n    {{m08_return}} result"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "cache",
        "label": "一次装载，两次使用",
        "description": "参考第一次到 40 m，第二次到 15 m；加载次数与函数调用次数不同。",
        "prelude": ""
      }
    ],
    "defaultScenario": "cache",
    "expectedActions": [
      "altitude",
      "altitude"
    ]
  },
  {
    "id": "09",
    "shortTitle": "安装真实扩展",
    "title": "安装 geopy、验证版本，再让地理距离参与飞行",
    "kicker": "3.4.3 · 第三方库安装与验证",
    "description": "先补全安装命令，在浏览器练习环境安装真实 geopy；随后导入版本，计算两个定位点间的地理距离。",
    "objective": "区分标准库与第三方库，完成安装、导入、版本验证和一次真实库函数调用。",
    "concept": "geopy 是第三方库，安装后才能 import。练习环境用 micropip 安装随页面提供的真实 wheel；在电脑终端可使用同样的 python -m pip install geopy 命令。geodesic 返回计算距离，其 meters 属性提供米数。",
    "traceHint": "先核对实际打印的 geopy 版本和距离。这里将地理距离映射为 X 轴前进米数，距离再除以倍率成为目标高度。",
    "blanks": [
      {
        "id": "m09_flag",
        "answer": "-m",
        "hint": "让当前 Python 执行 pip 模块的参数。",
        "explanation": "python -m pip 让安装命令与当前解释器对应。"
      },
      {
        "id": "m09_install",
        "answer": "install",
        "hint": "pip 安装包的子命令。",
        "explanation": "install 请求把指定分发包安装到当前练习环境。"
      },
      {
        "id": "m09_package",
        "answer": "geopy",
        "hint": "本关要安装的第三方包名。",
        "explanation": "geopy 提供地理距离等工具，本页使用真实包及依赖。"
      },
      {
        "id": "m09_import",
        "answer": "import",
        "hint": "安装后，Python 代码使用哪个关键字加载包？",
        "explanation": "安装与导入是两个步骤，安装完成后才可在代码中导入。"
      },
      {
        "id": "m09_module",
        "answer": "geopy",
        "hint": "要验证版本的包名。",
        "explanation": "import geopy 将该包绑定到主程序。"
      },
      {
        "id": "m09_version",
        "answer": "__version__",
        "hint": "教材中用于读取 geopy 版本的属性名。",
        "explanation": "版本来自实际安装的 geopy 包，不是网页预设的文字。"
      },
      {
        "id": "m09_member",
        "answer": "geodesic",
        "hint": "从 geopy.distance 中导入椭球距离计算工具。",
        "explanation": "geodesic(start_gps,target_gps).meters 返回实际米数。"
      },
      {
        "id": "m09_divisor",
        "answer": "2",
        "hint": "高度=地理距离/倍率；参考 2，可探索 1～3。",
        "explanation": "改变倍率会改变目标高度，地理距离计算保持使用同一组定位点。",
        "numberRange": [
          1,
          3
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m09_import}} {{m09_module}}\nfrom geopy.distance import {{m09_member}}\n\nprint(\"geopy version =\", geopy.{{m09_version}})\ndistance_m = geodesic(start_gps, target_gps).meters\nprint(\"两点实际地理距离：\", round(distance_m, 2), \"m\")\naction = \"move\"\nx = round(distance_m, 2)\ny = 0\nspeed = 6\n# @event command\n\naction = \"altitude\"\nheight = round(distance_m / {{m09_divisor}}, 2)\nspeed = 4\n# @event command"
      },
      {
        "path": "requirements.txt",
        "code": "geopy==2.4.1"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "near",
        "label": "相邻定位点",
        "description": "起点固定，使用相邻目标点计算距离；实际数值由 geopy 返回。",
        "prelude": "start_gps = (30.0, 114.0)\ntarget_gps = (30.00018, 114.0001)"
      },
      {
        "id": "far",
        "label": "更远定位点",
        "description": "纬度、经度偏移都增大，比较地理距离与飞机的两段动作。",
        "prelude": "start_gps = (30.0, 114.0)\ntarget_gps = (30.00036, 114.0002)"
      }
    ],
    "defaultScenario": "near",
    "expectedActions": [
      "move",
      "altitude"
    ],
    "installCommand": "python {{m09_flag}} pip {{m09_install}} {{m09_package}}",
    "installationNote": "安装目标为本页独立的浏览器练习环境，调用 micropip 安装随页面提供的真实 geopy 和 geographiclib wheel。电脑终端可使用同样形式的 pip 命令。"
  },
  {
    "id": "10",
    "shortTitle": "工具箱飞行秀",
    "title": "组合标准库、第三方库与自己的包，编排一场巡航",
    "kicker": "3.4 综合任务 · 模块、包与库",
    "description": "用包内传感器工具整理报告、用飞行工具判定许可，再让 geopy 距离与 math.sqrt() 一起计算巡航尺度。依次飞航点、自旋、画 8 字并返航。",
    "objective": "在一个真实多文件工程中组合多种导入方式，解释每个计算工具来自哪个模块或包。",
    "concept": "main.py 组合工具，sensor_utils.py 负责传感器数据，flight_utils.py 负责飞行规则与航点；标准库 math 与第三方库 geopy 各有来源。实际返回值决定是否执行以及怎样执行整段任务。",
    "traceHint": "半径=sqrt(地理距离)×倍率，自旋圈数=去重告警数/2。切换定位点、告警与电量，再改变 8 字圈数。低电量分支保持安全悬停，不执行巡航与返航动作。",
    "blanks": [
      {
        "id": "m10_import",
        "answer": "import",
        "hint": "导入整个 math 模块的关键字。",
        "explanation": "math.sqrt() 在主流程中计算巡航半径。"
      },
      {
        "id": "m10_package",
        "answer": "uav_toolkit",
        "hint": "传感器模块所在的包名。",
        "explanation": "点号路径与左侧文件树中的包目录对应。"
      },
      {
        "id": "m10_member",
        "answer": "can_takeoff",
        "hint": "从飞行模块导入用于判定许可的函数名。",
        "explanation": "实际布尔返回值决定整个任务分支。"
      },
      {
        "id": "m10_unique",
        "answer": "unique_alarms",
        "hint": "通过 su 调用哪个工具去重告警？",
        "explanation": "去重后条目数量决定自旋圈数。"
      },
      {
        "id": "m10_len",
        "answer": "len",
        "hint": "计数函数用哪个内置工具取得列表长度？",
        "explanation": "主程序调用 count_alarms()，真实计算发生在包内模块。"
      },
      {
        "id": "m10_radius",
        "answer": "2",
        "hint": "巡航半径倍率参考 2，可探索 1～3。",
        "explanation": "实际 geopy 距离开平方后乘以倍率，得到航点与 8 字共用的尺度。",
        "numberRange": [
          1,
          3
        ]
      },
      {
        "id": "m10_loops",
        "answer": "1",
        "hint": "8 字整圈为 1，半圈为 0.5，可探索 0.5～2。",
        "explanation": "许可通过时，飞机按填写圈数沿计算出的尺度飞行。",
        "numberRange": [
          0.5,
          2
        ]
      },
      {
        "id": "m10_rth_height",
        "answer": "30",
        "hint": "返航高度参考 30 m，可探索 10～60。",
        "explanation": "最后先调整到返航高度，再回到原点并降落。",
        "numberRange": [
          10,
          60
        ]
      }
    ],
    "files": [
      {
        "path": "main.py",
        "code": "{{m10_import}} math\nimport {{m10_package}}.sensor_utils as su\nfrom uav_toolkit.flight_utils import {{m10_member}}, rth_suggest, make_points\nfrom geopy.distance import geodesic\n\nprint(\"=== 无人机传感器工具箱报告 ===\")\nprint(su.format_sensors(sensors))\nclean = su.{{m10_unique}}(alarms)\ncount = su.count_alarms(clean)\ndistance_m = geodesic(start_gps, target_gps).meters\nradius = round(math.sqrt(distance_m) * {{m10_radius}}, 2)\nprint(\"原始告警：\", alarms, \"去重后：\", clean)\nprint(\"实际地理距离：\", round(distance_m, 2), \"巡航尺度：\", radius)\nallowed = can_takeoff(battery_percent)\nprint(\"任务许可：\", allowed, \"返航建议：\", rth_suggest(battery_percent))\n\nif allowed:\n    action = \"route\"\n    points = make_points(radius)\n    speed = 6\n    # @event command\n\n    action = \"spin\"\n    turns = count / 2\n    direction = \"left\"\n    speed = 90\n    # @event command\n\n    action = \"figure8\"\n    scale = radius\n    loops = {{m10_loops}}\n    speed = 6\n    # @event command\n\n    action = \"return\"\n    height = {{m10_rth_height}}\n    speed = 6\n    # @event command\nelse:\n    action = \"hold\"\n    duration = 2\n    message = \"任务许可未通过，保持安全悬停。\" + rth_suggest(battery_percent)\n    # @event command\nprint(\"=== 报告结束 ===\")"
      },
      {
        "path": "uav_toolkit/__init__.py",
        "code": "# 本项目采用常规包；导入包时先执行这个文件。\nPACKAGE_NAME = \"uav_toolkit\"\nprint(\"[包初始化]\", PACKAGE_NAME)"
      },
      {
        "path": "uav_toolkit/sensor_utils.py",
        "code": "# 传感器工具模块：这些函数可被多个主程序复用。\ndef unique_alarms(alarms):\n    return list(set(alarms))\n\ndef count_alarms(alarms):\n    return {{m10_len}}(alarms)\n\ndef format_sensors(sensors):\n    text = \"Sensors: \"\n    i = 0\n    while i < len(sensors):\n        text += sensors[i]\n        if i != len(sensors) - 1:\n            text += \", \"\n        i += 1\n    return text"
      },
      {
        "path": "uav_toolkit/flight_utils.py",
        "code": "# 飞行工具模块：教材中的电量判定与返航建议。\ndef can_takeoff(battery_percent):\n    if battery_percent >= 30:\n        return True\n    return False\n\ndef rth_suggest(battery_percent):\n    if battery_percent < 20:\n        return \"建议立即返航\"\n    if battery_percent < 40:\n        return \"建议准备返航\"\n    return \"电量充足\"\n\n\ndef make_points(radius):\n    points = ((-radius, -radius / 2), (radius, -radius / 2), (0, radius))\n    # @event scope\n    return points"
      },
      {
        "path": "requirements.txt",
        "code": "geopy==2.4.1"
      }
    ],
    "entry": "main.py",
    "scenarios": [
      {
        "id": "standard",
        "label": "标准巡航 · 72% 电量",
        "description": "两类告警控制一圈自旋；实际地理距离与倍率控制三角巡航和 8 字尺度。",
        "prelude": "battery_percent = 72\nsensors = [\"GPS\", \"IMU\", \"Barometer\"]\nalarms = [\"GPS_WEAK\", \"GPS_WEAK\", \"IMU_WARN\"]\nstart_gps = (30.0, 114.0)\ntarget_gps = (30.00018, 114.0001)"
      },
      {
        "id": "expanded",
        "label": "三类告警 · 更远点",
        "description": "去重数量增加，自旋圈数随之变化；目标点更远，计算出的巡航尺度也变大。",
        "prelude": "battery_percent = 86\nsensors = [\"GPS\", \"IMU\", \"Camera\"]\nalarms = [\"GPS_WEAK\", \"IMU_WARN\", \"CAM_WARN\", \"GPS_WEAK\"]\nstart_gps = (30.0, 114.0)\ntarget_gps = (30.00036, 114.0002)"
      },
      {
        "id": "low",
        "label": "18% 低电量 · 拒绝本次任务",
        "description": "主程序仍可生成工具箱报告；实际许可为 False，仅执行安全悬停。",
        "prelude": "battery_percent = 18\nsensors = [\"GPS\", \"IMU\"]\nalarms = [\"GPS_WEAK\", \"GPS_WEAK\", \"IMU_WARN\"]\nstart_gps = (30.0, 114.0)\ntarget_gps = (30.00018, 114.0001)",
        "expectedActions": [
          "hold"
        ]
      }
    ],
    "defaultScenario": "standard",
    "expectedActions": [
      "route",
      "spin",
      "figure8",
      "return"
    ],
    "installCommand": "python -m pip install geopy",
    "installationNote": "本关在浏览器独立练习环境安装真实 geopy 及依赖；下载工程后可在项目根目录执行 python -m pip install -r requirements.txt。"
  }
];
