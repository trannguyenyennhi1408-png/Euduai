import React, { useState } from 'react';
import { useStore } from '../store';
import { BookOpen, GraduationCap, Users, Settings } from 'lucide-react';
import Swal from 'sweetalert2';
import SettingsModal from './SettingsModal';

export default function Auth() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = urlParams.get('room');
  
  const [role, setRole] = useState<'teacher' | 'student' | null>(roomCodeFromUrl ? 'student' : null);
  const [name, setName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const login = useStore(state => state.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập tên của bạn', 'error');
      return;
    }
    if (!role) {
      Swal.fire('Lỗi', 'Vui lòng chọn vai trò', 'error');
      return;
    }
    try {
      login(name.trim(), role);
    } catch (error: any) {
      Swal.fire('Lỗi', error.message || 'Đã có lỗi xảy ra', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 rounded-full font-medium shadow-sm border border-slate-200 transition-all"
        >
          <Settings className="w-4 h-4 mr-2" />
          Cài đặt API Key
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-orange-400 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">EduAI</h1>
            <p className="text-white/80">Nền tảng học tập tương tác thông minh</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Bạn là ai?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    role === 'teacher'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <GraduationCap className="w-8 h-8 mb-2" />
                  <span className="font-medium">Giáo viên</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    role === 'student'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 hover:border-orange-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Users className="w-8 h-8 mb-2" />
                  <span className="font-medium">Học sinh</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Họ và tên
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Nhập tên của bạn..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
              Bắt đầu ngay
            </button>
          </form>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
