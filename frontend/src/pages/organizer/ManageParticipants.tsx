import { Navigate, useParams } from 'react-router-dom';

export default function ManageParticipants() {
  const { id } = useParams();
  return <Navigate to={`/organizer/tournaments/${id}/manage`} replace />;
}
