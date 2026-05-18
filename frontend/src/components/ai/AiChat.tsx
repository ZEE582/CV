/**
 * @file AiChat.tsx
 * @description مساعد ذكي احترافي — يعمل عبر Backend + Gemini API
 */

import React, {
  useState,
  useRef,
  useEffect
} from 'react';

import { sendAiMessage } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

/* ─────────────────────────────────────────────────────────────
 * Suggestions
 * ───────────────────────────────────────────────────────────── */
const SUGGESTIONS = [
  'ما الفرق بين Frontend و Backend؟',
  'ما المطلوب للحصول على وظيفة Full Stack؟',
  'ساعدني في كتابة CV لمطور React',
  'ما متوسط رواتب المطورين في فلسطين؟',
  'كيف أتحضر لمقابلة تقنية؟',
  'اشرح لي متطلبات وظيفة DevOps'
];

/* ─────────────────────────────────────────────────────────────
 * Styles
 * ───────────────────────────────────────────────────────────── */
const T: React.CSSProperties = {
  fontFamily: "'Tajawal', sans-serif"
};

const ACCENT = '#6B5FE6';

const BORDER_COLOR =
  '1px solid #d8d5f0';

const BG_INPUT = '#fafafa';
const BG_BOX = '#ffffff';

/* ─────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────── */
export default function AiChat() {

  const { allJobs } = useApp();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text:
        'أهلاً! أنا مساعدك الذكي 🤖\n\n' +
        'يمكنني مساعدتك في:\n' +
        '• وظائف التكنولوجيا ومتطلباتها\n' +
        '• كتابة CV ورسائل التغطية\n' +
        '• التحضير للمقابلات التقنية\n' +
        '• البرمجة والتقنيات الحديثة\n' +
        '• أي سؤال عام\n\n' +
        'اسألني عن أي شيء 👇'
    }
  ]);

  const [input, setInput] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  /* ───────────────────────────────────────────────────────────
   * Auto Scroll
   * ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [msgs]);

  /* ───────────────────────────────────────────────────────────
   * Send Message
   * ─────────────────────────────────────────────────────────── */
  const send = async (text: string) => {

    if (!text.trim() || loading) {
      return;
    }

    // إضافة رسالة المستخدم
    setMsgs(prev => [
      ...prev,
      {
        role: 'user',
        text
      }
    ]);

    setInput('');
    setLoading(true);

    try {

      // الاتصال بالـ Backend
      const reply = await sendAiMessage(
        text,
        allJobs
      );

      // إضافة رد الذكاء الاصطناعي
      setMsgs(prev => [
        ...prev,
        {
          role: 'ai',
          text: reply
        }
      ]);

    } catch (err) {

      console.error(
        'AI CHAT ERROR:',
        err
      );

      let errorMessage =
        'تعذر الاتصال بالمساعد الذكي';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      // رسالة الخطأ
      setMsgs(prev => [
        ...prev,
        {
          role: 'ai',
          text:
            `عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي.\n\n` +
            `${errorMessage}\n\n` +
            `تأكد من:\n` +
            `• تشغيل الـ Backend\n` +
            `• وجود GEMINI_API_KEY داخل .env\n` +
            `• أن السيرفر يعمل على المنفذ 5000\n` +
            `• تثبيت node-fetch داخل الـ backend`
        }
      ]);

    } finally {
      setLoading(false);
    }
  };

  /* ───────────────────────────────────────────────────────────
   * UI
   * ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="ai-chat-container"
      style={{
        maxWidth: 740,
        margin: '0 auto',
        padding:
          'clamp(16px, 4vw, 36px) clamp(12px, 4vw, 24px)'
      }}
    >

      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 24
        }}
      >

        <div
          style={{
            fontSize:
              'clamp(36px, 8vw, 50px)',
            marginBottom: 10
          }}
        >
          🤖
        </div>

        <h1
          style={{
            ...T,
            fontSize:
              'clamp(20px, 5vw, 26px)',
            fontWeight: 900,
            color: '#1a1a2e',
            margin: 0
          }}
        >
          المساعد الذكي
        </h1>

        <p
          style={{
            ...T,
            fontSize:
              'clamp(12px, 2.5vw, 14px)',
            color: '#6666aa',
            marginTop: 6
          }}
        >
          متخصص في وظائف التكنولوجيا في فلسطين
          — يجيب على أي سؤال
        </p>

      </div>

      {/* Chat Box */}
      <div
        style={{
          background: BG_BOX,
          borderRadius: 20,
          border: BORDER_COLOR,
          overflow: 'hidden',

          boxShadow:
            '0 4px 32px rgba(107,95,230,0.13), 0 1px 8px rgba(107,95,230,0.08)'
        }}
      >

        {/* Messages */}
        <div
          style={{
            padding:
              'clamp(12px, 3vw, 20px)',

            display: 'flex',
            flexDirection: 'column',
            gap: 14,

            minHeight: 280,
            maxHeight:
              'clamp(280px, 50vh, 460px)',

            overflowY: 'auto',

            background: '#fdfcff'
          }}
        >

          {msgs.map((m, i) => (

            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent:
                  m.role === 'user'
                    ? 'flex-start'
                    : 'flex-end'
              }}
            >

              <div
                style={{
                  maxWidth: '88%',

                  padding:
                    'clamp(10px, 2vw, 12px) clamp(12px, 2.5vw, 16px)',

                  borderRadius:
                    m.role === 'user'
                      ? '18px 18px 18px 4px'
                      : '18px 18px 4px 18px',

                  ...T,

                  fontSize:
                    'clamp(12px, 2.5vw, 13px)',

                  lineHeight: 1.8,

                  whiteSpace: 'pre-wrap',

                  wordBreak: 'break-word',

                  background:
                    m.role === 'user'
                      ? '#f0eeff'
                      : `linear-gradient(135deg, ${ACCENT}, #8B7FF8)`,

                  color:
                    m.role === 'user'
                      ? '#2a2060'
                      : '#fff',

                  border:
                    m.role === 'user'
                      ? '1px solid #e0dcf8'
                      : 'none'
                }}
              >
                {m.text}
              </div>

            </div>
          ))}

          {/* Loading */}
          {loading && (

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >

              <div
                style={{
                  padding: '12px 18px',

                  borderRadius:
                    '18px 18px 4px 18px',

                  background:
                    `linear-gradient(135deg, ${ACCENT}, #8B7FF8)`,

                  display: 'flex',
                  gap: 5,
                  alignItems: 'center'
                }}
              >

                {[0, 1, 2].map(d => (

                  <div
                    key={d}
                    style={{
                      width: 7,
                      height: 7,

                      borderRadius: '50%',

                      background:
                        'rgba(255,255,255,0.85)',

                      animation:
                        `bounce-dot 1.2s ${d * 150}ms infinite`
                    }}
                  />

                ))}

              </div>

            </div>
          )}

          <div ref={bottomRef} />

        </div>

        {/* Suggestions */}
        {msgs.length === 1 && (

          <div
            style={{
              padding:
                'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',

              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,

              borderTop:
                '1px solid #eeecfa',

              background: '#fdfcff'
            }}
          >

            {SUGGESTIONS.map(s => (

              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  ...T,

                  fontSize:
                    'clamp(11px, 2vw, 12px)',

                  padding: '6px 14px',

                  borderRadius: 99,

                  border:
                    '1px solid #c8c2f0',

                  background: '#f0eeff',

                  color: ACCENT,

                  cursor: 'pointer',

                  transition: 'all .15s'
                }}
              >
                {s}
              </button>

            ))}

          </div>
        )}

        {/* Divider */}
        <div
          style={{
            borderTop:
              '1px solid #e8e4f8'
          }}
        />

        {/* Input Area */}
        <div
          style={{
            padding:
              'clamp(10px, 2vw, 14px) clamp(12px, 3vw, 16px)',

            display: 'flex',

            gap: 10,

            background: '#fff',

            alignItems: 'flex-end'
          }}
        >

          {/* Textarea */}
          <textarea
            value={input}

            onChange={e =>
              setInput(e.target.value)
            }

            onKeyDown={e => {

              if (
                e.key === 'Enter' &&
                !e.shiftKey
              ) {

                e.preventDefault();

                send(input);
              }
            }}

            placeholder="اسأل عن أي شيء... وظائف، CV، مقابلات، تقنيات..."

            disabled={loading}

            dir="rtl"

            rows={1}

            style={{
              flex: 1,

              border:
                '1.5px solid #c8c2f0',

              borderRadius: 12,

              padding:
                'clamp(9px, 2vw, 11px) 15px',

              ...T,

              fontSize:
                'clamp(13px, 2.5vw, 14px)',

              color: '#1a1a2e',

              background: BG_INPUT,

              outline: 'none',

              resize: 'none',

              minHeight: 46,

              maxHeight: 120,

              lineHeight: 1.5,

              transition:
                'border-color .2s'
            }}

            onFocus={e => {
              e.currentTarget.style.borderColor =
                ACCENT;
            }}

            onBlur={e => {
              e.currentTarget.style.borderColor =
                '#c8c2f0';
            }}
          />

          {/* Send Button */}
          <button
            onClick={() => send(input)}

            disabled={
              loading || !input.trim()
            }

            style={{
              width: 46,
              height: 46,

              borderRadius: 12,

              border: 'none',

              flexShrink: 0,

              background:
                input.trim() && !loading
                  ? `linear-gradient(135deg, ${ACCENT}, #8B7FF8)`
                  : '#e8e4f8',

              color:
                input.trim() && !loading
                  ? '#fff'
                  : '#9999cc',

              cursor:
                input.trim() && !loading
                  ? 'pointer'
                  : 'default',

              fontSize: 18,

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              transition: 'all .2s',

              boxShadow:
                input.trim() && !loading
                  ? '0 4px 12px rgba(107,95,230,0.3)'
                  : 'none'
            }}
          >
            ↗
          </button>

        </div>

      </div>

      {/* Footer */}
      <p
        style={{
          ...T,

          fontSize: 11,

          color: '#b0b0cc',

          textAlign: 'center',

          marginTop: 14
        }}
      >
        يمكنك سؤالي عن أي شيء — وظائف،
        تقنيات، CV، مقابلات، أو نصائح مهنية
      </p>

    </div>
  );
}