import Link from "next/link";

import { ManualHeatBuilder } from "../../../../../../../components/manual-heat-builder";
import { fetchHeatDetail, fetchParticipants, fetchRound } from "../../../../../../../lib/api";
import { formatRoundLabel } from "../../../../../../../lib/rounds";

type EditHeatPageProps = {
  params: Promise<{ id: string; roundId: string; heatId: string }>;
};

export default async function EditHeatPage({ params }: EditHeatPageProps) {
  const { id, roundId: roundIdStr, heatId: heatIdStr } = await params;
  const competitionId = Number(id);
  const roundId = Number(roundIdStr);
  const heatId = Number(heatIdStr);

  const [round, heatDetail] = await Promise.all([
    fetchRound(roundId),
    fetchHeatDetail(heatId),
  ]);
  const participants = await fetchParticipants(competitionId, round.category_id);
  const initialSelectedIds = heatDetail.participants.map((participant: any) => participant.participant_id);

  return (
    <div className="page-shell" style={{ gap: "1rem" }}>
      <Link href={`/battle/${competitionId}`} className="material-button secondary" style={{ width: "fit-content" }}>
        ← Назад
      </Link>

      <section className="material-card section-card">
        <div className="section-meta">
          <div>
            <p className="tagline">Редактирование захода</p>
            <h1 className="hero-title" style={{ fontSize: "1.8rem" }}>
              {formatRoundLabel(round.round_type, round.stage_format)} · Заход №{heatDetail.heat_number}
            </h1>
            <p className="text-muted text-small">Категория #{round.category_id}</p>
          </div>
        </div>
        <p className="text-muted text-small">
          Измените состав захода и сохраните изменения. При необходимости можно удалить заход полностью.
        </p>
      </section>

      <ManualHeatBuilder
        mode="edit"
        roundId={roundId}
        heatId={heatId}
        competitionId={competitionId}
        participants={participants}
        initialSelectedIds={initialSelectedIds}
      />
    </div>
  );
}
