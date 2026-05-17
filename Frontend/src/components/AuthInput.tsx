type AuthInputProps = {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
function AuthInput({
  label,
  type,
  placeholder,
  value,
  onChange,
}: AuthInputProps) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-gray-800 font-medium">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-right focus:border-indigo-500"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default AuthInput;