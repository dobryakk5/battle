"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Participant, createManualHeat, updateManualHeat, deleteHeat } from "../lib/api";

type Props = {
  roundId: number;
  competitionId: number;
  participants: Participant[];
  initialSelectedIds?: number[];
  mode?: "create" | "edit";
  heatId?: number;
};

export function ManualHeatBuilder({
  roundId,
  competitionId,
  participants,
  initialSelectedIds = [],
  mode = "create",
  heatId,
}: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "error" | "success">("idle");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const isEdit = mode === "edit" && Boolean(heatId);
  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  const availableParticipants = useMemo(
    () => participants.filter((participant) => !selectedIds.includes(participant.id)),
    [participants, selectedIds],
  );
  const selectedParticipants = useMemo(
    () => participants.filter((participant) => selectedIds.includes(participant.id)),
    [participants, selectedIds],
  );

  const handleAdd = (participantId: number) => {
    setSelectedIds((prev) => (prev.includes(participantId) ? prev : [...prev, participantId]));
  };

  const handleRemove = (participantId: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== participantId));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setStatus("error");
      setMessage("Добавьте хотя бы одного участника");
      return;
    }

    setStatus("saving");
    setMessage(null);
    try {
      if (isEdit && heatId) {
        await updateManualHeat(roundId, heatId, selectedIds);
        setStatus("success");
        setMessage("Заход обновлён.");
      } else {
        await createManualHeat(roundId, selectedIds);
        setSelectedIds([]);
        setStatus("success");
        setMessage("Заход создан. Перейдите назад, чтобы увидеть обновлённый список.");
      }
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось создать заход");
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !heatId) return;
    setDeleteStatus("deleting");
    setDeleteMessage(null);
    try {
      await deleteHeat(roundId, heatId);
      setDeleteStatus("success");
      setDeleteMessage("Заход удалён.");
      router.push(`/battle/${competitionId}`);
    } catch (error) {
      setDeleteStatus("error");
      setDeleteMessage(error instanceof Error ? error.message : "Не удалось удалить заход");
    }
  };

  return (
    <div className="material-card section-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="section-meta" style={{ alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h2 className="hero-title" style={{ fontSize: "1.6rem" }}>
            Ручное формирование захода
          </h2>
          <p className="text-muted text-small">
            Перенесите участников справа налево по одному. В новом заходе отображаются выбранные участники.
          </p>
          <p className="text-muted text-small" style={{ margin: 0 }}>
            Участники захода: {selectedIds.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="material-button primary"
            onClick={handleSave}
            disabled={status === "saving" || selectedIds.length === 0}
          >
            {status === "saving" ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Сохранить заход"}
          </button>
          {isEdit && (
            <button
              type="button"
              className="material-button secondary"
              onClick={handleDelete}
              disabled={deleteStatus === "deleting"}
            >
              {deleteStatus === "deleting" ? "Удаляем..." : "Удалить заход"}
            </button>
          )}
        </div>
      </div>

      <div className="section-grid-two" style={{ gap: "1.5rem", alignItems: "stretch" }}>
        <div className="glass-panel" style={{ minHeight: "320px" }}>
          <h3 className="hero-title" style={{ fontSize: "1.1rem" }}>Все участники</h3>
          {availableParticipants.length === 0 ? (
            <p className="text-muted text-small">Все участники добавлены в список захода.</p>
          ) : (
            <ul className="text-small" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {availableParticipants.map((participant) => (
                <li
                  key={participant.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.4rem 0",
                  }}
                >
                  <span>
                    {participant.first_name} {participant.last_name}
                  </span>
                  <button
                    type="button"
                    className="material-button secondary"
                    style={{ padding: "0.25rem 0.75rem" }}
                    onClick={() => handleAdd(participant.id)}
                  >
                    →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel" style={{ minHeight: "320px" }}>
          <h3 className="hero-title" style={{ fontSize: "1.1rem" }}>
            Участники захода ({selectedIds.length})
          </h3>
          {selectedParticipants.length === 0 ? (
            <p className="text-muted text-small">Добавьте участников с левой стороны.</p>
          ) : (
            <ul className="text-small" style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {selectedParticipants.map((participant) => (
                <li
                  key={`${participant.id}-selected`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.4rem 0",
                  }}
                >
                  <span>
                    {participant.first_name} {participant.last_name}
                  </span>
                  <button
                    type="button"
                    className="material-button secondary"
                    style={{ padding: "0.25rem 0.75rem" }}
                    onClick={() => handleRemove(participant.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message && (
        <p className="text-small" style={{ color: status === "error" ? "#f87171" : "#34d399" }}>
          {message}
        </p>
      )}
      {deleteMessage && (
        <p className="text-small" style={{ color: deleteStatus === "error" ? "#f87171" : "#34d399" }}>
          {deleteMessage}
        </p>
      )}
    </div>
  );
}
