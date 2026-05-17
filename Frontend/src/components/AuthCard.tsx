type AuthCardProps = {
  children: React.ReactNode;
};

function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md border border-gray-200 rounded-3xl bg-white shadow-lg p-8">
        {children}
      </div>
    </div>
  );
}

export default AuthCard;