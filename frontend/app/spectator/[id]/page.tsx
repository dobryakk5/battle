import Link from "next/link";

import { fetchCompetitionById, fetchHeats, fetchParticipants, fetchRounds } from "../../../lib/api";
import { formatRoundLabel } from "../../../lib/rounds";

type SpectatorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpectatorPage({ params }: SpectatorPageProps) {
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

  const allParticipants = competition.categories.length > 0
    ? await Promise.all(
        competition.categories.map(async (category) => ({
          category,
          participants: await fetchParticipants(competitionId, category.id),
        })),
      )
    : [];

  return (
    <div className="page-shell">
      <div className="section-meta">
        <div>
          <p className="tagline">Режим просмотра</p>
          <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
            {competition.title}
          </h1>
          <p className="text-muted text-small">
            {competition.location ?? "Локация не указана"} · {competition.date ?? "дата не указана"}
          </p>
        </div>
      </div>

      <nav className="glass-panel section-card" style={{ display: "flex", gap: "0.75rem" }}>
        <a className="material-button secondary" href="#heats">
          Заходы
        </a>
        <a className="material-button secondary" href="#participants">
          Участники
        </a>
      </nav>

      <section id="heats" className="material-card section-card">
        <div className="section-meta">
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Заходы
          </h2>
          <span className="chip">Раунды</span>
        </div>
        {roundsWithHeats.length === 0 ? (
          <p className="text-muted text-small">Пока нет созданных раундов или заходов.</p>
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
                  {heats.length === 0 ? (
                    <p className="text-small text-muted">Для этого раунда ещё нет заходов.</p>
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

      <section id="participants" className="material-card section-card">
        <div className="section-meta">
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Участники
          </h2>
          <span className="chip">Категории</span>
        </div>
        {allParticipants.length === 0 ? (
          <p className="text-muted text-small">Пока нет категорий или участников.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            {allParticipants.map(({ category, participants }) => (
              <article key={category.id} className="glass-panel section-card" style={{ gap: "0.75rem" }}>
                <div className="section-meta">
                  <div>
                    <p className="tagline">Категория</p>
                    <h3 className="hero-title" style={{ fontSize: "1.2rem" }}>
                      {category.name}
                    </h3>
                  </div>
                  <span className="chip">{category.type}</span>
                </div>
                {participants.length === 0 ? (
                  <p className="text-small text-muted">Нет участников в этой категории.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {participants.map((participant) => (
                      <li key={participant.id}>
                        <Link
                          href={`/participant/${participant.id}`}
                          style={{
                            textDecoration: "none",
                            color: "#22d3ee",
                            fontWeight: 500,
                            fontSize: "0.95rem",
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          {participant.first_name} {participant.last_name}
                          {participant.number && (
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>#{participant.number}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
