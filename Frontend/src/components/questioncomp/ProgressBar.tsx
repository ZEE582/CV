type Props = {
  step: number;
  totalSteps: number;
};

const stepLabels = ["معلومات شخصية", "أكاديمية", "لغات البرمجة", "مهنية"];

function ProgressBar({ step, totalSteps }: Props) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          الخطوة {step} من {totalSteps}
        </span>

        <span className="text-sm font-medium text-indigo-600">
          {progress}%
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={`text-xs ${
              step === index + 1
                ? "text-indigo-600 font-medium"
                : "text-gray-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProgressBar;