type Props = {score: number;};
function ScoreBadge({
  score,
}: Props) {
  const level =
    score === 0 ? {label: "مبتدئ",color:"bg-gray-100 text-gray-500",}
      :
    score < 500 ? {label: "متدرب 🌱",color:"bg-green-100 text-green-700",}
      :
   score < 2000 ? {label: "محترف ⚡",color:"bg-indigo-100 text-indigo-700", }
      :
       { label: "خبير 🔥",color:"bg-amber-100 text-amber-700",};
  return (
    <span className={`text-sm font-bold px-4 py-2 rounded-xl ${level.color}`}>
      {level.label}
    </span>
  );
}
export default ScoreBadge;