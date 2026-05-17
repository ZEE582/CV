import type { QuestionsForm } from "../types/questions";

export function validateStep(
  step: number,
  form: QuestionsForm
) {
  if (step === 1) {
    if (!form.fullName.trim()) {
      return "يرجى إدخال اسمك الكامل";
    }

    if (
      !form.age ||
      isNaN(Number(form.age))
    ) {
      return "يرجى إدخال عمر صحيح";
    }

    if (!form.city) {
      return "يرجى اختيار مدينتك";
    }
  }

  if (step === 2) {
    if (
      !form.university.trim() ||
      !form.major.trim()
    ) {
      return "يرجى تعبئة جميع الحقول";
    }
  }

  if (step === 3) {
    if (
      form.programmingLanguages
        .length === 0
    ) {
      return "اختر لغة واحدة على الأقل";
    }
  }

  if (step === 4) {
    if (
      !form.jobTitle ||
      !form.experienceYears ||
      !form.jobInterest
    ) {
      return "يرجى تعبئة جميع الحقول";
    }
  }

  return null;
}