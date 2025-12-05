"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Competition,
  createRound,
  distributeHeats,
  fetchRounds,
  Round,
} from "../lib/api";

const ROUND_TYPES = [
  { value: "preliminary", label: "Отборочный" },
  { value: "semifinal", label: "Полуфинал" },
  { value: "final", label: "Финал" },
];

const normalizeStageFormat = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type Props =
  | { competition?: Competition; competitions?: never }
  | { competitions: Competition[]; competition?: never };

export function DistributeHeatsForm(props: Props) {
  const router = useRouter();
  const competitions = useMemo(
    () => (props.competition ? [props.competition] : props.competitions ?? []),
    [props.competition, props.competitions],
  );
  const [competitionId, setCompetitionId] = useState<number>(
    props.competition?.id ?? competitions[0]?.id ?? 0,
  );
  const selectedCompetition = competitions.find((competition) => competition.id === competitionId);
  const [categoryId, setCategoryId] = useState<number>(
    selectedCompetition?.categories[0]?.id ?? 0,
  );
  const [roundType, setRoundType] = useState<string>(ROUND_TYPES[0]?.value ?? "preliminary");
  const [stageFormat, setStageFormat] = useState("");
  const [maxInHeat, setMaxInHeat] = useState("8");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [roundsCache, setRoundsCache] = useState<Record<number, Round[]>>({});

  useEffect(() => {
    if (competitions.length === 0) {
      setCompetitionId(0);
      setCategoryId(0);
      return;
    }
    const exists = competitions.some((competition) => competition.id === competitionId);
    if (!exists) {
      setCompetitionId(competitions[0].id);
      setCategoryId(competitions[0].categories[0]?.id ?? 0);
    }
  }, [competitions, competitionId]);

  useEffect(() => {
    if (!selectedCompetition) {
      setCategoryId(0);
      return;
    }
    const hasCategory = selectedCompetition.categories.some((category) => category.id === categoryId);
    if (!hasCategory) {
      setCategoryId(selectedCompetition.categories[0]?.id ?? 0);
    }
  }, [selectedCompetition, categoryId]);

  const categoryOptions = selectedCompetition?.categories ?? [];
  const canPickCompetition = !props.competition;
  const noCompetitions = competitions.length === 0;
  const noCategories = categoryOptions.length === 0;

  const handleSubmit = async () => {
    if (!competitionId || !categoryId) {
      setStatus("error");
      setMessage("Выберите соревнование и категорию.");
      return;
    }
    const parsedMax = Number(maxInHeat);
    if (!parsedMax || parsedMax <= 0) {
      setStatus("error");
      setMessage("Максимум в заходе должен быть положительным числом.");
      return;
    }

    const normalizedStage = normalizeStageFormat(stageFormat);
    setStatus("saving");
    setMessage(null);

    try {
      let rounds = roundsCache[competitionId];
      if (!rounds) {
        rounds = await fetchRounds(competitionId);
        setRoundsCache((prev) => ({ ...prev, [competitionId]: rounds }));
      }
      const availableRounds = rounds ?? [];
      let round =
        availableRounds.find(
          (item) =>
            item.category_id === categoryId &&
            item.round_type === roundType &&
            normalizeStageFormat(item.stage_format) === normalizedStage,
        ) ?? null;

      if (!round) {
        round = await createRound({
          event_id: competitionId,
          category_id: categoryId,
          round_type: roundType,
          stage_format: normalizedStage,
        });
        setRoundsCache((prev) => {
          const current = prev[competitionId] ?? availableRounds;
          const next = [...current.filter((item) => item.id !== round!.id), round!];
          return { ...prev, [competitionId]: next };
        });
      }

      const response = await distributeHeats(round.id, parsedMax);
      setStatus("success");
      setMessage(
        `Раунд #${round.id}: создано заходов ${response?.heats_created ?? "неизвестно"}.`,
      );

      // Refresh the page to show updated heats
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Ошибка распределения.");
    }
  };

  return (
    <div className="section-card" style={{ gap: "0.75rem" }}>
      {canPickCompetition && noCompetitions && (
        <p className="text-muted text-small">Создайте соревнование, чтобы распределять заходы.</p>
      )}

      {canPickCompetition && !noCompetitions && (
        <>
          <label className="text-small text-muted" htmlFor="competition">
            Соревнование
          </label>
          <select
            id="competition"
            className="glass-panel"
            value={competitionId}
            onChange={(event) => setCompetitionId(Number(event.target.value))}
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.8)",
              color: "#fff",
            }}
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title}
              </option>
            ))}
          </select>
        </>
      )}

      {!noCategories ? (
        <>
          <label className="text-small text-muted" htmlFor="category">
            Категория
          </label>
          <select
            id="category"
            className="glass-panel"
            value={categoryId}
            onChange={(event) => setCategoryId(Number(event.target.value))}
            style={{
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(2,6,23,0.8)",
              color: "#fff",
            }}
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-muted text-small">
          Добавьте хотя бы одну категорию для выбранного соревнования, чтобы распределять заходы.
        </p>
      )}

      <p className="text-muted text-small">
        Выберите тип раунда, задайте формат (опционально) и укажите максимум участников в заходе.
        Старая сетка будет очищена, затем система создаст новый набор заходов.
      </p>

      <label className="text-small text-muted" htmlFor="roundType">
        Тип раунда
      </label>
      <select
        id="roundType"
        className="glass-panel"
        value={roundType}
        onChange={(event) => setRoundType(event.target.value)}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(2,6,23,0.8)",
          color: "#fff",
        }}
      >
        {ROUND_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="text-small text-muted" htmlFor="stageFormat">
        Формат/этап (необязательно)
      </label>
      <input
        id="stageFormat"
        value={stageFormat}
        onChange={(event) => setStageFormat(event.target.value)}
        placeholder="Например, Top 16"
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="maxInHeat">
        Максимум участников в заходе
      </label>
      <input
        id="maxInHeat"
        type="number"
        min={1}
        value={maxInHeat}
        onChange={(event) => setMaxInHeat(event.target.value)}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <button
        type="button"
        className="material-button primary"
        onClick={handleSubmit}
        disabled={status === "saving" || noCompetitions || noCategories}
      >
        {status === "saving" ? "Распределяем..." : "Распределить заходы"}
      </button>

      {message && (
        <p className="text-small" style={{ color: status === "error" ? "#f87171" : "#34d399" }}>
          {message}
        </p>
      )}
    </div>
  );
}
