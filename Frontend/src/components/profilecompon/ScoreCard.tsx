import ScoreBadge from "./ScoreBadge";

type Props = {score: number;};
function ScoreCard({score,}: Props) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
      <h2 className="text-base font-bold text-gray-800 mb-4">
        🏆 نقاطي
      </h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            مجموع النقاط المكتسبة من الألعاب
          </p>
          <p className="text-4xl font-extrabold text-indigo-600">
            {score.toLocaleString()}
          </p>
        </div>
        <ScoreBadge score={score} />
      </div>
    </div>
  );
}

export default ScoreCard;