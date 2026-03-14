import React, { useState } from 'react';
import { useStore } from '../store';
import { Play, LogOut, Settings, Trophy, Flame, Target } from 'lucide-react';
import Swal from 'sweetalert2';

export default function StudentDashboard({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { currentUser, joinRoom, logout } = useStore();
  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get('room') || '';
  const [roomCode, setRoomCode] = useState(roomCodeFromUrl);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập mã phòng', 'error');
      return;
    }

    const participantId = joinRoom(roomCode, currentUser?.name || 'Học sinh');
    if (!participantId) {
      Swal.fire('Lỗi', 'Mã phòng không hợp lệ, phòng đã kết thúc, hoặc bạn đã hoàn thành bài tập này!', 'error');
    } else {
      // Clear URL parameter after joining
      window.history.replaceState({}, document.title, window.location.pathname);
      Swal.fire('Thành công', 'Đã tham gia phòng thi!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">EduAI Student</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600">Chào, {currentUser?.name}</span>
            <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={logout} className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Chuỗi học tập</p>
              <p className="text-2xl font-bold text-slate-800">{currentUser?.streakDays || 0} ngày</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng điểm</p>
              <p className="text-2xl font-bold text-slate-800">{currentUser?.totalScore || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Hạng hiện tại</p>
              <p className="text-2xl font-bold text-slate-800">Tân binh</p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mt-12">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg shadow-orange-500/30">
              <Play className="w-10 h-10 text-white fill-current" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tham gia phòng thi</h2>
            <p className="text-slate-500 mb-8">Nhập mã phòng 6 số từ giáo viên để bắt đầu</p>
            
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-4xl tracking-[0.5em] font-mono px-4 py-4 rounded-2xl border-2 border-slate-200 focus:ring-0 focus:border-orange-500 outline-none transition-all bg-slate-50"
                placeholder="000000"
                maxLength={6}
              />
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1"
              >
                Vào phòng ngay
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
