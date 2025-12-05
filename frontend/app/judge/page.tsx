import Link from "next/link";

import { fetchCompetitions, fetchHeats, fetchRounds, Heat } from "../../lib/api";
import { formatRoundLabel } from "../../lib/rounds";

type HeatCard = {
  heat: Heat;
  competitionTitle: string;
  roundLabel: string;
};

export default async function JudgePage() {
  let heatCards: HeatCard[] = [];
  let fetchError: string | null = null;

  try {
    const competitions = await fetchCompetitions();
    const perCompetition = await Promise.all(
      competitions.map(async (competition) => {
        const rounds = await fetchRounds(competition.id);
        const perRound = await Promise.all(
          rounds.map(async (round) => {
            const heats = await fetchHeats(round.id);
            return heats.map((heat) => ({
              heat,
              competitionTitle: competition.title,
              roundLabel: formatRoundLabel(round.round_type, round.stage_format),
            }));
          })
        );
        return perRound.flat();
      })
    );
    heatCards = perCompetition.flat();
  } catch (error) {
    fetchError = (error as Error).message;
  }

  return (
    <div className="page-shell">
      <section className="material-card section-card">
        <span className="tagline">Роль: судья</span>
        <h1 className="hero-title">Журнал оценок</h1>
        <p className="card-lead text-muted">
          Назначенные заходы, автоматическое сохранение и форма для ввода критериев. Все оценки
          отправляются на сервер мгновенно и доступны главному судье.
        </p>
      </section>

      {fetchError && (
        <section className="glass-panel section-card">
          <p className="text-muted text-small">Не удалось загрузить заходы: {fetchError}</p>
        </section>
      )}

      <section className="section-grid-two">
        {heatCards.length === 0 && !fetchError ? (
          <div className="glass-panel text-muted">Нет активных заходов. Распределите участников на вкладке админа.</div>
        ) : null}

        {heatCards.map(({ heat, competitionTitle, roundLabel }) => (
          <article key={heat.id} className="material-card section-card">
            <div className="section-meta">
              <div>
                <h2 className="hero-title" style={{ fontSize: "1.3rem" }}>
                  Заход {heat.heat_number}
                </h2>
                <p className="text-small text-muted">
                  {competitionTitle} · {roundLabel}
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
            <ul className="text-muted" style={{ paddingLeft: "1rem" }}>
              {heat.participants.map((participant) => (
                <li key={participant.participant_id} style={{ marginBottom: "0.4rem" }}>
                  {participant.participant_name}
                </li>
              ))}
            </ul>
            <Link href={`/judge/heat/${heat.id}`} className="material-button secondary">
              Открыть форму
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
