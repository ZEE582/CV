type Props = {
  digits: string[];
  inputsRef: React.RefObject<HTMLInputElement[] >;
  onChange: (index: number,value: string) => void;
  onKeyDown: ( index: number, event: React.KeyboardEvent) => void;
  onPaste: (event: React.ClipboardEvent) => void;
};
function CodeInputs({digits, inputsRef,onChange,onKeyDown,onPaste,}: Props) {
  return (
    <div className="flex justify-center gap-3 mb-6" dir="ltr">
      {digits.map((digit, index) => (
        <input key={index} ref={(element) => {
            if (element) {
              inputsRef.current[index] =
                element;
            }
          }}
          type="text" inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) =>onChange(index,event.target.value ) }
          onKeyDown={(event) =>onKeyDown(index, event)}
          onPaste={onPaste}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition
          ${digit? "border-indigo-500 bg-indigo-50": "border-gray-300"}
          focus:border-indigo-500`}
        />
      ))}
    </div>
  );
}

export default CodeInputs;