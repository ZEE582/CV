import { useId } from 'react';
type AuthInputProps = {
  label: string; type: string; placeholder: string; value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string; required?: boolean;
};
export default function AuthInput({ label, type, placeholder, value, onChange, autoComplete, required }: AuthInputProps) {
  const id = useId();
  return <div className="mb-4"><label htmlFor={id} className="block mb-2 text-gray-800 font-medium">{label}</label>
    <input id={id} type={type} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-right focus:outline focus:outline-2 focus:outline-indigo-500" value={value} onChange={onChange} autoComplete={autoComplete} required={required} /></div>;
}
