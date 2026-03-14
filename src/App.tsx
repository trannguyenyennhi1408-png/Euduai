import React, { useState } from 'react';
import { useStore } from './store';
import Auth from './components/Auth';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import RoomView from './components/RoomView';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const { currentUser, rooms } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(null);

  // Check if user is in an active room
  const activeRoomId = Object.values(rooms).find(
    r => {
      if (r.status === 'finished') return false;
      if (r.teacherId === currentUser?.id) {
        return r.gameMode !== 'homework';
      }
      return Object.values(r.participants).some(p => p.name === currentUser?.name && !p.isFinished);
    }
  )?.id;

  // Keep track of the room even if it finishes, until user explicitly leaves
  React.useEffect(() => {
    if (activeRoomId) {
      setViewingRoomId(activeRoomId);
    }
  }, [activeRoomId]);

  const currentRoomId = viewingRoomId;

  return (
    <>
      {!currentUser ? (
        <Auth />
      ) : currentRoomId ? (
        <RoomView roomId={currentRoomId} onLeave={() => setViewingRoomId(null)} />
      ) : currentUser.role === 'teacher' ? (
        <TeacherDashboard onOpenSettings={() => setShowSettings(true)} onEnterRoom={(id) => setViewingRoomId(id)} />
      ) : (
        <StudentDashboard onOpenSettings={() => setShowSettings(true)} />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
