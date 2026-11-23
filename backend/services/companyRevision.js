exports.companyVersion = version => version === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: version };
exports.companyConflict = res => res.status(409).json({ success: false, code: 'COMPANY_CHANGED', message: 'تغيّرت بيانات الشركة. أعد تحميلها قبل حفظ التعديل.' });
