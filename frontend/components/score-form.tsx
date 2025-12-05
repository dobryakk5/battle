"use client";

import { useEffect, useMemo, useState } from "react";

import { Criterion, HeatParticipant, HeatStatus, submitScore, updateHeatStatus } from "../lib/api";

export type SubmittedScore = {
  participantId: number;
  participantName: string;
  scores: { criterionId: number; name: string; value: number }[];
};

type Props = {
  heatId: number;
  roundId: number;
  participants: HeatParticipant[];
  criteria: Criterion[];
  defaultJudgeId: number;
  initialStatus: HeatStatus;
  submitted: Record<number, SubmittedScore>;
  onSubmitted: (entry: SubmittedScore) => void;
};

export function ScoreForm({
  heatId,
  roundId,
  participants,
  criteria,
  defaultJudgeId,
  initialStatus,
  submitted,
  onSubmitted,
}: Props) {
  const initialParticipantId = participants[0]?.participant_id ?? 0;
  const [selectedParticipant, setSelectedParticipant] = useState(initialParticipantId);
  const [judgeId, setJudgeId] = useState(defaultJudgeId);
  const clampDefaultScore = (criterion: Criterion) => {
    const min = typeof criterion.scale_min === "number" ? criterion.scale_min : 0;
    const max = typeof criterion.scale_max === "number" ? criterion.scale_max : 10;
    const prefered = 9;
    return Math.min(Math.max(prefered, min), max);
  };
  const buildDefaultValues = () =>
    Object.fromEntries(criteria.map((criterion) => [criterion.id, clampDefaultScore(criterion)]));

  const [values, setValues] = useState<Record<number, number>>(() => buildDefaultValues());
  const [heatStatus, setHeatStatus] = useState<HeatStatus>(initialStatus);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const participantOptions = useMemo(
    () =>
      participants.map((participant) => ({
        label: participant.participant_name,
        value: participant.participant_id,
      })),
    [participants]
  );

  const updateValue = (criterionId: number, inputValue: string) => {
    setValues((prev) => ({
      ...prev,
      [criterionId]: Number(inputValue),
    }));
  };

  useEffect(() => {
    setValues(buildDefaultValues());
  }, [criteria]);

  useEffect(() => {
    const entry = submitted[selectedParticipant];
    if (!entry) {
      setValues(buildDefaultValues());
      return;
    }
    const byCriterion = new Map(entry.scores.map((score) => [score.criterionId, score.value]));
    setValues((prev) => {
      const next: Record<number, number> = { ...prev };
      for (const criterion of criteria) {
        next[criterion.id] = byCriterion.get(criterion.id) ?? clampDefaultScore(criterion);
      }
      return next;
    });
  }, [selectedParticipant, submitted, criteria]);

  const STATUS_LABELS: Record<HeatStatus, string> = {
    waiting: "Ожидает",
    in_progress: "В процессе",
    finished: "Завершён",
  };

  const handleFinishHeat = async () => {
    if (heatStatus === "finished") {
      return;
    }
    setStatusSaving(true);
    setStatusMessage(null);
    setStatusError(null);
    try {
      const response = await updateHeatStatus(heatId, "finished");
      setHeatStatus(response.status);
      setStatusMessage("Заход отмечен завершённым.");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Не удалось обновить статус.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedParticipant) {
      setError("Выберите участника");
      setFormStatus("error");
      return;
    }
    setFormStatus("saving");
    setError(null);
    try {
      await Promise.all(
        criteria.map((criterion) =>
          submitScore({
            participant_id: selectedParticipant,
            judge_id: judgeId,
            round_id: roundId,
            heat_id: heatId,
            criterion_id: criterion.id,
            score: Number(values[criterion.id] ?? criterion.scale_max ?? 10),
          })
        )
      );
      const participantName =
        participantOptions.find((option) => option.value === selectedParticipant)?.label ?? "Участник";
      const submittedScores = criteria.map((criterion) => ({
        criterionId: criterion.id,
        name: criterion.name,
        value: Number(values[criterion.id] ?? criterion.scale_max ?? 10),
      }));
      onSubmitted({
        participantId: selectedParticipant,
        participantName,
        scores: submittedScores,
      });
      setFormStatus("success");
    } catch (err) {
      setFormStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось сохранить оценки");
    }
  };

  return (
    <div className="material-card section-card">
      <div className="section-meta" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
        <div>
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Форма оценки
          </h2>
        </div>
        <div className="section-meta" style={{ width: "100%" }}>
          <div>
            <p className="tagline">Статус захода</p>
            <h3 className="hero-title" style={{ fontSize: "1rem", margin: 0 }}>
              {STATUS_LABELS[heatStatus] ?? heatStatus}
            </h3>
          </div>
          <button
            type="button"
            className="material-button secondary"
            onClick={handleFinishHeat}
            disabled={heatStatus === "finished" || statusSaving}
          >
            {heatStatus === "finished" ? "Заход завершён" : statusSaving ? "Сохраняем..." : "Отметить завершённым"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <p className="text-small" style={{ color: "#34d399" }}>
          {statusMessage}
        </p>
      )}
      {statusError && (
        <p className="text-small" style={{ color: "#f87171" }}>
          {statusError}
        </p>
      )}

      <label className="text-small text-muted" htmlFor="judgeId">
        ID судьи
      </label>
      <input
        id="judgeId"
        type="number"
        min={1}
        value={judgeId}
        onChange={(event) => setJudgeId(Number(event.target.value))}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="participant">
        Участник
      </label>
      <select
        id="participant"
        className="glass-panel"
        value={selectedParticipant}
        onChange={(event) => setSelectedParticipant(Number(event.target.value))}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(2,6,23,0.8)",
          color: "#fff",
        }}
        disabled={participantOptions.length === 0}
      >
        {participantOptions.length === 0 ? (
          <option>Состав не загружен</option>
        ) : (
          participantOptions.map((participant) => (
            <option key={participant.value} value={participant.value}>
              {participant.label}
            </option>
          ))
        )}
      </select>

      <div className="section-grid-two">
        {criteria.map((criterion) => (
          <label key={criterion.id} className="section-card">
            <span className="text-small text-muted">
              {criterion.name} ({criterion.scale_min}-{criterion.scale_max})
            </span>
            <input
              type="number"
              min={criterion.scale_min}
              max={criterion.scale_max}
              step={0.1}
              value={values[criterion.id] ?? criterion.scale_min}
              onChange={(event) => updateValue(criterion.id, event.target.value)}
              style={{
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(3, 7, 18, 0.8)",
                color: "#fff",
                padding: "0.7rem 1rem",
              }}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        className="material-button primary"
        style={{ width: "100%" }}
        disabled={criteria.length === 0 || participantOptions.length === 0 || formStatus === "saving"}
        onClick={handleSubmit}
      >
        {formStatus === "saving" ? "Сохраняем..." : "Сохранить"}
      </button>

      {formStatus === "success" && <p className="text-small" style={{ color: "#34d399" }}>Оценки сохранены.</p>}
      {formStatus === "error" && error ? <p className="text-small" style={{ color: "#f87171" }}>{error}</p> : null}

      {Object.keys(submitted).length > 0 && (
        <div className="glass-panel" style={{ marginTop: "1rem", width: "100%" }}>
          <h3 className="hero-title" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Внесённые оценки
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Object.values(submitted).map((entry) => (
              <article key={entry.participantId} className="section-card material-card" style={{ gap: "0.5rem" }}>
                <h4 className="hero-title" style={{ margin: 0, fontSize: "1.1rem" }}>
                  {entry.participantName}
                </h4>
                <ul className="text-small" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                  {entry.scores.map((score) => (
                    <li
                      key={`${entry.participantId}-${score.criterionId}`}
                      style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}
                    >
                      <span className="text-muted">{score.name}</span>
                      <strong style={{ color: "#e0f2fe" }}>{score.value}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
