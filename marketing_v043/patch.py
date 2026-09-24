from pathlib import Path
p = Path('/app/app/main.py')
s = p.read_text()
old = 'return templates.TemplateResponse(request,"landing.html",base_context(request,db))'
new = 'return templates.TemplateResponse(request,"landing.html",base_context(request,db,plans=list_plans(db)))'
if old not in s:
    raise SystemExit('landing route pattern not found')
p.write_text(s.replace(old, new, 1))
