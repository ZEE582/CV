import type { QuestionStep } from '../../types/questions';
import { QUESTION_STEPS } from '../../validation/questionsValidation';
export default function ProgressBar({ step, maxVisited, onSelect, disabled }: { step: QuestionStep; maxVisited: QuestionStep; onSelect: (step: QuestionStep) => void; disabled: boolean }) {
  return <nav aria-label="خطوات استكمال البيانات" className="questions-progress"><ol>{QUESTION_STEPS.map((item, index) => {
    const number = (index + 1) as QuestionStep;
    return <li key={item.short}><button type="button" disabled={disabled || number > maxVisited} aria-current={number === step ? 'step' : undefined} onClick={() => onSelect(number)}><span aria-hidden="true">{number.toLocaleString('ar')}</span>{item.short}</button></li>;
  })}</ol></nav>;
}
