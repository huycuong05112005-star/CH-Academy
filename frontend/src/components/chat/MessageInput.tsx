import React, { useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'

interface MessageInputProps {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  onToggleVoice?: () => void
  isListening?: boolean
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Nhập tin nhắn...',
  disabled = false,
  loading = false,
  onToggleVoice,
  isListening = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !loading && !disabled) {
        onSend()
      }
    }
  }

  return (
    <div className="p-3 bg-white dark:bg-[#151F31] border-t border-slate-200/80 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder={isListening ? 'Đang lắng nghe giọng nói của bạn...' : placeholder}
          className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
        />

        {/* Nút Mic nhập giọng nói STT */}
        {onToggleVoice && (
          <button
            type="button"
            onClick={onToggleVoice}
            disabled={disabled}
            title={isListening ? 'Dừng thu âm' : 'Nhập bằng giọng nói (Tiếng Việt)'}
            className={`p-1.5 rounded-xl transition ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* Nút gửi tin nhắn */}
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || loading || disabled}
          className={`p-2 rounded-xl text-white transition shadow-sm ${
            !value.trim() || loading || disabled
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
          title="Gửi tin nhắn (Enter)"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

