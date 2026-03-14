import { GoogleGenAI, Type } from '@google/genai';
import { useStore } from '../store';
import { Question } from '../types';

const MODELS = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'];

export async function generateQuizFromText(text: string): Promise<Question[] | null> {
  const apiKey = useStore.getState().apiKey;
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key trong phần Cài đặt.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Bạn là một chuyên gia giáo dục. Hãy tạo một bộ câu hỏi trắc nghiệm từ tài liệu sau.
Tài liệu: ${text}
Yêu cầu:
- Tạo ít nhất 5 câu hỏi.
- Phân bổ độ khó: Dễ, Trung bình, Khó.
- Mỗi câu hỏi có 4 đáp án.
- Giải thích chi tiết tại sao đáp án đó đúng.
`;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING, description: 'Nội dung câu hỏi' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Danh sách 4 đáp án (A, B, C, D)',
                },
                correctAnswer: { type: Type.INTEGER, description: 'Chỉ số của đáp án đúng (0, 1, 2, hoặc 3)' },
                explanation: { type: Type.STRING, description: 'Giải thích chi tiết tại sao đáp án này đúng' },
                difficulty: { type: Type.STRING, description: 'Độ khó: easy, medium, hoặc hard' },
              },
              required: ['content', 'options', 'correctAnswer', 'explanation', 'difficulty'],
            },
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const questions = JSON.parse(jsonStr);
        return questions.map((q: any) => ({
          ...q,
          id: Math.random().toString(36).substr(2, 9),
        }));
      }
    } catch (error: any) {
      console.error(`Lỗi với model ${model}:`, error);
      if (error.status === 429) {
        continue; // Thử model tiếp theo
      }
      throw error;
    }
  }
  
  throw new Error('Không thể tạo câu hỏi. Vui lòng thử lại sau.');
}

export async function askAITutor(questionContent: string, correctAnswerText: string, explanation: string, studentQuery: string): Promise<string> {
  const apiKey = useStore.getState().apiKey;
  if (!apiKey) {
    return 'Vui lòng nhập API Key để sử dụng AI Tutor.';
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Bạn là một gia sư AI thân thiện, nhiệt tình và giỏi chuyên môn.
Học sinh đang thắc mắc về câu hỏi sau: "${questionContent}"
Đáp án đúng là: "${correctAnswerText}"
Giải thích gốc: "${explanation}"

Câu hỏi của học sinh: "${studentQuery}"

Hãy trả lời ngắn gọn, dễ hiểu, mang tính khích lệ và tập trung vào việc giải đáp thắc mắc của học sinh. Sử dụng tiếng Việt tự nhiên.`;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text || 'Xin lỗi, tôi không thể trả lời lúc này.';
    } catch (error: any) {
      if (error.status === 429) continue;
      console.error('Lỗi AI Tutor:', error);
      return 'Có lỗi xảy ra khi kết nối với AI Tutor.';
    }
  }
  return 'Hệ thống AI đang quá tải, vui lòng thử lại sau.';
}
