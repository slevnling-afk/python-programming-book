"""Real browser CPython checks. Start `python -m http.server 8778 --directory docs` first.
Requires Python playwright and an installed Microsoft Edge browser.
"""
from pathlib import Path
import json,os,subprocess,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
URL=os.environ.get('MODULE_FLIGHT_TEST_URL','http://127.0.0.1:8778/_static/labs/module-flight/index.html')
JS="const fs=require('fs');(async()=>{const m=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('docs/_static/labs/module-flight/lessons.js','utf8')).toString('base64'));process.stdout.write(JSON.stringify(m.lessons))})()"
lessons=json.loads(subprocess.check_output(['node','--preserve-symlinks','--preserve-symlinks-main','-e',JS],cwd=ROOT).decode('utf-8'))
def assert_eq(actual,expected):
 assert actual==expected,(actual,expected)
def assert_true(value):
 assert value
count=0
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 page=browser.new_page();network=[];page.on('request',lambda request:network.append(request.url))
 page.on('console',lambda message:print('BROWSER ERROR',message.text,flush=True) if message.type=='error' else None)
 page.goto(URL);page.wait_for_load_state('networkidle')
 def run(code,files=None,install=None):
  return page.evaluate('''async job=>{const m=await import('./runtime.js');return await m.runPython(job.code,{files:job.files||{},entry:'main.py',installCommand:job.install||null})}''',{'code':code,'files':files or {},'install':install})
 def check(name,code,verify,files=None,install=None):
  global count
  r=run(code,files,install);verify(r);count+=1;print('PASS',name,flush=True)
 def ok(r):assert r['ok'],r
 def command(r):return [e for e in r['events'] if e['type']=='command']
 def failure(r,kind):assert not r['ok'] and r['errorType']==kind,r
 check('real math module object, actual cache and no bootstrap module leakage','import math\nimport math\nheight=math.sqrt(25)*4\naction="altitude"\n# @event command',lambda r:(ok(r),assert_eq(command(r)[0]['scope']['height'],20),assert_eq(command(r)[0]['scope']['math'],{'__kind__':'module','name':'math'}),assert_eq([e['cached'] for e in r['imports']],[False,True]),assert_eq([m['name'] for m in r['modules']],['math'])))
 check('real random alias and seeded standard library output','import random as rd\nrd.seed(7)\nx=rd.randint(3,9)\n# @event scope',lambda r:(ok(r),assert_true(3<=r['events'][-1]['scope']['x']<=9),assert_eq(r['events'][-1]['scope']['rd']['name'],'random')))
 check('from import exposes member but not module name','from math import sqrt\nheight=sqrt(25)\ntry:\n    print(math)\nexcept NameError:\n    print("NAME_NOT_BOUND")\naction="altitude"\n# @event command',lambda r:(ok(r),assert_eq(command(r)[0]['scope']['height'],5),assert_true('NAME_NOT_BOUND' in r['output']),assert_true('math' not in command(r)[0]['scope'])))
 check('nonexistent module fails with actual ModuleNotFoundError','import missing_uav_tools\naction="spin"\n# @event command',lambda r:(failure(r,'ModuleNotFoundError'),assert_eq(command(r),[])))
 check('missing imported member fails with actual ImportError','from math import missing_sensor',lambda r:failure(r,'ImportError'))
 check('module attribute typo fails with actual AttributeError','import math\nmath.not_a_member(3)',lambda r:failure(r,'AttributeError'))
 check('package init and module top level execute once','import uav_toolkit.tools as a\nimport uav_toolkit.tools as b\nheight=a.height(4)\naction="altitude"\n# @event command\nprint(a is b)',lambda r:(ok(r),assert_eq(r['output'].count('INIT_ONCE'),1),assert_eq(r['output'].count('LOAD_ONCE'),1),assert_true('True' in r['output']),assert_eq(command(r)[0]['scope']['height'],12),assert_eq([e['cached'] for e in r['imports']],[False,True])),{'uav_toolkit/__init__.py':'print("INIT_ONCE")','uav_toolkit/tools.py':'print("LOAD_ONCE")\ndef height(n):\n    return n*3'})
 check('star import really overwrites colliding public name','TURNS=1\nfrom turn_rules import *\nturns=TURNS\naction="spin"\n# @event command',lambda r:(ok(r),assert_eq(command(r)[0]['scope']['turns'],3)),{'turn_rules.py':'TURNS=3\n_private=90'})
 check('syntax error reports imported file and original line','import broken',lambda r:(failure(r,'SyntaxError'),assert_eq(r['file'],'broken.py'),assert_eq(r['line'],2)),{'broken.py':'# @event scope\ndef bad()\n    pass'})
 check('unassigned local raises actual UnboundLocalError','height=10\ndef f():\n    height+=1\nf()',lambda r:failure(r,'UnboundLocalError'))
 check('nonterminating loop is interrupted by actual Python trace budget','while True:\n    pass',lambda r:failure(r,'FlightTimeLimitError'))
 check('geopy absent without installation request','import geopy',lambda r:failure(r,'ModuleNotFoundError'))
 check('actual micropip install, import version and geodesic calculation','import geopy\nfrom geopy.distance import geodesic\nheight=geodesic((30,114),(30.0001,114)).meters\nprint(geopy.__version__)\naction="altitude"\n# @event command',lambda r:(ok(r),assert_true('2.4.1' in r['output']),assert_true(11<command(r)[0]['scope']['height']<11.2),assert_true(any(e['type']=='install' and e['stage']=='complete' for e in r['events']))),install='python -m pip install geopy')
 check('invalid installation command is rejected before imports','import geopy',lambda r:(failure(r,'CommandError'),assert_eq(r['imports'],[])),install='python pip install geopy')
 check('unsupported wheel version is not fabricated','import geopy',lambda r:failure(r,'CommandError'),install='python -m pip install geopy==99.0')
 check('pinned geopy requirement is parsed and really installed','import geopy\nprint(geopy.__version__)',lambda r:(ok(r),assert_true('2.4.1' in r['output'])),install='pip install geopy==2.4.1')
 for value in [10,31]:
  check('fresh module cache reads new source '+str(value),'import height_rule\nheight=height_rule.VALUE\naction="altitude"\n# @event command',lambda r,v=value:(ok(r),assert_eq(command(r)[0]['scope']['height'],v)),{'height_rule.py':'VALUE='+str(value)})
 # A superseded boot cannot keep a competing interpreter alive or report success.
 r=page.evaluate('''async()=>{const m=await import('./runtime.js');const first=m.runPython('while True:\\n    pass');const second=m.runPython('print("LATEST")');return await Promise.all([first,second]);}''')
 assert r[0].get('cancelled') and r[1]['ok'] and 'LATEST' in r[1]['output'];count+=1;print('PASS superseded run cancels its worker',flush=True)
 def assemble(lesson,scenario,overrides=None):
  answers={b['id']:b['answer'] for b in lesson['blanks']};answers.update(overrides or {})
  def fill(text):
   for key,value in answers.items():text=text.replace('{{'+key+'}}',value)
   return text
  files={f['path']:fill(f['code']) for f in lesson['files']};entry=lesson.get('entry','main.py')
  files[entry]=(scenario.get('prelude') or '')+'\n\n'+files[entry]
  return files[entry],files,fill(lesson.get('installCommand') or '') or None
 for lesson in lessons:
  for scenario in lesson['scenarios']:
   code,files,install=assemble(lesson,scenario);r=run(code,files,install);ok(r)
   expected=scenario.get('expectedActions',lesson.get('expectedActions'))
   if expected:assert [e['scope']['action'] for e in command(r)]==expected,(lesson['id'],scenario['id'],r)
   if lesson['id']=='08':assert r['output'].count('[模块加载]')<=1,r['output'];assert_true(any(e['cached'] for e in r['imports']))
   if lesson['id'] in ['09','10']:assert any(m['name']=='geopy' and m['version']=='2.4.1' for m in r['modules']),r
   count+=1;print('PASS lesson '+lesson['id']+'/'+scenario['id'],flush=True)
  for blank in lesson['blanks']:
   if not blank.get('numberRange'):continue
   for value in blank['numberRange']:
    code,files,install=assemble(lesson,lesson['scenarios'][0],{blank['id']:str(value)});r=run(code,files,install);ok(r);assert command(r),r
    count+=1;print('PASS numeric '+lesson['id']+'/'+blank['id']+'='+str(value),flush=True)
 origin=URL.split('/_static/')[0]
 assert all(url.startswith(origin) or url.startswith('data:') for url in network),[url for url in network if not url.startswith(origin)]
 print(str(count)+' real CPython, module, installation and numeric checks passed; all runtime requests stayed on the local origin',flush=True)
 browser.close()
