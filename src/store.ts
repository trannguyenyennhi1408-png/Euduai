import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Role, User, Quiz, Question, Room, Participant } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const DEMO_QUIZ: Quiz = {
  id: 'demo-quiz-1',
  teacherId: 'demo-teacher',
  title: 'Kiểm tra 15 phút Lịch Sử 12',
  createdAt: Date.now(),
  questions: [
    {
      id: 'q1',
      content: 'Chiến dịch Điện Biên Phủ kết thúc thắng lợi vào ngày tháng năm nào?',
      options: ['07/05/1954', '30/04/1975', '02/09/1945', '19/08/1945'],
      correctAnswer: 0,
      explanation: 'Chiến dịch Điện Biên Phủ kết thúc thắng lợi vào chiều ngày 7/5/1954 khi tướng De Castries cùng toàn bộ Bộ tham mưu tập đoàn cứ điểm Điện Biên Phủ bị bắt sống.',
      difficulty: 'easy'
    },
    {
      id: 'q2',
      content: 'Ai là người cắm lá cờ chiến thắng trên nóc hầm Đờ Cát?',
      options: ['Tô Vĩnh Diện', 'Bế Văn Đàn', 'Tạ Quốc Luật', 'Phan Đình Giót'],
      correctAnswer: 2,
      explanation: 'Tạ Quốc Luật là người chỉ huy tổ xung kích bắt sống tướng De Castries và cắm lá cờ "Quyết chiến Quyết thắng" trên nóc hầm.',
      difficulty: 'medium'
    }
  ]
};

const DEMO_USER: User = {
  id: 'demo-teacher',
  name: 'Giáo viên Demo',
  role: 'teacher',
  streakDays: 5,
  totalScore: 0
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [DEMO_USER],
      currentUser: null,
      quizzes: [DEMO_QUIZ],
      rooms: {},
      apiKey: '',

      setApiKey: (key) => set({ apiKey: key }),

      login: (name, role) => {
        const existingUser = get().users.find(u => u.name === name);
        if (existingUser) {
          if (role === 'teacher') {
            throw new Error('Tên đã tồn tại, hãy đặt tên khác');
          }
          set({ currentUser: existingUser });
        } else {
          const newUser: User = { id: generateId(), name, role, streakDays: 0, totalScore: 0 };
          set(state => ({ users: [...state.users, newUser], currentUser: newUser }));
        }
      },

      logout: () => set({ currentUser: null }),

      createQuiz: (title, questions) => {
        const user = get().currentUser;
        if (!user || user.role !== 'teacher') return;
        const newQuiz: Quiz = {
          id: generateId(),
          teacherId: user.id,
          title,
          questions,
          createdAt: Date.now(),
        };
        set(state => ({ quizzes: [...state.quizzes, newQuiz] }));
      },

      deleteQuiz: (id) => {
        set(state => ({ quizzes: state.quizzes.filter(q => q.id !== id) }));
      },

      createRoom: (quizId, gameMode = 'standard') => {
        const user = get().currentUser;
        if (!user || user.role !== 'teacher') return '';
        const code = generateRoomCode();
        const newRoom: Room = {
          id: generateId(),
          code,
          teacherId: user.id,
          quizId,
          status: gameMode === 'homework' ? 'playing' : 'waiting',
          participants: {},
          currentQuestionIndex: 0,
          gameMode,
        };
        set(state => ({ rooms: { ...state.rooms, [newRoom.id]: newRoom } }));
        return newRoom.id;
      },

      startRoom: (roomId) => {
        set(state => ({
          rooms: {
            ...state.rooms,
            [roomId]: { ...state.rooms[roomId], status: 'playing', startedAt: Date.now() },
          },
        }));
      },

      nextQuestion: (roomId) => {
        set(state => {
          const room = state.rooms[roomId];
          const quiz = state.quizzes.find(q => q.id === room.quizId);
          if (!quiz) return state;
          
          if (room.currentQuestionIndex < quiz.questions.length - 1) {
            return {
              rooms: {
                ...state.rooms,
                [roomId]: { ...room, currentQuestionIndex: room.currentQuestionIndex + 1 },
              },
            };
          } else {
            return {
              rooms: {
                ...state.rooms,
                [roomId]: { ...room, status: 'finished' },
              },
            };
          }
        });
      },

      endRoom: (roomId) => {
        set(state => {
          const room = state.rooms[roomId];
          if (!room) return state;

          // Update streak for all participants
          const updatedUsers = state.users.map(u => {
            const participant = Object.values(room.participants).find(p => p.name === u.name);
            if (participant && !participant.isFinished) {
              return { ...u, streakDays: u.streakDays + 1 };
            }
            return u;
          });

          const updatedCurrentUser = state.currentUser 
            ? updatedUsers.find(u => u.id === state.currentUser!.id) || state.currentUser
            : null;

          return {
            users: updatedUsers,
            currentUser: updatedCurrentUser,
            rooms: {
              ...state.rooms,
              [roomId]: { ...room, status: 'finished' },
            },
          };
        });
      },

      joinRoom: (code, name) => {
        const room = Object.values(get().rooms).find(r => r.code === code && r.status !== 'finished');
        if (!room) return null;

        const existingParticipant = Object.values(room.participants).find(p => p.name === name);
        if (existingParticipant) {
          if (existingParticipant.isFinished) return null;
          return existingParticipant.id;
        }

        const participantId = generateId();
        const newParticipant: Participant = {
          id: participantId,
          name,
          score: 0,
          answers: {},
          powerUps: { fiftyFifty: 1, doubleScore: 1 },
          lives: room.gameMode === 'survival' ? 3 : undefined,
          isEliminated: false,
        };

        set(state => ({
          rooms: {
            ...state.rooms,
            [room.id]: {
              ...state.rooms[room.id],
              participants: {
                ...state.rooms[room.id].participants,
                [participantId]: newParticipant,
              },
            },
          },
        }));

        return participantId;
      },

      submitAnswer: (roomId, questionId, answerIndex, isDoubleScore = false, timeRemaining = 30) => {
        const user = get().currentUser;
        if (!user) return;
        
        set(state => {
          const room = state.rooms[roomId];
          const quiz = state.quizzes.find(q => q.id === room.quizId);
          if (!room || !quiz) return state;

          const question = quiz.questions.find(q => q.id === questionId);
          if (!question) return state;

          const isCorrect = question.correctAnswer === answerIndex;
          
          let points = 0;
          if (isCorrect) {
            if (room.gameMode === 'speed') {
              points = Math.floor((timeRemaining / 30) * 20) + 10; // 10 to 30 points
            } else {
              points = 10;
            }
            if (isDoubleScore) points *= 2;
          }

          // Find participant by name (since currentUser is used for login, but participant ID is generated on join)
          // For simplicity, we'll assume the participant name matches the current user name
          const participantEntry = Object.entries(room.participants).find(([_, p]) => p.name === user.name);
          if (!participantEntry) return state;
          
          const [participantId, participant] = participantEntry;

          let lives = participant.lives;
          let isEliminated = participant.isEliminated;

          if (room.gameMode === 'survival' && !isCorrect && answerIndex !== -1) {
            lives = Math.max(0, (lives || 0) - 1);
            if (lives === 0) {
              isEliminated = true;
            }
          } else if (room.gameMode === 'survival' && answerIndex === -1) {
             // Timeout in survival mode also loses a life
             lives = Math.max(0, (lives || 0) - 1);
             if (lives === 0) {
               isEliminated = true;
             }
          }

          return {
            users: state.users.map(u => u.id === user.id ? { ...u, totalScore: u.totalScore + points } : u),
            currentUser: state.currentUser?.id === user.id ? { ...state.currentUser, totalScore: state.currentUser.totalScore + points } : state.currentUser,
            rooms: {
              ...state.rooms,
              [roomId]: {
                ...room,
                participants: {
                  ...room.participants,
                  [participantId]: {
                    ...participant,
                    score: participant.score + points,
                    lives,
                    isEliminated,
                    answers: {
                      ...participant.answers,
                      [questionId]: answerIndex,
                    },
                  },
                },
              },
            },
          };
        });
      },

      finishHomework: (roomId) => {
        const user = get().currentUser;
        if (!user) return;

        set(state => {
          const room = state.rooms[roomId];
          if (!room) return state;

          const participantEntry = Object.entries(room.participants).find(([_, p]) => p.name === user.name);
          if (!participantEntry) return state;
          
          const [participantId, participant] = participantEntry;

          const updatedUsers = state.users.map(u => {
            if (u.name === user.name) {
              return { ...u, streakDays: u.streakDays + 1 };
            }
            return u;
          });

          return {
            users: updatedUsers,
            currentUser: updatedUsers.find(u => u.id === state.currentUser?.id) || state.currentUser,
            rooms: {
              ...state.rooms,
              [roomId]: {
                ...room,
                participants: {
                  ...room.participants,
                  [participantId]: {
                    ...participant,
                    isFinished: true,
                  },
                },
              },
            },
          };
        });
      },

      usePowerUp: (roomId, type) => {
        const user = get().currentUser;
        if (!user) return;

        set(state => {
          const room = state.rooms[roomId];
          if (!room) return state;

          const participantEntry = Object.entries(room.participants).find(([_, p]) => p.name === user.name);
          if (!participantEntry) return state;
          
          const [participantId, participant] = participantEntry;

          if (participant.powerUps[type] <= 0) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomId]: {
                ...room,
                participants: {
                  ...room.participants,
                  [participantId]: {
                    ...participant,
                    powerUps: {
                      ...participant.powerUps,
                      [type]: participant.powerUps[type] - 1,
                    },
                  },
                },
              },
            },
          };
        });
      },
    }),
    {
      name: 'eduai-storage',
    }
  )
);

// Cross-tab and WebSocket synchronization
if (typeof window !== 'undefined') {
  let ws: WebSocket | null = null;
  let isUpdatingFromServer = false;

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SYNC' && data.state) {
          isUpdatingFromServer = true;
          useStore.setState(state => ({
            ...state,
            users: data.state.users || state.users,
            quizzes: data.state.quizzes || state.quizzes,
            rooms: data.state.rooms || state.rooms,
            lastUpdated: data.state.lastUpdated
          }));
          isUpdatingFromServer = false;
        } else if (data.type === 'REQUEST_STATE') {
          const state = useStore.getState();
          const sharedState = {
            users: state.users,
            quizzes: state.quizzes,
            rooms: state.rooms,
            lastUpdated: state.lastUpdated || 0
          };
          ws?.send(JSON.stringify({ type: 'UPDATE', state: sharedState }));
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };
  };

  connectWebSocket();

  // Listen to local state changes and broadcast
  useStore.subscribe((state, prevState) => {
    if (!isUpdatingFromServer && ws?.readyState === WebSocket.OPEN) {
      if (state.lastUpdated === prevState.lastUpdated) {
        const newLastUpdated = Date.now();
        isUpdatingFromServer = true;
        useStore.setState({ lastUpdated: newLastUpdated });
        isUpdatingFromServer = false;

        const sharedState = {
          users: state.users,
          quizzes: state.quizzes,
          rooms: state.rooms,
          lastUpdated: newLastUpdated
        };
        ws.send(JSON.stringify({ type: 'UPDATE', state: sharedState }));
      }
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'eduai-storage') {
      try {
        const newState = JSON.parse(e.newValue || '{}');
        if (newState.state) {
          isUpdatingFromServer = true;
          useStore.setState(state => ({
            ...state,
            users: newState.state.users || state.users,
            quizzes: newState.state.quizzes || state.quizzes,
            rooms: newState.state.rooms || state.rooms,
            lastUpdated: newState.state.lastUpdated
          }));
          isUpdatingFromServer = false;
        }
      } catch (err) {
        console.error('Failed to sync state across tabs', err);
      }
    }
  });
}
