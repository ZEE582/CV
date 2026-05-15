/**
 * @file api/client.ts
 * @description HTTP Client للـ Backend + AI Assistant API
 * جميع طلبات الذكاء الاصطناعي تمر عبر الـ Backend لحماية Gemini API Key
 */

import type {
  JobsResponse,
  CompaniesResponse,
  CompanyResponse,
  Job
} from '../types';

/* ─────────────────────────────────────────────────────────────
 * Base API URL
 * ───────────────────────────────────────────────────────────── */
const BASE = 'http://localhost:5000/api';

/* ─────────────────────────────────────────────────────────────
 * Generic Request Helper
 * ───────────────────────────────────────────────────────────── */
async function req<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {

  try {

    const response = await fetch(
      `${BASE}${path}`,
      {
        method,

        headers: {
          'Content-Type': 'application/json'
        },

        body: body
          ? JSON.stringify(body)
          : undefined
      }
    );

    // محاولة قراءة JSON
    let data: any = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    // خطأ من السيرفر
    if (!response.ok) {

      throw new Error(
        data.message ||
        `HTTP Error ${response.status}`
      );
    }

    return data as T;

  } catch (err) {

    console.error(
      'API REQUEST ERROR:',
      err
    );

    if (err instanceof Error) {
      throw err;
    }

    throw new Error(
      'حدث خطأ أثناء الاتصال بالخادم'
    );
  }
}

/* ─────────────────────────────────────────────────────────────
 * Jobs API
 * ───────────────────────────────────────────────────────────── */
export const jobsApi = {

  /**
   * جلب الوظائف
   */
  list: (
    params?: Record<
      string,
      string | number
    >
  ) => {

    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).map(
              ([k, v]) => [
                k,
                String(v)
              ]
            )
          )
        )
      : '';

    return req<JobsResponse>(
      'GET',
      `/jobs${qs}`
    );
  },

  /**
   * جلب وظيفة واحدة
   */
  get: (id: string) =>
    req<{
      success: boolean;
      job: Job;
    }>(
      'GET',
      `/jobs/${id}`
    )
};

/* ─────────────────────────────────────────────────────────────
 * Companies API
 * ───────────────────────────────────────────────────────────── */
export const companiesApi = {

  /**
   * جلب الشركات
   */
  list: (
    params?: Record<string, string>
  ) => {

    const qs = params
      ? '?' + new URLSearchParams(params)
      : '';

    return req<CompaniesResponse>(
      'GET',
      `/companies${qs}`
    );
  },

  /**
   * جلب شركة واحدة
   */
  get: (id: string) =>
    req<CompanyResponse>(
      'GET',
      `/companies/${id}`
    )
};

/* ─────────────────────────────────────────────────────────────
 * Messages API
 * ───────────────────────────────────────────────────────────── */

/**
 * إرسال رسالة لشركة
 */
export async function sendContactMessage(
  data: {
    company_id: string;
    sender_name: string;
    sender_email: string;
    sender_phone?: string;
    subject?: string;
    message: string;
  }
) {

  return req(
    'POST',
    '/messages',
    data
  );
}

/* ─────────────────────────────────────────────────────────────
 * AI Assistant API
 * ───────────────────────────────────────────────────────────── */

/**
 * sendAiMessage
 *
 * يرسل رسالة للمساعد الذكي
 * عبر Backend → Gemini API
 *
 * @param message
 * رسالة المستخدم
 *
 * @param jobsList
 * قائمة الوظائف الحالية
 *
 * @returns string
 * رد الذكاء الاصطناعي
 */
export async function sendAiMessage(
  message: string,
  jobsList: Job[] = []
): Promise<string> {

  try {

    // تحقق من الرسالة
    if (!message.trim()) {
      throw new Error(
        'الرسالة مطلوبة'
      );
    }

    // طلب API
    const response = await fetch(
      `${BASE}/ai/chat`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          message: message.trim(),
          jobsList
        })
      }
    );

    // قراءة البيانات
    let data: any = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    // أخطاء السيرفر
    if (!response.ok) {

      console.error(
        'AI API ERROR:',
        data
      );

      throw new Error(
        data.message ||
        `HTTP Error ${response.status}`
      );
    }

    // فشل داخلي
    if (!data.success) {

      throw new Error(
        data.message ||
        'فشل الاتصال بالمساعد الذكي'
      );
    }

    // لا يوجد رد
    if (!data.reply) {

      throw new Error(
        'لم يتم استلام رد من المساعد الذكي'
      );
    }

    return data.reply;

  } catch (err) {

    console.error(
      'sendAiMessage ERROR:',
      err
    );

    // أخطاء fetch
    if (
      err instanceof TypeError
    ) {

      throw new Error(
        'تعذر الاتصال بالخادم. تأكد من تشغيل الـ Backend على المنفذ 5000'
      );
    }

    // أخطاء عادية
    if (err instanceof Error) {
      throw err;
    }

    // fallback
    throw new Error(
      'حدث خطأ غير متوقع أثناء الاتصال بالمساعد الذكي'
    );
  }
}