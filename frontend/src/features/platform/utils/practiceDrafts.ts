import {codeLanguages, codeTemplates, type CodeLanguage} from './practice';
export interface CodeDraft {code: string; stdin: string}
export type CodeDrafts = Partial<Record<CodeLanguage, CodeDraft>>;
export const codeFilenames: Record<CodeLanguage,string> = {javascript:'main.js',python:'main.py',java:'Main.java',c:'main.c','c++':'main.cpp'};

export function changedDraftLanguages(drafts: CodeDrafts) {
  return (Object.keys(codeLanguages) as CodeLanguage[]).filter(language => {
    const draft = drafts[language];
    return draft && (draft.code !== codeTemplates[language] || draft.stdin !== '');
  });
}
export function draftContextChanges(current: {pathname:string;search:string}, next: {pathname:string;search:string}) {
  return next.pathname !== current.pathname || new URLSearchParams(current.search).get('problem') !== new URLSearchParams(next.search).get('problem');
}
export function draftBundle(drafts: CodeDrafts, active: CodeLanguage, problemId: string|null) {
  if (!Object.hasOwn(codeLanguages,active)) throw new Error('Invalid language');
  const selected: CodeDrafts = {};
  for (const language of Object.keys(codeLanguages) as CodeLanguage[]) {
    const draft = drafts[language] || (language === active ? {code:codeTemplates[language],stdin:''} : null);
    if (!draft) continue;
    if (typeof draft.code !== 'string' || draft.code.length > 50000 || typeof draft.stdin !== 'string' || draft.stdin.length > 8000) throw new Error('Invalid draft');
    selected[language] = {code:draft.code,stdin:draft.stdin};
  }
  return JSON.stringify({format:'ttwar-playground',version:1,active_language:active,problem_id:problemId?.slice(0,160)||null,drafts:selected},null,2)+'\n';
}
export function requestTextDownload(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  let anchor: HTMLAnchorElement|undefined;
  try {
    anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;
    document.body.appendChild(anchor);anchor.click();
  } catch (error) {
    URL.revokeObjectURL(url);throw error;
  } finally {anchor?.remove();}
  // Give the browser time to consume the URL. No code is uploaded or executed.
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function protectDraftReload(event: BeforeUnloadEvent) {
  event.preventDefault();event.returnValue='';
}
