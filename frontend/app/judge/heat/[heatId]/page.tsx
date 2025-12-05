import Link from "next/link";

import type { SubmittedScore } from "../../../../components/score-form";
import { JudgeHeatScoringPanel } from "../../../../components/judge-heat-scoring-panel";
import type { Criterion, HeatParticipant, Score } from "../../../../lib/api";
import { fetchHeatDetail, fetchScoresForHeat } from "../../../../lib/api";
import { formatRoundLabel } from "../../../../lib/rounds";

const DEFAULT_JUDGE_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_JUDGE_ID ?? "1");

type HeatPageProps = {
  params: Promise<{ heatId: string }>;
};

export default async function HeatPage({ params }: HeatPageProps) {
  const { heatId: heatIdStr } = await params;
  const heatId = Number(heatIdStr);
  const heat = await fetchHeatDetail(heatId);
  const scores = await fetchScoresForHeat(heat.id);
  const initialSubmitted = groupScoresByParticipant(
    scores,
    heat.participants,
    heat.criteria,
    DEFAULT_JUDGE_ID,
  );

  return (
    <div className="page-shell">
      <section className="material-card section-card">
        <div className="section-meta">
          <div>
            <p className="tagline">Журнал судейства</p>
            <h1 className="hero-title">Заход №{heat.heat_number}</h1>
            <p className="text-muted text-small">
              {heat.event_title} · {formatRoundLabel(heat.round_type)}
            </p>
          </div>
          <span className={`chip ${heat.status === "in_progress" ? "chip-live" : ""}`}>
            {heat.status === "finished"
              ? "Завершён"
              : heat.status === "in_progress"
                ? "В процессе"
                : "Ожидает"}
          </span>
        </div>
        <p className="card-lead text-muted">
          Здесь можно внести индивидуальные оценки по критериям. Все данные моментально сохраняются и
          доступны главному судье.
        </p>
        <Link href="/judge" className="material-button secondary" style={{ width: "fit-content" }}>
          ← Назад к журналу
        </Link>
      </section>

      <JudgeHeatScoringPanel
        heatId={heat.id}
        roundId={heat.round_id}
        participants={heat.participants}
        criteria={heat.criteria}
        defaultJudgeId={DEFAULT_JUDGE_ID}
        initialStatus={heat.status}
        initialSubmitted={initialSubmitted}
      />
    </div>
  );
}

function groupScoresByParticipant(
  scores: Score[],
  participants: HeatParticipant[],
  criteria: Criterion[],
  judgeId: number,
): Record<number, SubmittedScore> {
  const participantLookup = new Map(participants.map((participant) => [participant.participant_id, participant.participant_name]));
  const criterionLookup = new Map(criteria.map((criterion) => [criterion.id, criterion.name]));

  return scores.reduce<Record<number, SubmittedScore>>((acc, score) => {
    if (judgeId && score.judge_id !== judgeId) {
      return acc;
    }
    if (score.criterion_id == null) {
      return acc;
    }
    const existing = acc[score.participant_id] ?? {
      participantId: score.participant_id,
      participantName:
        participantLookup.get(score.participant_id) ?? `Участник #${score.participant_id}`,
      scores: [],
    };
    existing.scores = [
      ...existing.scores,
      {
        criterionId: score.criterion_id,
        name: criterionLookup.get(score.criterion_id) ?? `Критерий #${score.criterion_id}`,
        value: score.score,
      },
    ];
    acc[score.participant_id] = existing;
    return acc;
  }, {});
}
