// Knowledge items remain in memory only. No external retrieval, upload or storage.
export const KNOWLEDGE_CATEGORIES=Object.freeze(['law','guide','policy','general']);
export function createKnowledge(title,body,category='general',keywords='') {
  if(typeof title!=='string'||!title.trim()||title.trim().length>160)return {ok:false,error:'Invalid title'};
  if(typeof body!=='string'||!body.trim()||body.length>20000)return {ok:false,error:'Invalid content'};
  if(!KNOWLEDGE_CATEGORIES.includes(category))return {ok:false,error:'Invalid category'};
  if(typeof keywords!=='string'||keywords.length>300)return {ok:false,error:'Invalid keywords'};
  return {ok:true,item:{title:title.trim(),body:body.trim(),category,keywords:keywords.trim()}};
}
export function searchKnowledge(items,query='',category='all') {
  if(!Array.isArray(items)||typeof query!=='string'||!['all',...KNOWLEDGE_CATEGORIES].includes(category))return [];
  const needle=query.trim().toLocaleLowerCase();
  return items.filter(x=>x&&typeof x.title==='string'&&typeof x.body==='string'&&typeof x.keywords==='string'&&(category==='all'||x.category===category)&&(!needle||[x.title,x.body,x.keywords].some(v=>v.toLocaleLowerCase().includes(needle))));
}
export function knowledgeSummary(items) {
  if(!Array.isArray(items))return null;
  return {total:items.length,...Object.fromEntries(KNOWLEDGE_CATEGORIES.map(c=>[c,items.filter(x=>x.category===c).length]))};
}
