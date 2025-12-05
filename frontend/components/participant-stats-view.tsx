"use client";

import { useState } from "react";

import type { ParticipantStats } from "../lib/api";
import { formatRoundLabel } from "../lib/rounds";

type ParticipantStatsViewProps = {
  stats: ParticipantStats;
};

export function ParticipantStatsView({ stats }: ParticipantStatsViewProps) {
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [expandedHeatId, setExpandedHeatId] = useState<number | null>(null);

  // Group heats and scores by event
  const eventData = {
    id: stats.event_id,
    title: stats.event_title,
    date: stats.event_date,
    location: stats.event_location,
    category: stats.category_name,
    heats: stats.heats.filter((heat) => heat.event_title === stats.event_title),
    scores: stats.scores,
  };

  const toggleEvent = (eventId: number) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      setExpandedHeatId(null);
    } else {
      setExpandedEventId(eventId);
      setExpandedHeatId(null);
    }
  };

  const toggleHeat = (heatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHeatId(expandedHeatId === heatId ? null : heatId);
  };

  const getScoresForHeat = (heatId: number) => {
    return stats.scores.filter((score) => score.heat_id === heatId);
  };

  return (
    <div className="page-shell">
      <div className="section-meta">
        <div>
          <p className="tagline">Статистика участника</p>
          <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
            {stats.first_name} {stats.last_name}
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            {stats.number && <span className="chip">№{stats.number}</span>}
            {stats.role && <span className="chip">{stats.role}</span>}
          </div>
        </div>
      </div>

      <section className="material-card section-card">
        <h2 className="hero-title" style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
          Соревнования
        </h2>

        <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                  }}
                >
                  Название
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                  }}
                >
                  Дата
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                  }}
                >
                  Место
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                  }}
                >
                  Категория
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                onClick={() => toggleEvent(eventData.id)}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  transition: "background 0.15s ease",
                  background:
                    expandedEventId === eventData.id ? "rgba(34, 211, 238, 0.05)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34, 211, 238, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    expandedEventId === eventData.id ? "rgba(34, 211, 238, 0.05)" : "transparent";
                }}
              >
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", fontWeight: 500 }}>
                  {eventData.title}
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#94a3b8" }}>
                  {eventData.date ? new Date(eventData.date).toLocaleDateString("ru-RU") : "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#94a3b8" }}>
                  {eventData.location || "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#94a3b8" }}>
                  {eventData.category}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {expandedEventId === eventData.id && (
          <div style={{ marginTop: "1.5rem" }}>
            {/* Блок Заходы */}
            <div className="glass-panel section-card">
              <div className="section-meta">
                <h3 className="hero-title" style={{ fontSize: "1.2rem" }}>
                  Заходы
                </h3>
                <span className="chip">{eventData.heats.length}</span>
              </div>
              {eventData.heats.length === 0 ? (
                <p className="text-small text-muted">Нет заходов для этого соревнования.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                  {eventData.heats.map((heat) => {
                    const heatScores = getScoresForHeat(heat.id);
                    const isExpanded = expandedHeatId === heat.id;

                    return (
                      <div key={heat.id}>
                        <div
                          onClick={(e) => toggleHeat(heat.id, e)}
                          className="glass-panel clickable"
                          style={{ padding: "0.75rem" }}
                        >
                          <div className="section-meta">
                            <div>
                              <h4 className="hero-title" style={{ fontSize: "1rem" }}>
                                {formatRoundLabel(heat.round_type, heat.stage_format)} · Заход {heat.heat_number}
                              </h4>
                              <p className="text-small text-muted">Категория: {heat.category_name}</p>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span className="chip">Оценок: {heatScores.length}</span>
                              <span className={`chip ${heat.status === "in_progress" ? "chip-live" : ""}`}>
                                {heat.status === "finished"
                                  ? "Завершён"
                                  : heat.status === "in_progress"
                                    ? "В процессе"
                                    : "Ожидает"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Оценки для этого захода */}
                        {isExpanded && (
                          <div
                            className="glass-panel"
                            style={{
                              marginTop: "0.5rem",
                              marginLeft: "1.5rem",
                              padding: "0.75rem",
                              borderLeft: "2px solid rgba(34, 211, 238, 0.3)",
                            }}
                          >
                            <h5
                              className="hero-title"
                              style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#94a3b8" }}
                            >
                              Оценки
                            </h5>
                            {heatScores.length === 0 ? (
                              <p className="text-small text-muted">Нет оценок для этого захода.</p>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {heatScores.map((score) => (
                                  <div
                                    key={score.id}
                                    className="glass-panel"
                                    style={{ padding: "0.5rem 0.75rem" }}
                                  >
                                    <div className="section-meta">
                                      <div>
                                        {score.criterion_name && (
                                          <p className="text-small" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                                            {score.criterion_name}
                                          </p>
                                        )}
                                        <p className="text-small text-muted">Судья: {score.judge_name}</p>
                                      </div>
                                      <span
                                        className="chip"
                                        style={{
                                          fontSize: "1.1rem",
                                          fontWeight: 700,
                                          background: "rgba(34, 211, 238, 0.2)",
                                          borderColor: "rgba(34, 211, 238, 0.5)",
                                          color: "#22d3ee",
                                        }}
                                      >
                                        {score.score}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
