import collections
rows=[l.rstrip('\r\n').split('\t') for l in open('schema.tsv',encoding='utf-8') if l.strip()]
tabs=collections.OrderedDict(); rels=[]
for t,c,ty,nul,key,ref in rows:
    tabs.setdefault(t,[])
    ty=ty.replace(' ','_').upper()
    k='PK' if key=='PRI' else ('FK' if ref else ('UK' if key=='UNI' else ''))
    note='' if nul=='NO' or k=='PK' else ' "NULL"'
    tabs[t].append(f'    {ty} {c} {k}{note}'.rstrip())
    if ref: rels.append((ref,t,c,nul))
out=['erDiagram']
for ref,t,c,nul in rels:
    one = '|o' if nul=='YES' else '||'
    # OneToOne fields are UNI+FK -> show as |o--o|
    uni=any(r[0]==t and r[1]==c and r[4]=='UNI' for r in rows)
    right='o|' if uni else 'o{'
    out.append(f'  {ref} {one}--{right} {t} : "{c}"')
for t,cols in tabs.items():
    out.append(f'  {t} {{'); out+=cols; out.append('  }')
open('src/04-modelo-logico.mmd','w',encoding='utf-8').write('\n'.join(out)+'\n')
