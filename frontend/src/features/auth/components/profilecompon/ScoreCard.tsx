export default function ScoreCard({ score }: { score: number }) {
  const points = Number.isFinite(score) ? score : 0;
  return <div className="profile-score"><div><h2>نقاطي</h2><p>رصيد النقاط المسجّل في حسابك.</p></div><strong>{points.toLocaleString('ar')}<span>نقطة</span></strong></div>;
}
