import Link from "next/link";

import { CreateCategoryForm } from "../../../components/create-category-form";
import { DistributeHeatsForm } from "../../../components/distribute-heats-form";
import { ParticipantForm } from "../../../components/participant-form";
import { fetchCompetitionById, fetchHeats, fetchRounds } from "../../../lib/api";
import { formatRoundLabel } from "../../../lib/rounds";

type BattlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function BattlePage({ params }: BattlePageProps) {
  const { id } = await params;
  const competitionId = Number(id);
  const competition = await fetchCompetitionById(competitionId);
  const rounds = await fetchRounds(competitionId);
  const roundsWithHeats = await Promise.all(
    rounds.map(async (round) => ({
      round,
      heats: await fetchHeats(round.id),
    })),
  );

  return (
    <div className="page-shell">
      <div className="section-meta">
        <div>
          <p className="tagline">Соревнование</p>
          <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
            {competition.title}
          </h1>
          <p className="text-muted text-small">
            {competition.location ?? "Локация не указана"} · {competition.date ?? "дата не указана"}
          </p>
        </div>
        <Link href="/" className="material-button secondary">
          ← Назад
        </Link>
      </div>

      <nav className="glass-panel section-card" style={{ display: "flex", gap: "0.75rem" }}>
        <a className="material-button secondary" href="#categories">
          Категории
        </a>
        <a className="material-button secondary" href="#participants">
          Участники
        </a>
        <a className="material-button secondary" href="#heats">
          Заходы
        </a>
      </nav>
      <a
        href="/judge"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#22d3ee",
          fontWeight: 600,
          textDecoration: "none",
          alignSelf: "flex-start",
        }}
      >
        Судья → открыть журнал судьи
      </a>

      <section id="categories" className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Создать категорию
        </h2>
        <CreateCategoryForm lockCompetitionId={competition.id} />
      </section>

      <section id="participants" className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Добавить участника
        </h2>
        <ParticipantForm competition={competition} />
      </section>

      <section id="heats" className="material-card section-card">
        <div className="section-meta">
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Распределить заходы
          </h2>
          <span className="chip">Раунд</span>
        </div>
        <DistributeHeatsForm competition={competition} />
      </section>

      <section className="material-card section-card">
        <div className="section-meta">
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Распределение по заходам
          </h2>
          <span className="chip">Участники</span>
        </div>
        {roundsWithHeats.length === 0 ? (
          <p className="text-muted text-small">
            Пока нет созданных раундов или заходов. Добавьте раунд и распределите участников, чтобы увидеть сетку.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            {roundsWithHeats.map(({ round, heats }) => {
              const roundLabel = formatRoundLabel(round.round_type, round.stage_format);
              return (
                <article key={round.id} className="glass-panel section-card" style={{ gap: "0.75rem" }}>
                  <div className="section-meta">
                    <div>
                      <p className="tagline">Раунд</p>
                      <h3 className="hero-title" style={{ fontSize: "1.2rem" }}>
                        {roundLabel || "Без названия"}
                      </h3>
                    </div>
                    <span className="chip">ID {round.id}</span>
                  </div>
                  <div className="section-meta" style={{ justifyContent: "flex-end" }}>
                    <Link
                      href={`/battle/${competitionId}/round/${round.id}/manual`}
                      className="material-button secondary"
                    >
                      + Заход
                    </Link>
                  </div>
                  {heats.length === 0 ? (
                    <p className="text-small text-muted">
                      Для этого раунда ещё нет заходов. Нажмите «Распределить заходы».
                    </p>
                  ) : (
                    <div className="section-grid-two" style={{ width: "100%" }}>
                      {heats.map((heat) => (
                        <div key={heat.id} className="glass-panel" style={{ padding: "0.75rem", borderRadius: "1rem" }}>
                          <div className="section-meta">
                            <div>
                              <h4 className="hero-title" style={{ fontSize: "1rem" }}>
                                Заход {heat.heat_number}
                              </h4>
                              <p className="text-small text-muted">ID {heat.id}</p>
                            </div>
                            <span className={`chip ${heat.status === "in_progress" ? "chip-live" : ""}`}>
                              {heat.status === "finished"
                                ? "Завершён"
                                : heat.status === "in_progress"
                                  ? "В процессе"
                                  : "Ожидает"}
                            </span>
                          </div>
                          {heat.participants.length === 0 ? (
                            <p className="text-small text-muted">Нет участников</p>
                          ) : (
                            <ul className="text-small" style={{ paddingLeft: "1.2rem", margin: 0 }}>
                              {heat.participants.map((participant) => (
                                <li key={participant.participant_id} style={{ marginBottom: "0.3rem" }}>
                                  {participant.participant_name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
