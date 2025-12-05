import { fetchParticipantStats } from "../../../lib/api";
import { ParticipantStatsView } from "../../../components/participant-stats-view";

type ParticipantStatsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParticipantStatsPage({ params }: ParticipantStatsPageProps) {
  const { id } = await params;
  const participantId = Number(id);
  const stats = await fetchParticipantStats(participantId);

  return <ParticipantStatsView stats={stats} />;
}
