"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Competition, createCategory } from "../lib/api";

const CATEGORY_TYPES = [
  { value: "amateur", label: "Amateur" },
  { value: "pro", label: "Pro" },
  { value: "master", label: "Master" },
  { value: "debut", label: "Debut" },
];

type Props =
  | { competitions: Competition[]; lockCompetitionId?: never }
  | { lockCompetitionId: number; competitions?: never };

export function CreateCategoryForm(props: Props) {
  const router = useRouter();
  const competitionOptions: Competition[] =
    "lockCompetitionId" in props ? [] : props.competitions ?? [];
  const lockedCompetitionId = "lockCompetitionId" in props ? props.lockCompetitionId : undefined;

  const [competitionId, setCompetitionId] = useState<number>(
    lockedCompetitionId ?? competitionOptions[0]?.id ?? 0,
  );
  const [name, setName] = useState("");
  const [type, setType] = useState(CATEGORY_TYPES[0]?.value ?? "amateur");
  const [criteriaInput, setCriteriaInput] = useState("Музыкальность, Техника");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canPickCompetition = lockedCompetitionId === undefined;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Название категории обязательно");
      setStatus("error");
      return;
    }

    const criteria = criteriaInput
      .split(",")
      .map((criterion) => criterion.trim())
      .filter(Boolean);
    if (criteria.length === 0) {
      setError("Добавьте хотя бы один критерий");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      await createCategory({
        competitionId,
        name: name.trim(),
        type,
        criteria,
      });
      setStatus("success");
      setName("");
      setCriteriaInput("Музыкальность, Техника");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось создать категорию");
    }
  };

  return (
    <div className="section-card" style={{ gap: "0.75rem" }}>
      {canPickCompetition && competitionOptions.length === 0 && (
        <p className="text-muted">Создайте соревнование, чтобы добавить категорию.</p>
      )}

      {canPickCompetition && competitionOptions.length > 0 && (
        <>
          <label className="text-small text-muted" htmlFor="categoryCompetition">
            Соревнование
          </label>
          <select
            id="categoryCompetition"
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
            {competitionOptions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="text-small text-muted" htmlFor="categoryName">
        Название категории
      </label>
      <input
        id="categoryName"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Hip-Hop Adults"
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="categoryType">
        Тип
      </label>
      <select
        id="categoryType"
        className="glass-panel"
        value={type}
        onChange={(event) => setType(event.target.value)}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(2,6,23,0.8)",
          color: "#fff",
        }}
      >
        {CATEGORY_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="text-small text-muted" htmlFor="categoryCriteria">
        Критерии (через запятую)
      </label>
      <input
        id="categoryCriteria"
        value={criteriaInput}
        onChange={(event) => setCriteriaInput(event.target.value)}
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
        style={{ width: "100%" }}
        onClick={handleSubmit}
        disabled={status === "saving" || !competitionId}
      >
        {status === "saving" ? "Сохраняем..." : "Создать категорию"}
      </button>

      {status === "success" && <p className="text-small" style={{ color: "#34d399" }}>Категория создана.</p>}
      {status === "error" && error ? <p className="text-small" style={{ color: "#f87171" }}>{error}</p> : null}
    </div>
  );
}
