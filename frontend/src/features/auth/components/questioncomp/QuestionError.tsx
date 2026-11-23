type Props = {
  error: string;
};

function QuestionError({ error }: Props) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
      {error}
    </div>
  );
}

export default QuestionError;