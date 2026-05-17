type Props = {
  label: string;
  value: string;
};

function InfoItem({
  label,
  value,
}: Props) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">
        {label}
      </p>

      <p className="text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}

export default InfoItem;