import Link from "next/link";

import { ManualHeatBuilder } from "../../../../../../components/manual-heat-builder";
import { fetchParticipants, fetchRound } from "../../../../../../lib/api";
import { formatRoundLabel } from "../../../../../../lib/rounds";

type ManualHeatPageProps = {
  params: { id: string; roundId: string };
};

export default async function ManualHeatPage({ params }: ManualHeatPageProps) {
  const competitionId = Number(params.id);
  const roundId = Number(params.roundId);

  const round = await fetchRound(roundId);
  const participants = await fetchParticipants(competitionId, round.category_id);

  return (
    <div className="page-shell" style={{ gap: "1rem" }}>
      <Link href={`/battle/${competitionId}`} className="material-button secondary" style={{ width: "fit-content" }}>
        ← Назад
      </Link>

      <section className="material-card section-card">
        <div className="section-meta">
          <div>
            <p className="tagline">Ручное распределение</p>
            <h1 className="hero-title" style={{ fontSize: "1.8rem" }}>
              {formatRoundLabel(round.round_type, round.stage_format)}
            </h1>
            <p className="text-muted text-small">Категория #{round.category_id}</p>
          </div>
        </div>
        <p className="text-muted text-small">
          Выберите участников из общего списка и добавьте их в новый заход. По сохранении заход автоматически
          появится в блоке «Распределение по заходам».
        </p>
      </section>

      <ManualHeatBuilder roundId={roundId} participants={participants} />
    </div>
  );
}
