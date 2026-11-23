// Each line chooses its own direction; numeric expressions stay LTR.
export default function QuestionText({text}:{text:string}){return <p>{text.split('\n').map((line,index)=><span className="practice-question-line" dir={/[\u0590-\u08ff]/.test(line)?'auto':'ltr'} key={index}>{line||'\u00a0'}</span>)}</p>;}
