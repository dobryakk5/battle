import Link from "next/link";

import { CreateCompetitionButton } from "../components/create-competition-button";
import { fetchCompetitions } from "../lib/api";

export default async function HomePage() {
  const competitions = await fetchCompetitions();

  return (
    <div className="page-shell" style={{ maxWidth: "900px" }}>
      <div className="section-meta" style={{ marginBottom: "1rem" }}>
        <h1 className="hero-title" style={{ fontSize: "2rem" }}>
          Соревнования
        </h1>
        <CreateCompetitionButton />
      </div>

      {competitions.length === 0 ? (
        <div className="glass-panel text-muted">Пока нет соревнований. Нажмите «Создать», чтобы начать.</div>
      ) : (
        <section className="section-card" style={{ gap: "0.75rem" }}>
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/battle/${competition.id}`}
              className="material-card section-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="section-meta">
                <div>
                  <h2 className="hero-title" style={{ fontSize: "1.4rem" }}>
                    {competition.title}
                  </h2>
                  <p className="text-small text-muted">
                    {competition.location ?? "Локация не указана"}
                  </p>
                </div>
                <span className="tagline">{competition.date ?? "дата не указана"}</span>
              </div>
              <div className="text-muted text-small">
                Категорий: {competition.categories.length}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
