import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Radio,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react'
import { aiChatApi } from '../../api/chat'

export interface AiVoiceCallProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  agentRole?: string
  agentAvatar?: string
  agentCode?: string
  portal: 'PUBLIC' | 'STUDENT' | 'TEACHER' | 'ADMIN'
  conversationId?: number | null
  guestSessionId?: string
  onMessageLogged?: (userText: string, aiText: string) => void
}

type CallStatus = 'CONNECTING' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'MUTED' | 'ERROR'

export const AiVoiceCallModal: React.FC<AiVoiceCallProps> = ({
  isOpen,
  onClose,
  agentName,
  agentRole = 'Trợ lý AI',
  agentCode = 'AGENT_ADMISSIONS',
  portal,
  conversationId,
  guestSessionId,
  onMessageLogged
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('CONNECTING')
  const [isMuted, setIsMuted] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState('')
  const [aiSpeechSubtitles, setAiSpeechSubtitles] = useState('')
  const [recentTranscripts, setRecentTranscripts] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])

  // Audio Context & Visualizer Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null)
  const isComponentMounted = useRef(true)

  // 1. Quản lý thời lượng cuộc gọi (Timer)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isOpen && callStatus !== 'ERROR' && callStatus !== 'CONNECTING') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, callStatus])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 2. Phát âm thanh phản hồi AI qua Web SpeechSynthesis (TTS)
  const speakAiResponse = useCallback((text: string) => {
    if (!speakerEnabled || !('speechSynthesis' in window)) {
      setCallStatus('LISTENING')
      return
    }

    try {
      window.speechSynthesis.cancel()
      const cleanText = text.replace(/[*#_`>]/g, '').trim()
      setAiSpeechSubtitles(cleanText)

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'vi-VN'
      utterance.rate = 1.05
      utterance.pitch = 1.0

      const voices = window.speechSynthesis.getVoices()
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VN'))
      if (viVoice) {
        utterance.voice = viVoice
      }

      utterance.onstart = () => {
        if (isComponentMounted.current) setCallStatus('SPEAKING')
      }

      utterance.onend = () => {
        if (isComponentMounted.current) {
          setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
          // Khởi động lại nhận diện giọng nói khi AI nói xong
          if (recognitionRef.current && !isMuted) {
            try {
              recognitionRef.current.start()
            } catch {
              // Bỏ qua nếu đã active
            }
          }
        }
      }

      utterance.onerror = () => {
        if (isComponentMounted.current) setCallStatus('LISTENING')
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      setCallStatus('LISTENING')
    }
  }, [speakerEnabled, isMuted])

  // 3. Gửi câu nói của người dùng tới Backend AI Agent
  const processUserSpeech = useCallback(async (speechText: string) => {
    if (!speechText.trim()) return

    setCallStatus('PROCESSING')
    setRecentTranscripts((prev) => [...prev, { role: 'user', text: speechText }])

    try {
      let answer = ''
      if (portal === 'PUBLIC') {
        const res = await aiChatApi.askPublicAi({
          message: speechText,
          sessionId: guestSessionId || 'voice_session_' + Date.now(),
          agentCode
        })
        if (res.success && res.data) {
          answer = res.data.answer
        }
      } else {
        const res = await aiChatApi.askAi({
          message: speechText,
          portal,
          agentCode,
          conversationId: conversationId || undefined
        })
        if (res.success && res.data) {
          answer = res.data.answer
        }
      }

      if (!answer) {
        answer = 'Xin lỗi, tôi chưa nghe rõ câu hỏi của bạn. Bạn vui lòng nhắc lại được không ạ?'
      }

      setRecentTranscripts((prev) => [...prev, { role: 'assistant', text: answer }])
      if (onMessageLogged) {
        onMessageLogged(speechText, answer)
      }

      speakAiResponse(answer)
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI'
      setRecentTranscripts((prev) => [...prev, { role: 'assistant', text: errText }])
      setCallStatus('LISTENING')
    }
  }, [portal, guestSessionId, agentCode, conversationId, onMessageLogged, speakAiResponse])

  // 4. Khởi tạo Web Audio Analyser & Real Microphone Visualizer
  const initAudioVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      // Vẽ sóng âm thanh thực tế trên Canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const drawVisualizer = () => {
          if (!isComponentMounted.current) return
          animationFrameRef.current = requestAnimationFrame(drawVisualizer)

          analyser.getByteFrequencyData(dataArray)

          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const barWidth = (canvas.width / bufferLength) * 2.2
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * canvas.height * 0.9

              // Gradient hiện đại (Indigo -> Cyan -> Emerald)
              const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
              gradient.addColorStop(0, '#6366f1')
              gradient.addColorStop(0.5, '#06b6d4')
              gradient.addColorStop(1, '#10b981')

              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.roundRect(x, canvas.height - barHeight, barWidth - 3, barHeight, [4, 4, 0, 0])
              ctx.fill()

              x += barWidth
            }
          }
        }
        drawVisualizer()
      }

      return true
    } catch (err: unknown) {
      console.warn('Microphone permission denied or unavailable:', err)
      setErrorMessage('Không thể truy cập Microphone. Vui lòng cho phép quyền ghi âm trên trình duyệt để gọi thoại với AI.')
      setCallStatus('ERROR')
      return false
    }
  }, [])

  // 5. Khởi tạo Speech Recognition (STT tiếng Việt)
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage('Trình duyệt chưa hỗ trợ Web Speech API nhận diện giọng nói. Bạn nên sử dụng Google Chrome hoặc Microsoft Edge để gọi AI.')
      setCallStatus('ERROR')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      if (isComponentMounted.current) {
        setCallStatus('LISTENING')
        setUserTranscript('')
      }
    }

    recognition.onresult = (event: any) => {
      let finalStr = ''
      let interimStr = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalStr += transcript
        } else {
          interimStr += transcript
        }
      }

      const display = finalStr || interimStr
      setUserTranscript(display)

      if (finalStr.trim()) {
        processUserSpeech(finalStr.trim())
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition event:', event.error)
      }
    }

    recognition.onend = () => {
      // Tự động lắng nghe tiếp nếu đang không trong trạng thái SPEAKING hoặc MUTED
      if (isComponentMounted.current && callStatus === 'LISTENING' && !isMuted) {
        try {
          recognition.start()
        } catch {
          // Bỏ qua lỗi restart
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      // Ignored
    }
  }, [callStatus, isMuted, processUserSpeech])

  // 6. Lifecycle khi mở/đóng Modal cuộc gọi
  useEffect(() => {
    isComponentMounted.current = true
    if (isOpen) {
      setCallStatus('CONNECTING')
      setCallDuration(0)
      setErrorMessage(null)
      setUserTranscript('')
      setAiSpeechSubtitles('')
      setRecentTranscripts([])

      initAudioVisualizer().then((ok) => {
        if (ok && isComponentMounted.current) {
          initSpeechRecognition()
          // Lời chào mở đầu cuộc gọi từ AI
          const greeting =
            portal === 'PUBLIC'
              ? 'Xin chào! Tôi là Trợ lý Tuyển sinh AI của CH Academy. Tôi đang lắng nghe bạn, bạn cần tư vấn khóa học nào ạ?'
              : portal === 'TEACHER'
              ? 'Chào thầy cô! Tôi là Trợ lý Giảng dạy AI của CH Academy. Thầy cô cần hỗ trợ chuẩn bị tài liệu hay tra cứu lớp học nào ạ?'
              : portal === 'ADMIN'
              ? 'Chào Quản trị viên! Tôi là Trợ lý Quản trị AI. Tôi sẵn sàng báo cáo số liệu và hỗ trợ nghiệp vụ cho bạn.'
              : 'Chào bạn! Tôi là Trợ giảng AI cá nhân của bạn. Bạn muốn ôn tập bài học hay giải đáp thắc mắc nào hôm nay?'

          setRecentTranscripts([{ role: 'assistant', text: greeting }])
          speakAiResponse(greeting)
        }
      })
    } else {
      // Dọn dẹp tài nguyên khi đóng modal
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      isComponentMounted.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, initAudioVisualizer, initSpeechRecognition, portal, speakAiResponse])

  // Ngắt lời AI (Interrupt Speech)
  const handleInterruptAi = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setCallStatus('LISTENING')
    if (recognitionRef.current && !isMuted) {
      try {
        recognitionRef.current.start()
      } catch {}
    }
  }

  // Bật/tắt Micro
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setCallStatus('LISTENING')
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {}
      }
    } else {
      setIsMuted(true)
      setCallStatus('MUTED')
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false))
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }

  // Kết thúc cuộc gọi
  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Nút đóng góc trên */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
          title="Đóng cuộc gọi"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Thông tin Agent & Thời lượng */}
        <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center border-b border-slate-800/80">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <Sparkles className="w-9 h-9 text-indigo-400 animate-pulse" />
              </div>
            </div>
            {/* Status Pulse Dot */}
            <span
              className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                callStatus === 'SPEAKING'
                  ? 'bg-emerald-400 animate-ping'
                  : callStatus === 'LISTENING'
                  ? 'bg-sky-400 animate-pulse'
                  : callStatus === 'MUTED'
                  ? 'bg-amber-400'
                  : callStatus === 'ERROR'
                  ? 'bg-rose-500'
                  : 'bg-indigo-400'
              }`}
            />
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white mb-0.5">{agentName}</h3>
          <p className="text-xs text-indigo-300 font-medium mb-2">{agentRole}</p>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDuration(callDuration)}</span>
            <span className="text-slate-500">•</span>
            <span
              className={`font-semibold ${
                callStatus === 'SPEAKING'
                  ? 'text-emerald-400'
                  : callStatus === 'LISTENING'
                  ? 'text-sky-400'
                  : callStatus === 'MUTED'
                  ? 'text-amber-400'
                  : callStatus === 'PROCESSING'
                  ? 'text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              {callStatus === 'SPEAKING'
                ? 'AI Đang nói...'
                : callStatus === 'LISTENING'
                ? 'Đang lắng nghe...'
                : callStatus === 'PROCESSING'
                ? 'Đang xử lý...'
                : callStatus === 'MUTED'
                ? 'Microphone tắt'
                : callStatus === 'CONNECTING'
                ? 'Đang kết nối...'
                : 'Lỗi thiết bị'}
            </span>
          </div>
        </div>

        {/* Audio Visualizer & Subtitles Body */}
        <div className="px-6 py-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Lỗi nếu có */}
          {errorMessage ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Không thể khởi tạo cuộc gọi Voice:</p>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Canvas Visualizer sóng âm thanh */}
              <div className="w-full h-20 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                <canvas ref={canvasRef} width={400} height={70} className="w-full h-full" />
              </div>

              {/* Khung phụ đề thời gian thực (Live Subtitles) */}
              <div className="min-h-[110px] max-h-[160px] overflow-y-auto rounded-2xl bg-slate-800/40 border border-slate-800 p-3.5 text-xs space-y-2">
                {userTranscript && (
                  <div className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-indigo-200">
                    <span className="font-bold text-indigo-400 block mb-0.5">Bạn đang nói:</span>
                    <p className="italic leading-relaxed">{userTranscript}</p>
                  </div>
                )}

                {aiSpeechSubtitles && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-200">
                    <span className="font-bold text-emerald-400 block mb-0.5">{agentName}:</span>
                    <p className="leading-relaxed">{aiSpeechSubtitles}</p>
                  </div>
                )}

                {!userTranscript && !aiSpeechSubtitles && recentTranscripts.length === 0 && (
                  <div className="text-center py-6 text-slate-500 italic">
                    Hãy nói trực tiếp vào Microphone. Trợ lý AI sẽ tự động lắng nghe và phản hồi bằng giọng nói...
                  </div>
                )}
              </div>
            </>
          )}

          {/* Nút Ngắt lời AI nếu AI đang nói */}
          {callStatus === 'SPEAKING' && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleInterruptAi}
                className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition shadow flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Ngắt lời AI để nói tiếp
              </button>
            </div>
          )}
        </div>

        {/* Footer Điều khiển cuộc gọi (Mute, Speaker, End) */}
        <div className="px-6 py-5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-around">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Bật Microphone' : 'Tắt Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-amber-400" /> : <Mic className="w-5 h-5 text-indigo-400" />}
            <span className="text-[10px] font-bold">{isMuted ? 'Bật Mic' : 'Tắt Mic'}</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="flex flex-col items-center gap-1.5 p-4 rounded-3xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 hover:scale-105 active:scale-95 transition"
            title="Kết thúc cuộc gọi thoại"
          >
            <PhoneOff className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Kết thúc</span>
          </button>

          {/* Speaker Sound Toggle */}
          <button
            type="button"
            onClick={() => setSpeakerEnabled(!speakerEnabled)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition ${
              !speakerEnabled
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={speakerEnabled ? 'Tắt loa' : 'Bật loa'}
          >
            {speakerEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-[10px] font-bold">{speakerEnabled ? 'Loa bật' : 'Loa tắt'}</span>
          </button>
        </div>

        {/* Security / Privacy notice */}
        <div className="py-2 px-4 bg-slate-950 text-center border-t border-slate-800/40 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Cuộc gọi đàm thoại AI được mã hóa và bảo mật ngữ cảnh theo phiên làm việc.</span>
        </div>
      </div>
    </div>
  )
}
