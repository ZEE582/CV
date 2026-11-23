export default function InfoItem({ label, value }: { label: string; value: string }) {
  return <div className="profile-info-item"><dt>{label}</dt><dd dir="auto">{value}</dd></div>;
}
