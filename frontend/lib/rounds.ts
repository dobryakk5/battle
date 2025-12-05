const ROUND_TYPE_LABELS: Record<string, string> = {
  preliminary: "Отборочный",
  semifinal: "Полуфинал",
  final: "Финал",
};

export function getRoundTypeLabel(roundType: string): string {
  return ROUND_TYPE_LABELS[roundType] ?? roundType;
}

export function formatRoundLabel(roundType: string, stageFormat?: string | null): string {
  const base = getRoundTypeLabel(roundType);
  return stageFormat ? `${base} · ${stageFormat}` : base;
}
