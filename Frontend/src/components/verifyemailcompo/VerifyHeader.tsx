type Props = {email: string;};
function VerifyHeader({email,}: Props) {
  return (
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        تحقق من بريدك
      </h2>
      <p className="text-sm text-gray-500">
        أرسلنا كود مكون من 5 أرقام إلى
      </p>
      <p className="text-sm font-medium text-indigo-600 mt-1"dir="ltr">
        {email}
      </p>
    </div>
  );
}

export default VerifyHeader;