import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { generateQuizFromText } from '../lib/gemini';
import { Plus, Play, Trash2, FileText, Loader2, LogOut, Settings, Download, Upload, Zap, Heart, Target, X, Link } from 'lucide-react';
import Swal from 'sweetalert2';
import { GameMode } from '../types';

export default function TeacherDashboard({ onOpenSettings, onEnterRoom }: { onOpenSettings: () => void, onEnterRoom: (id: string) => void }) {
  const { currentUser, quizzes, createQuiz, deleteQuiz, createRoom, logout } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedQuizForRoom, setSelectedQuizForRoom] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    if (!title.trim() || !documentText.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập tiêu đề và nội dung tài liệu', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const questions = await generateQuizFromText(documentText);
      if (questions && questions.length > 0) {
        createQuiz(title, questions);
        setIsCreating(false);
        setTitle('');
        setDocumentText('');
        Swal.fire('Thành công', 'Đã tạo bộ câu hỏi thành công!', 'success');
      }
    } catch (error: any) {
      Swal.fire('Lỗi', error.message || 'Không thể tạo câu hỏi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = (mode: GameMode, quizId?: string) => {
    const targetQuizId = quizId || selectedQuizForRoom;
    if (!targetQuizId) return;
    const roomId = createRoom(targetQuizId, mode);
    if (roomId) {
      if (mode === 'homework') {
        const room = useStore.getState().rooms[roomId];
        const link = `${window.location.origin}?room=${room.code}`;
        Swal.fire({
          title: 'Đã tạo bài tập!',
          html: `Học sinh có thể truy cập link sau để làm bài:<br/><br/><a href="${link}" target="_blank" class="text-blue-500 underline break-all">${link}</a><br/><br/>Hoặc nhập mã phòng: <b>${room.code}</b>`,
          icon: 'success'
        });
      } else {
        Swal.fire('Thành công', 'Phòng thi đã được tạo!', 'success');
      }
      setSelectedQuizForRoom(null);
    }
  };

  const handleExportData = () => {
    const data = localStorage.getItem('eduai-storage');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        JSON.parse(data); // Validate JSON
        localStorage.setItem('eduai-storage', data);
        window.location.reload();
      } catch (error) {
        Swal.fire('Lỗi', 'File không hợp lệ', 'error');
      }
    };
    reader.readAsText(file);
  };

  const myQuizzes = quizzes.filter(q => q.teacherId === currentUser?.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-orange-400 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">EduAI Teacher</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">Chào, {currentUser?.name}</span>
            <button onClick={handleExportData} title="Xuất dữ liệu" className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Nhập dữ liệu" className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Thư viện câu hỏi</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo bộ câu hỏi mới
          </button>
        </div>

        {/* Active Rooms Section */}
        {Object.values(useStore.getState().rooms).filter(r => r.teacherId === currentUser?.id && r.status !== 'finished').length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Phòng đang hoạt động</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(useStore.getState().rooms)
                .filter(r => r.teacherId === currentUser?.id && r.status !== 'finished')
                .map(room => {
                  const quiz = quizzes.find(q => q.id === room.quizId);
                  return (
                    <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{quiz?.title || 'Bài kiểm tra'}</h3>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">
                          {room.gameMode === 'homework' ? 'Bài tập' : 'Thi đấu'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mb-6">
                        <Users className="w-4 h-4 mr-1.5" />
                        {Object.keys(room.participants).length} học sinh
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEnterRoom(room.id)}
                          className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium transition-colors"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Vào phòng
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {isCreating && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tạo câu hỏi bằng AI</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài kiểm tra</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Kiểm tra 15 phút Lịch Sử..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung tài liệu (Dán văn bản vào đây)</label>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-48 resize-none"
                  placeholder="Dán nội dung bài học, tài liệu PDF, Word vào đây để AI tự động tạo câu hỏi..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isLoading}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-md disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo bằng AI'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myQuizzes.length === 0 && !isCreating ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-600">Chưa có bộ câu hỏi nào</h3>
              <p className="text-slate-400 mt-1">Hãy tạo bộ câu hỏi đầu tiên của bạn bằng AI</p>
            </div>
          ) : (
            myQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{quiz.title}</h3>
                  <button
                    onClick={() => deleteQuiz(quiz.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm text-slate-500 mb-6">
                  <FileText className="w-4 h-4 mr-1.5" />
                  {quiz.questions.length} câu hỏi
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedQuizForRoom(quiz.id)}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-medium transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Tạo phòng thi đấu
                  </button>
                  <button
                    onClick={() => handleCreateRoom('homework', quiz.id)}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-medium transition-colors"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Giao bài tập
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedQuizForRoom && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Chọn chế độ chơi</h2>
                <button onClick={() => setSelectedQuizForRoom(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleCreateRoom('standard')} className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Tiêu chuẩn</h3>
                  <p className="text-sm text-slate-500">Trả lời câu hỏi bình thường, 10 điểm mỗi câu đúng.</p>
                </button>
                
                <button onClick={() => handleCreateRoom('speed')} className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-all group">
                  <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Tốc độ</h3>
                  <p className="text-sm text-slate-500">Trả lời càng nhanh điểm càng cao (Tối đa 30 điểm/câu).</p>
                </button>

                <button onClick={() => handleCreateRoom('survival')} className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 transition-all group">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Sinh tồn</h3>
                  <p className="text-sm text-slate-500">Mỗi học sinh có 3 mạng. Trả lời sai sẽ mất 1 mạng.</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
