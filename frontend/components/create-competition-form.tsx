"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createCompetition } from "../lib/api";

export function CreateCompetitionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Название обязательно");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      await createCompetition({
        title: title.trim(),
        date: date || undefined,
        location: location || undefined,
      });
      setStatus("success");
      setTitle("");
      setDate("");
      setLocation("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Не удалось создать соревнование");
    }
  };

  return (
    <div className="section-card" style={{ gap: "0.75rem" }}>
      <label className="text-small text-muted" htmlFor="competitionTitle">
        Название
      </label>
      <input
        id="competitionTitle"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Battle of the Year"
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="competitionDate">
        Дата
      </label>
      <input
        id="competitionDate"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        style={{
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(3, 7, 18, 0.8)",
          color: "#fff",
          padding: "0.7rem 1rem",
        }}
      />

      <label className="text-small text-muted" htmlFor="competitionLocation">
        Локация
      </label>
      <input
        id="competitionLocation"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Москва, CSKA Arena"
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
        disabled={status === "saving"}
      >
        {status === "saving" ? "Создаём..." : "Создать соревнование"}
      </button>

      {status === "success" && <p className="text-small" style={{ color: "#34d399" }}>Соревнование создано.</p>}
      {status === "error" && error ? <p className="text-small" style={{ color: "#f87171" }}>{error}</p> : null}
    </div>
  );
}
