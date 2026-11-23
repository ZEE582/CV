type AuthMessageProps = {
  message: string;
  isError: boolean;
};

function AuthMessage({ message, isError }: AuthMessageProps) {
  if (!message) return null;

  return (
    <p
      className={`text-center mb-4 text-sm font-medium ${
        isError ? "text-red-600" : "text-green-600"
      }`}
    >
      {message}
    </p>
  );
}

export default AuthMessage;