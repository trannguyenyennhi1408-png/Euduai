import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Users, Play, CheckCircle2, XCircle, Trophy, Zap, HelpCircle, ArrowRight, ArrowLeft, LogOut, MessageCircle, Heart, Link, BookOpen } from 'lucide-react';
import AITutor from './AITutor';
import Swal from 'sweetalert2';

export default function RoomView({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { currentUser, rooms, quizzes, startRoom, nextQuestion, endRoom, submitAnswer, usePowerUp, finishHomework } = useStore();
  const room = rooms[roomId];
  const quiz = quizzes.find(q => q.id === room?.quizId);
  const isTeacher = currentUser?.role === 'teacher';
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [showAITutor, setShowAITutor] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isDoubleScoreActive, setIsDoubleScoreActive] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);

  const participant = Object.values(room?.participants || {}).find(p => p.name === currentUser?.name);
  
  const [localQuestionIndex, setLocalQuestionIndex] = useState(() => {
    if (room?.gameMode === 'homework' && participant && quiz) {
      const answeredCount = Object.keys(participant.answers).length;
      return Math.min(answeredCount, quiz.questions.length - 1);
    }
    return 0;
  });
  
  const activeQuestionIndex = room?.gameMode === 'homework' && !isTeacher ? localQuestionIndex : (room?.currentQuestionIndex || 0);
  const currentQuestion = quiz?.questions[activeQuestionIndex];
  
  const hasAnswered = participant?.answers[currentQuestion?.id || ''] !== undefined;
  const isCorrect = hasAnswered && participant?.answers[currentQuestion?.id || ''] === currentQuestion?.correctAnswer;

  useEffect(() => {
    if (room?.status === 'playing' && !hasAnswered && timeLeft > 0 && room?.gameMode !== 'homework') {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !hasAnswered && !isTeacher && room?.gameMode !== 'homework') {
      // Auto submit wrong answer if time runs out
      submitAnswer(roomId, currentQuestion!.id, -1, false, 0);
    }
  }, [room?.status, timeLeft, hasAnswered, isTeacher, roomId, currentQuestion, submitAnswer, room?.gameMode]);

  // Reset state when question changes
  useEffect(() => {
    setTimeLeft(30);
    setSelectedAnswer(null);
    setIsDoubleScoreActive(false);
    setEliminatedOptions([]);
    setShowAITutor(false);
  }, [activeQuestionIndex]);

  if (!room || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Lỗi phòng thi</h2>
          <p className="text-slate-500 mb-6">Phòng thi hoặc bộ câu hỏi không còn tồn tại.</p>
          <button
            onClick={onLeave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const handleStart = () => startRoom(roomId);
  const handleNext = () => nextQuestion(roomId);
  const handleEnd = () => endRoom(roomId);

  const handleAnswer = (index: number) => {
    if (hasAnswered || eliminatedOptions.includes(index) || participant?.isEliminated) return;
    setSelectedAnswer(index);
    submitAnswer(roomId, currentQuestion!.id, index, isDoubleScoreActive, timeLeft);
  };

  const handleFiftyFifty = () => {
    if (!participant || participant.powerUps.fiftyFifty <= 0 || hasAnswered || !currentQuestion) return;
    usePowerUp(roomId, 'fiftyFifty');
    
    // Eliminate 2 wrong options
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctAnswer);
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    setEliminatedOptions(shuffled.slice(0, 2));
    Swal.fire('Đã dùng 50/50', 'Đã loại bỏ 2 phương án sai!', 'success');
  };

  const handleDoubleScore = () => {
    if (!participant || participant.powerUps.doubleScore <= 0 || hasAnswered) return;
    usePowerUp(roomId, 'doubleScore');
    setIsDoubleScoreActive(true);
    Swal.fire('Đã dùng x2 Điểm', 'Câu trả lời đúng tiếp theo sẽ được nhân đôi điểm!', 'success');
  };

  const sortedLeaderboard = Object.values(room.participants).sort((a, b) => b.score - a.score);

  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-300">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{quiz.title}</h1>
          <p className="text-slate-500 mb-8">Phòng chờ thi đấu</p>
          
          <div className="bg-slate-100 rounded-2xl p-8 mb-8 inline-block">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Mã phòng</p>
            <p className="text-6xl font-mono font-bold text-orange-500 tracking-[0.2em]">{room.code}</p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-slate-600 mb-8">
            <Users className="w-5 h-5" />
            <span className="font-medium">{Object.keys(room.participants).length} người đã tham gia</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Object.values(room.participants).map(p => (
              <span key={p.id} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium text-sm animate-in fade-in slide-in-from-bottom-2">
                {p.name}
              </span>
            ))}
          </div>

          {isTeacher ? (
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1"
            >
              Bắt đầu ngay
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-3 text-orange-500 bg-orange-50 p-4 rounded-xl">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
              <span className="font-medium">Đang chờ giáo viên bắt đầu...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isTeacher && room.gameMode === 'homework') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-8 text-center text-white relative">
              <button onClick={onLeave} title="Quay lại trang chủ" className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={handleEnd} title="Kết thúc bài tập" className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-red-500/80 rounded-full transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-emerald-100" />
              <h1 className="text-3xl font-bold mb-2">Tiến độ bài tập</h1>
              <p className="text-white/80">{quiz.title}</p>
              
              <div className="mt-6 bg-white/20 rounded-2xl p-6 inline-block backdrop-blur-sm">
                <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider mb-2">Mã phòng / Link bài tập</p>
                <p className="text-4xl font-mono font-bold text-white tracking-widest mb-4">{room.code}</p>
                <div className="flex items-center justify-center space-x-2 text-sm bg-black/20 px-4 py-2 rounded-lg">
                  <Link className="w-4 h-4" />
                  <span className="truncate max-w-xs">{window.location.origin}?room={room.code}</span>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Users className="w-6 h-6 mr-2 text-emerald-500" />
                Danh sách học sinh ({Object.keys(room.participants).length})
              </h2>
              
              <div className="space-y-4">
                {sortedLeaderboard.map((p, index) => {
                  const progress = Math.round((Object.keys(p.answers).length / quiz.questions.length) * 100);
                  return (
                    <div key={p.id} className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mr-4">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mr-4">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-sm font-medium text-slate-500 w-12 text-right">{progress}%</span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-emerald-600">{p.score}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Điểm</div>
                      </div>
                    </div>
                  );
                })}
                
                {sortedLeaderboard.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có học sinh nào tham gia làm bài.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (room.status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 p-8 text-center text-white">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
              <h1 className="text-3xl font-bold mb-2">Kết quả chung cuộc</h1>
              <p className="text-white/80">{quiz.title}</p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {sortedLeaderboard.map((p, idx) => (
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${idx === 0 ? 'border-yellow-400 bg-yellow-50' : idx === 1 ? 'border-slate-300 bg-slate-50' : idx === 2 ? 'border-orange-300 bg-orange-50' : 'border-transparent bg-slate-50'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-200 text-slate-600'}`}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-lg text-slate-800">{p.name}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800">{p.score} <span className="text-sm text-slate-500 font-normal">điểm</span></div>
                  </div>
                ))}
                {sortedLeaderboard.length === 0 && (
                  <div className="text-center text-slate-500 py-8">Không có người chơi nào.</div>
                )}
              </div>
              
              <div className="mt-8 flex justify-center">
                <button onClick={onLeave} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                  Quay lại trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing State
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-slate-500">
            Câu {activeQuestionIndex + 1} / {quiz.questions.length}
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="text-sm font-bold text-slate-800">{quiz.title}</div>
        </div>
        <div className="flex items-center space-x-4">
          {!isTeacher && participant && room.gameMode === 'survival' && (
            <div className="flex items-center space-x-1 bg-red-50 px-3 py-1.5 rounded-lg">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-4 h-4 ${i < (participant.lives || 0) ? 'text-red-500 fill-current' : 'text-slate-300'}`} />
              ))}
            </div>
          )}
          {!isTeacher && participant && (
            <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-lg">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-orange-700">{participant.score}</span>
            </div>
          )}
          {room.gameMode !== 'homework' && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono font-bold ${timeLeft <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              {timeLeft}s
            </div>
          )}
          {isTeacher && (
            <button onClick={handleEnd} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Question & Answers */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-6 flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentQuestion?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion?.difficulty === 'easy' ? 'Dễ' : currentQuestion?.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-relaxed mb-8">
              {currentQuestion?.content}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
              {currentQuestion?.options.map((opt, idx) => {
                const isEliminated = eliminatedOptions.includes(idx);
                const isSelected = selectedAnswer === idx;
                const isCorrectOption = currentQuestion.correctAnswer === idx;
                
                let btnClass = "relative p-4 rounded-2xl border-2 text-left font-medium transition-all duration-200 flex items-center ";
                
                if (isEliminated || participant?.isEliminated) {
                  btnClass += "opacity-30 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400";
                } else if (hasAnswered || isTeacher) {
                  if (isCorrectOption) {
                    btnClass += "border-green-500 bg-green-50 text-green-800 shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 transform scale-[1.02]";
                  } else if (isSelected) {
                    btnClass += "border-red-500 bg-red-50 text-red-800";
                  } else {
                    btnClass += "border-slate-200 bg-white text-slate-500 opacity-50";
                  }
                } else {
                  btnClass += "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-1 hover:shadow-md cursor-pointer";
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered || isEliminated || isTeacher || participant?.isEliminated}
                    onClick={() => handleAnswer(idx)}
                    className={btnClass}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold ${
                      hasAnswered && isCorrectOption ? 'bg-green-500 text-white' :
                      hasAnswered && isSelected ? 'bg-red-500 text-white' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{opt}</span>
                    {hasAnswered && isCorrectOption && <CheckCircle2 className="w-6 h-6 text-green-500 ml-2" />}
                    {hasAnswered && isSelected && !isCorrectOption && <XCircle className="w-6 h-6 text-red-500 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post-Answer Actions & Explanation */}
          {(hasAnswered || isTeacher) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Giải thích đáp án
                </h3>
                <div className="flex space-x-3 w-full sm:w-auto">
                  {!isTeacher && (
                    <button
                      onClick={() => setShowAITutor(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Hỏi AI Tutor
                    </button>
                  )}
                  {(isTeacher || (!isTeacher && room.gameMode === 'homework')) && (
                    <button
                      onClick={() => {
                        if (!isTeacher && room.gameMode === 'homework') {
                          if (localQuestionIndex < quiz.questions.length - 1) {
                            setLocalQuestionIndex(prev => prev + 1);
                          } else {
                            // Finish homework
                            finishHomework(roomId);
                            Swal.fire({
                              title: 'Hoàn thành!',
                              text: 'Bạn đã hoàn thành bài tập. Điểm của bạn: ' + participant?.score,
                              icon: 'success'
                            }).then(() => {
                              onLeave();
                            });
                          }
                        } else {
                          handleNext();
                        }
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md"
                    >
                      {(!isTeacher && room.gameMode === 'homework' && localQuestionIndex === quiz.questions.length - 1) ? 'Hoàn thành' : 'Câu tiếp theo'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {currentQuestion?.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard & Power-ups */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {!isTeacher && participant && !hasAnswered && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Vật phẩm hỗ trợ</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFiftyFifty}
                  disabled={participant.powerUps.fiftyFifty <= 0}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative mb-1">
                    <HelpCircle className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {participant.powerUps.fiftyFifty}
                    </span>
                  </div>
                  <span className="text-xs font-bold">50/50</span>
                </button>
                <button
                  onClick={handleDoubleScore}
                  disabled={participant.powerUps.doubleScore <= 0 || isDoubleScoreActive}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDoubleScoreActive ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                  }`}
                >
                  <div className="relative mb-1">
                    <Zap className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {participant.powerUps.doubleScore}
                    </span>
                  </div>
                  <span className="text-xs font-bold">x2 Điểm</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
              Bảng xếp hạng
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {sortedLeaderboard.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-sm text-slate-700 truncate max-w-[100px]">{p.name}</span>
                  </div>
                  <span className="font-bold text-sm text-slate-800">{p.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {showAITutor && currentQuestion && (
        <AITutor
          questionContent={currentQuestion.content}
          correctAnswerText={currentQuestion.options[currentQuestion.correctAnswer]}
          explanation={currentQuestion.explanation}
          onClose={() => setShowAITutor(false)}
        />
      )}

      {participant?.isEliminated && !isTeacher && room.status === 'playing' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bạn đã bị loại!</h2>
            <p className="text-slate-500 mb-6">Rất tiếc, bạn đã hết mạng. Hãy chờ xem kết quả chung cuộc nhé.</p>
            <div className="text-4xl font-bold text-orange-500">{participant.score} <span className="text-lg text-slate-500">điểm</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
