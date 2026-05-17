type Props = {
  title: string;
  children: React.ReactNode;
};

function ProfileSection({
  title,
  children,
}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
      <h2 className="text-base font-bold text-gray-800 mb-4">
        {title}
      </h2>

      {children}
    </div>
  );
}

export default ProfileSection;