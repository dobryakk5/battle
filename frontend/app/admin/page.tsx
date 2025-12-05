import Link from "next/link";

import { CreateCategoryForm } from "../../components/create-category-form";
import { CreateCompetitionForm } from "../../components/create-competition-form";
import { DistributeHeatsForm } from "../../components/distribute-heats-form";
import { ParticipantForm } from "../../components/participant-form";
import { fetchCompetitions } from "../../lib/api";

const hints = [
  "Распределяйте заходы только после подтверждения состава участников.",
  "Telegram-бот отправляет нотификации, когда новый заход готов.",
  "Экспорт протоколов доступен сразу после блокировки оценок.",
];

export default async function AdminPage() {
  const competitions = await fetchCompetitions();

  return (
    <div className="page-shell">
      <section className="material-card section-card">
        <span className="tagline">Роль: главный судья</span>
        <h1 className="hero-title">Управление заходами</h1>
        <p className="card-lead text-muted">
          Создавайте раунды, распределяйте участников по заходам и выдавайте протоколы в Excel/
          PDF. Встроенные правила очерёдности и тай-брейки работают автоматически.
        </p>
      </section>

      <section className="section-grid-two">
        <article className="material-card section-card">
          <div className="section-meta">
            <div>
              <p className="tagline">API</p>
              <h2 className="hero-title" style={{ fontSize: "1.8rem" }}>
                Распределить заходы
              </h2>
            </div>
            <span className="chip">Раунд</span>
          </div>
          <DistributeHeatsForm competitions={competitions} />
        </article>

        <article className="glass-panel section-card">
          <div>
            <h2 className="hero-title" style={{ fontSize: "1.4rem" }}>
              Экспорт
            </h2>
            <p className="text-muted text-small">
              Excel, PDF и опциональная выгрузка в Google Sheets по OAuth.
            </p>
          </div>
          <Link href="/admin/exports" className="material-button secondary">
            Перейти к протоколам
          </Link>
        </article>
      </section>

      <section className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Создать соревнование
        </h2>
        <CreateCompetitionForm />
      </section>

      <section className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Создать категорию
        </h2>
        <CreateCategoryForm competitions={competitions} />
      </section>

      <section className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Добавить участника
        </h2>
        {competitions.length === 0 ? (
          <p className="text-muted">
            Сначала создайте соревнование через API или бот, затем вернитесь к форме добавления участников.
          </p>
        ) : (
          <ParticipantForm competitions={competitions} />
        )}
      </section>

      <section className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
          Советы
        </h2>
        <ul className="text-muted" style={{ paddingLeft: "1.2rem" }}>
          {hints.map((hint) => (
            <li key={hint} style={{ marginBottom: "0.5rem" }}>
              {hint}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
