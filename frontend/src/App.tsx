import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from '@/components/Layout';
import RequireAuth from '@/components/RequireAuth';
import RequireOrganizer from '@/components/RequireOrganizer';
import Bracket from '@/pages/Bracket';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import OrganizerRequest from '@/pages/OrganizerRequest';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import Rankings from '@/pages/Rankings';
import Register from '@/pages/Register';
import TournamentDetail from '@/pages/TournamentDetail';
import Tournaments from '@/pages/Tournaments';
import WinnerScreen from '@/pages/WinnerScreen';
import CreateTournament from '@/pages/organizer/CreateTournament';
import ManageMatch from '@/pages/organizer/ManageMatch';
import ManageParticipants from '@/pages/organizer/ManageParticipants';
import ManageTournament from '@/pages/organizer/ManageTournament';
import MyTournaments from '@/pages/organizer/MyTournaments';
import TournamentSuccess from '@/pages/organizer/TournamentSuccess';
import { useAppStore } from '@/store/appStore';

export default function App() {
  const initialize = useAppStore((state) => state.initialize);
  const initialized = useAppStore((state) => state.initialized);
  const loading = useAppStore((state) => state.loading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized && loading) {
    return <div className="min-h-screen bg-[#07090F] text-white flex items-center justify-center">Загрузка приложения...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/tournaments/:id/bracket" element={<Bracket />} />
          <Route path="/tournaments/:id/winner" element={<WinnerScreen />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/players/:id" element={<PublicProfile />} />

          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/organizer/request" element={<OrganizerRequest />} />
          </Route>

          <Route element={<RequireOrganizer />}>
            <Route path="/organizer/tournaments" element={<MyTournaments />} />
            <Route path="/organizer/tournaments/new" element={<CreateTournament />} />
            <Route path="/organizer/tournaments/:id/success" element={<TournamentSuccess />} />
            <Route path="/organizer/tournaments/:id/manage" element={<ManageTournament />} />
            <Route path="/organizer/tournaments/:id/participants" element={<ManageParticipants />} />
            <Route path="/organizer/tournaments/:id/matches/:matchId" element={<ManageMatch />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
