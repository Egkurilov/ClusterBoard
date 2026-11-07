"""Build one self-contained portal. The baseline is immutable; no runtime libraries."""
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'src/portal-v0.9.html').read_bytes()
expected='0c7afeb12136b0c22c8b635fcaf8b50498da4abf'
actual=hashlib.sha1(b'blob '+str(len(source)).encode()+b'\0'+source).hexdigest()
if actual!=expected: raise SystemExit('Baseline changed; refusing an unreviewed build')
s=source.decode('utf-8').replace('0.9','0.10.1').replace('v09','v0101')
def replace(old,new,count=1):
 global s
 if s.count(old)!=count: raise SystemExit('Unexpected anchor count: '+old[:100])
 s=s.replace(old,new)
replace('<title>ClusterBoard 0.10.1 — инициативы</title>','<title>ClusterBoard 0.10.1 — инициативы и Гант</title>\n<meta name="clusterboard-version" content="0.10.1">')
replace("board:'Доска по статусам',archive", "board:'Доска по статусам',gantt:'Диаграмма Ганта',archive")
replace("key==='board'?'grid':", "key==='gantt'?'gantt':key==='board'?'grid':")
replace("['board','grid','Доска']", "['board','grid','Доска'],['gantt','gantt','Гант']")
replace("c9.page==='archive'?'Архив инициатив':'Портфель инициатив'", "c9.page==='archive'?'Архив инициатив':c9.page==='gantt'?'Диаграмма Ганта':'Портфель инициатив'")
replace('<button data-c9="present">${ico(\'expand\',21)}', '<button data-c9="page" data-page="gantt" class="${c9.page===\'gantt\'?\'active\':\'\'}">${ico(\'gantt\',21)}<span>Гант</span></button><button data-c9="present">${ico(\'expand\',21)}')
replace("function c9ValidateRecord(x,strict){", "function c9ValidateRecord(x,strict){\n if(x&&x.startDate===undefined)x.startDate='';\n if(x&&(typeof x.startDate!=='string'||!c9ValidDate(x.startDate)))throw Error('Неверная дата начала.');\n if(x&&x.startDate&&x.deadline&&x.startDate>x.deadline)throw Error('Дата начала не может быть позже срока реализации.');")
replace("description:'',deadline:''", "description:'',startDate:'',deadline:''")
anchor="${c9Field('deadline','Срок реализации','date')}"
replace(anchor,"${c9Field('startDate','Дата начала · для Ганта','date',{hint:'Не заполняется датой создания автоматически.'})}"+anchor,1)
replace("${quick?c9Field('deadline','Срок реализации','date')", "${quick?c9Field('startDate','Дата начала · для Ганта','date')+c9Field('deadline','Срок реализации','date')")
replace("old&&old.deadline!==x.deadline&&!ctx.comment.trim()", "old&&(old.deadline!==x.deadline||(!!old.startDate&&old.startDate!==x.startDate))&&!ctx.comment.trim()")
replace("description:'Описание',deadline:'Срок'", "description:'Описание',startDate:'Дата начала',deadline:'Срок'")
replace("if(k==='deadline')return 'Срок: '", "if(k==='startDate')return 'Дата начала: '+(old.startDate||'не задана')+' → '+(x.startDate||'не задана');if(k==='deadline')return 'Срок: '")
replace("'Описание','Срок','Первоначальный срок'", "'Описание','Дата начала','Срок','Первоначальный срок'")
replace('x.statusText,x.description,x.deadline,x.baselineDeadline', 'x.statusText,x.description,x.startDate,x.deadline,x.baselineDeadline')
css=(ROOT/'src/gantt/styles.css').read_text(encoding='utf-8')
js='\n'.join((ROOT/'src/gantt'/name).read_text(encoding='utf-8') for name in ['chart.js','integration.js'])
replace('</head>', '<style id="gantt-styles">\n'+css+'\n</style>\n</head>')
replace("ui.view = 'structure';\nui.version = 'current';",js+"\nui.view = 'structure';\nui.version = 'current';")
output=ROOT/'public/index.html';output.parent.mkdir(exist_ok=True)
output.write_text(s,encoding='utf-8')
meta={'version':'0.10.1','html_sha256':hashlib.sha256(s.encode()).hexdigest(),'features':['initiatives-gantt','gantt-presentation','initiative-start-date'],'entry':'/#/initiatives/gantt'}
(ROOT/'public/version.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Built',meta['version'],meta['html_sha256'])
