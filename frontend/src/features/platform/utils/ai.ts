export interface AiSource { id: string; company_id: string; title: string; company_name: string; location: string; job_type: string; experience_level: string }
export interface AiTurn { id: string; question: string; reply: string; sources: AiSource[]; includeJobs: boolean }
export interface AiHistory { role: 'user' | 'assistant'; content: string }
export const AI_MAX_MESSAGE = 4000;
export const aiSuggestions = ['حضّرني لمقابلة عمل كمطور React', 'ساعدني في صياغة ملخص مهني للسيرة الذاتية', 'اشرح الفرق بين Frontend وBackend مع مثال'];
export function aiQuestionError(value: string) { return !value.trim() ? 'اكتب سؤالك أولًا.' : value.length > AI_MAX_MESSAGE ? 'اختصر السؤال إلى 4000 حرف أو أقل.' : ''; }
export function aiHistory(turns: AiTurn[]): AiHistory[] { const pairs: AiHistory[][] = []; let length = 0; for (let index = turns.length - 1; index >= 0 && pairs.length < 3; index--) { const turn = turns[index]; if (aiQuestionError(turn.question) || !turn.reply.trim() || turn.reply.length > 8000) throw new Error('تعذر قراءة سياق المحادثة. ابدأ محادثة جديدة.'); const size = turn.question.trim().length + turn.reply.trim().length; if (length + size > 12000) break; pairs.unshift([{ role: 'user', content: turn.question.trim() }, { role: 'assistant', content: turn.reply.trim() }]); length += size; } return pairs.flat(); }
