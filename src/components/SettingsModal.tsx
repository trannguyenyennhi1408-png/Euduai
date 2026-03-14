import React, { useState } from 'react';
import { useStore } from '../store';
import { Key, X } from 'lucide-react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey } = useStore();
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiKey(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Key className="w-5 h-5 mr-2 text-blue-500" />
            Cài đặt API Key
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Để sử dụng tính năng tạo câu hỏi tự động và AI Tutor, bạn cần nhập Gemini API Key.
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 font-mono text-sm"
                placeholder="AIzaSy..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                {showKey ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
