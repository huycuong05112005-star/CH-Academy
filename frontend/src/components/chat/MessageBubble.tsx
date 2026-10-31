import React from 'react'
import { Copy, Check, Sparkles, User, FileText } from 'lucide-react'
import { RichMarkdownRenderer } from './RichMarkdownRenderer'
import type { AiChatSourceCitation } from '../../types/chat'

interface MessageBubbleProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  sources?: AiChatSourceCitation[]
  senderName?: string
  isMe?: boolean
  copiedId?: string | null
  onCopy?: (text: string, id: string) => void
  agentTitle?: string
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  role,
  content,
  createdAt,
  sources,
  senderName,
  isMe,
  copiedId,
  onCopy,
  agentTitle = 'AI Trợ lý'
}) => {
  const isUser = role === 'user' || isMe === true

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}>
      {senderName && !isMe && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
          {senderName}
        </span>
      )}

      <div className={`flex items-start gap-2 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </div>

        {/* Content Box */}
        <div
          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-colors ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap font-medium">{content}</div>
          ) : (
            <RichMarkdownRenderer content={content} />
          )}

          {/* Source Citations */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-500" />
                Căn cứ tài liệu hệ thống:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {sources.map((s, idx) => (
                  <span
                    key={idx}
                    title={s.snippet || s.documentName}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <span>{s.documentName}</span>
                    {s.section && <span className="opacity-75">({s.section})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className={`flex items-center justify-between gap-2 mt-1.5 pt-1 text-[10px] ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
            <span>{createdAt || ''}</span>
            {!isUser && onCopy && (
              <button
                type="button"
                onClick={() => onCopy(content, id)}
                title="Sao chép nội dung"
                className="opacity-70 hover:opacity-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              >
                {copiedId === id ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
