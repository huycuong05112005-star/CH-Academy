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
  X,
  Send,
  RotateCcw
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

export type CallStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'MUTED'
  | 'ERROR'
  | 'ENDED'

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
  const [micNotice, setMicNotice] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState('')
  const [aiSpeechSubtitles, setAiSpeechSubtitles] = useState('')
  const [textInput, setTextInput] = useState('')
  const [recentTranscripts, setRecentTranscripts] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; time: string }>
  >([])
  const [micLevel, setMicLevel] = useState(0) // 0..1 RMS

  // Audio Context & Visualizer Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const vadCounterRef = useRef(0)

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null)
  const isComponentMounted = useRef(true)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const scrollToTranscriptBottom = () => {
    if (typeof transcriptEndRef.current?.scrollIntoView === 'function') {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 1. Quản lý thời lượng cuộc gọi (Timer)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isOpen && callStatus !== 'ERROR' && callStatus !== 'CONNECTING' && callStatus !== 'ENDED') {
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

  // 2. Tự động ngắt lời AI (Barge-in / Interruption)
  const interruptAi = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setCallStatus((prev) => (prev === 'SPEAKING' || prev === 'PROCESSING' ? 'LISTENING' : prev))
    if (recognitionRef.current && !isMuted) {
      try {
        recognitionRef.current.start()
      } catch {
        // Ignored if already active
      }
    }
  }, [isMuted])

  // 3. Phát âm thanh phản hồi AI qua Web SpeechSynthesis (TTS)
  const speakAiResponse = useCallback(
    (text: string) => {
      if (!speakerEnabled || !('speechSynthesis' in window)) {
        setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
        return
      }

      try {
        window.speechSynthesis.cancel()
        const cleanText = text
          .replace(/https?:\/\/\S+/gu, '')
          .replace(/[*#_`>|~]+/gu, ' ')
          .replace(/\p{Extended_Pictographic}/gu, '')
          .replace(/\s+/gu, ' ')
          .trim()

        setAiSpeechSubtitles(cleanText)

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = 'vi-VN'
        utterance.rate = 1.05
        utterance.pitch = 1.0

        // Ưu tiên chọn giọng tiếng Việt chất lượng cao nếu trình duyệt hỗ trợ
        const voices = window.speechSynthesis.getVoices()
        const viVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes('vi') ||
            v.lang.toLowerCase().includes('vn') ||
            v.name.includes('Vietnamese')
        )
        if (viVoice) {
          utterance.voice = viVoice
        }

        utterance.onstart = () => {
          if (isComponentMounted.current) {
            setCallStatus('SPEAKING')
          }
        }

        utterance.onend = () => {
          if (isComponentMounted.current) {
            setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
            if (recognitionRef.current && !isMuted) {
              setTimeout(() => {
                try {
                  recognitionRef.current?.start()
                } catch {}
              }, 100)
            }
          }
        }

        utterance.onerror = () => {
          if (isComponentMounted.current) {
            setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
          }
        }

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.error('Lỗi phát âm thanh AI:', err)
        setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
      }
    },
    [speakerEnabled, isMuted]
  )

  // 4. Gửi câu nói của người dùng tới Backend AI Agent
  const processUserSpeech = useCallback(
    async (speechText: string) => {
      if (!speechText.trim()) return

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setCallStatus('PROCESSING')
      setUserTranscript('')
      setRecentTranscripts((prev) => [...prev, { role: 'user', text: speechText, time: timeStr }])
      setTimeout(scrollToTranscriptBottom, 50)

      try {
        let answer = ''
        if (portal === 'PUBLIC') {
          const res = await aiChatApi.askPublic({
            question: speechText,
            sessionId: guestSessionId || 'voice_guest_' + Date.now(),
            channel: 'VOICE',
            agentCode
          })
          if (res?.success && res.data) {
            answer = res.data.answer
          }
        } else {
          const res = await aiChatApi.ask({
            question: speechText,
            portal,
            channel: 'VOICE',
            agentCode,
            conversationId: conversationId || undefined
          })
          if (res?.success && res.data) {
            answer = res.data.answer
          }
        }

        if (!answer) {
          answer = 'Tôi đã nhận được câu hỏi. Bạn có thể nói chi tiết hơn để tôi giải đáp cụ thể hơn không?'
        }

        const aiTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setRecentTranscripts((prev) => [...prev, { role: 'assistant', text: answer, time: aiTimeStr }])
        setTimeout(scrollToTranscriptBottom, 50)

        if (onMessageLogged) {
          onMessageLogged(speechText, answer)
        }

        speakAiResponse(answer)
      } catch (err: unknown) {
        const errText = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI'
        setRecentTranscripts((prev) => [
          ...prev,
          { role: 'assistant', text: `[Lỗi]: ${errText}`, time: timeStr }
        ])
        setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
      }
    },
    [portal, guestSessionId, agentCode, conversationId, onMessageLogged, speakAiResponse, isMuted]
  )

  // 5. Khởi tạo Speech Recognition (STT tiếng Việt)
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMicNotice(
        'Trình duyệt chưa hỗ trợ Web Speech API trực tiếp. Bạn vẫn có thể nghe AI nói và nhập văn bản bên dưới.'
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        if (isComponentMounted.current && !isMuted) {
          setCallStatus('LISTENING')
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
          console.warn('Speech recognition notice:', event.error)
        }
        if (event.error === 'not-allowed') {
          setMicNotice('Microphone chưa được cấp quyền trên trình duyệt. Bạn có thể gõ câu hỏi phía dưới.')
        }
      }

      recognition.onend = () => {
        if (
          isComponentMounted.current &&
          !isMuted &&
          !window.speechSynthesis?.speaking &&
          callStatus !== 'PROCESSING' &&
          callStatus !== 'ERROR' &&
          callStatus !== 'ENDED'
        ) {
          setTimeout(() => {
            try {
              recognition.start()
            } catch {}
          }, 150)
        }
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {}
    } catch (err) {
      console.warn('Init SpeechRecognition error:', err)
    }
  }, [isMuted, callStatus, processUserSpeech])

  // 6. Khởi tạo Web Audio Analyser & Canvas Visualizer
  const initAudioVisualizer = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicNotice('Thiết bị không hỗ trợ ghi âm trực tiếp.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      micStreamRef.current = stream

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioContextClass()
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      setMicNotice(null)
      return true
    } catch (err: unknown) {
      console.warn('Microphone permission or access error:', err)
      setMicNotice(
        'Microphone chưa được cấp quyền (Nhấp vào icon micro để thử lại hoặc nhập câu hỏi bên dưới)'
      )
      return false
    }
  }, [])

  // 7. Vòng lặp vẽ Sóng âm thanh Canvas (Lively Visualizer)
  useEffect(() => {
    if (!isOpen) return

    let animId: number
    let wavePhase = 0

    const renderLoop = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32
          const dataArray = new Uint8Array(bufferLength)

          if (analyserRef.current && micStreamRef.current?.active && !isMuted) {
            analyserRef.current.getByteFrequencyData(dataArray)

            // VAD Auto Barge-In
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i]
            }
            const avg = sum / bufferLength
            setMicLevel(avg / 255)

            if (avg > 25 && callStatus === 'SPEAKING') {
              vadCounterRef.current += 1
              if (vadCounterRef.current >= 4) {
                interruptAi()
                vadCounterRef.current = 0
              }
            } else {
              vadCounterRef.current = Math.max(0, vadCounterRef.current - 1)
            }
          } else {
            // Sóng giả lập khi AI đang nói hoặc chờ mic
            wavePhase += 0.08
            for (let i = 0; i < bufferLength; i++) {
              if (callStatus === 'SPEAKING') {
                dataArray[i] = Math.floor(60 + Math.sin(wavePhase + i * 0.4) * 45 + Math.random() * 20)
              } else if (callStatus === 'PROCESSING') {
                dataArray[i] = Math.floor(40 + Math.sin(wavePhase * 1.5 + i * 0.6) * 30)
              } else {
                dataArray[i] = Math.floor(18 + Math.sin(wavePhase + i * 0.3) * 10)
              }
            }
          }

          // Vẽ thanh biểu đồ sóng âm thanh Gradient
          const barWidth = (canvas.width / bufferLength) * 1.8
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = Math.max(4, (dataArray[i] / 255) * canvas.height * 0.9)

            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
            if (callStatus === 'SPEAKING') {
              gradient.addColorStop(0, '#10b981')
              gradient.addColorStop(0.5, '#06b6d4')
              gradient.addColorStop(1, '#3b82f6')
            } else if (callStatus === 'PROCESSING') {
              gradient.addColorStop(0, '#6366f1')
              gradient.addColorStop(0.5, '#a855f7')
              gradient.addColorStop(1, '#ec4899')
            } else {
              gradient.addColorStop(0, '#4f46e5')
              gradient.addColorStop(0.6, '#38bdf8')
              gradient.addColorStop(1, '#34d399')
            }

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.roundRect(x, canvas.height - barHeight, Math.max(2, barWidth - 2), barHeight, [2, 2, 0, 0])
            ctx.fill()

            x += barWidth
          }
        }
      }
      animId = requestAnimationFrame(renderLoop)
    }

    animId = requestAnimationFrame(renderLoop)
    animationFrameRef.current = animId

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [isOpen, callStatus, isMuted, interruptAi])

  // 8. Lifecycle khi mở/đóng Modal cuộc gọi
  useEffect(() => {
    isComponentMounted.current = true

    if (isOpen) {
      setCallStatus('CONNECTING')
      setCallDuration(0)
      setErrorMessage(null)
      setMicNotice(null)
      setUserTranscript('')
      setAiSpeechSubtitles('')
      setIsMuted(false)
      setSpeakerEnabled(true)
      setTextInput('')

      // 8.1. Thiết lập lời chào ngay lập tức (KHÔNG BAO GIỜ ĐỂ KHUNG LỊCH SỬ TRỐNG)
      const greeting =
        portal === 'PUBLIC'
          ? 'Xin chào quý khách! Tôi là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ quý khách tìm hiểu khóa học, học phí hay lịch khai giảng nào ạ?'
          : portal === 'TEACHER'
          ? 'Kính chào thầy cô! Tôi là Trợ lý Giảng dạy AI. Tôi sẵn sàng hỗ trợ thầy cô soạn giáo án, tạo câu hỏi trắc nghiệm hoặc tra cứu tài liệu bài giảng.'
          : portal === 'ADMIN'
          ? 'Chào Quản trị viên! Tôi là Trợ lý Quản trị & Vận hành. Tôi có thể hỗ trợ bạn tra cứu số liệu học viên, tỷ lệ chuyên cần và báo cáo toàn trung tâm.'
          : 'Chào bạn! Tôi là AI Gia sư đồng hành học tập. Bạn muốn hướng dẫn giải bài tập, giải thích kiến thức hay ôn luyện chủ đề nào hôm nay?'

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setRecentTranscripts([{ role: 'assistant', text: greeting, time: timeStr }])

      // 8.2. Kết nối Audio & Microphone song song (Timeout bảo đảm không bao giờ treo)
      const connectPromise = initAudioVisualizer()
      const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000))

      Promise.race([connectPromise, timeoutPromise]).then((ok) => {
        if (!isComponentMounted.current) return

        setCallStatus('LISTENING')
        initSpeechRecognition()
        speakAiResponse(greeting)
      })
    } else {
      // Teardown khi đóng
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null
          recognitionRef.current.stop()
        } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setCallStatus('ENDED')
    }

    return () => {
      isComponentMounted.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null
          recognitionRef.current.stop()
        } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, initAudioVisualizer, initSpeechRecognition, portal, speakAiResponse])

  // 9. Bật / Tắt Microphone
  const toggleMute = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {})
    }

    if (isMuted) {
      setIsMuted(false)
      setCallStatus('LISTENING')
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      }
      if (!micStreamRef.current?.active) {
        initAudioVisualizer().then(() => initSpeechRecognition())
      } else if (recognitionRef.current) {
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

  // 10. Bật / Tắt Loa (Speaker Output)
  const toggleSpeaker = () => {
    if (speakerEnabled) {
      setSpeakerEnabled(false)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    } else {
      setSpeakerEnabled(true)
    }
  }

  // 11. Xử lý gửi văn bản trực tiếp trong modal Voice
  const handleManualSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || callStatus === 'PROCESSING') return
    const text = textInput.trim()
    setTextInput('')
    processUserSpeech(text)
  }

  // 12. Kết thúc cuộc gọi
  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    setCallStatus('ENDED')
    onClose()
  }

  if (!isOpen) return null

  const orbScale = 1 + Math.min(0.28, micLevel * 3.5)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white text-left max-h-[92vh]">
          {/* Header */}
          <div className="pt-6 pb-4 px-6 flex flex-col items-center text-center border-b border-slate-800/80 shrink-0 relative">
            <button
              onClick={handleEndCall}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition z-10 cursor-pointer"
              title="Đóng cuộc gọi"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Quả cầu năng lượng Orb phản hồi âm thanh thực tế */}
            <div className="relative mb-3">
              <button
                type="button"
                onClick={interruptAi}
                style={{ transform: `scale(${orbScale})` }}
                className={`w-20 h-20 rounded-full transition-transform duration-75 flex items-center justify-center shadow-xl cursor-pointer ${
                  callStatus === 'SPEAKING'
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-500/40 ring-4 ring-emerald-500/30'
                    : callStatus === 'PROCESSING'
                    ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/40 animate-pulse'
                    : callStatus === 'MUTED'
                    ? 'bg-slate-700 shadow-slate-700/40 ring-2 ring-amber-500/40'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-blue-500/30'
                }`}
                title={callStatus === 'SPEAKING' ? 'Chạm để ngắt lời AI' : 'Microphone hoạt động'}
              >
                <div className="w-18 h-18 rounded-full bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
                  <Sparkles
                    className={`w-8 h-8 ${
                      callStatus === 'SPEAKING'
                        ? 'text-emerald-300'
                        : callStatus === 'PROCESSING'
                        ? 'text-purple-300 animate-spin'
                        : callStatus === 'MUTED'
                        ? 'text-amber-400'
                        : 'text-sky-300 animate-pulse'
                    }`}
                  />
                </div>
              </button>

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

            {/* Trạng thái cuộc gọi & Bộ đếm thời gian */}
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
                    ? 'text-purple-400'
                    : 'text-slate-400'
                }`}
              >
                {callStatus === 'SPEAKING'
                  ? 'AI Đang trả lời (Chạm để ngắt)'
                  : callStatus === 'LISTENING'
                  ? 'Đang lắng nghe bạn...'
                  : callStatus === 'PROCESSING'
                  ? 'AI đang suy nghĩ...'
                  : callStatus === 'MUTED'
                  ? 'Microphone đang tắt'
                  : callStatus === 'CONNECTING'
                  ? 'Đang kết nối...'
                  : 'Sẵn sàng'}
              </span>
            </div>
          </div>

          {/* Body: Waveform & Toàn bộ Hội thoại Live */}
          <div className="px-5 py-3 flex-1 flex flex-col justify-between space-y-3 min-h-0 overflow-hidden">
            {errorMessage ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Thông báo kết nối:</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            ) : null}

            {micNotice ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="truncate text-[11px]">{micNotice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => initAudioVisualizer().then(() => initSpeechRecognition())}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Thử lại
                </button>
              </div>
            ) : null}

            {/* 1. Canvas Visualizer sóng âm thanh linh hoạt */}
            <div className="w-full h-14 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden shadow-inner shrink-0">
              <canvas ref={canvasRef} width={420} height={50} className="w-full h-full" />
            </div>

            {/* 2. Khu vực Lịch sử hội thoại đầy đủ (Không bao giờ trống) */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-800/30 border border-slate-800/80 p-3 space-y-2 text-xs min-h-[140px] max-h-[220px]">
              {recentTranscripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl leading-relaxed ${
                    t.role === 'user'
                      ? 'bg-indigo-950/70 border border-indigo-500/30 text-indigo-100 ml-4'
                      : 'bg-slate-900/90 border border-slate-700/60 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                    <span className={t.role === 'user' ? 'text-indigo-300' : 'text-emerald-400'}>
                      {t.role === 'user' ? 'Bạn' : agentName}
                    </span>
                    <span className="font-mono text-slate-400">{t.time}</span>
                  </div>
                  <p className="text-xs">{t.text}</p>
                </div>
              ))}

              {/* Lời đang nói thời gian thực (Interim Speech Preview) */}
              {userTranscript && (
                <div className="p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-400/50 text-indigo-200 ml-4 animate-in fade-in">
                  <span className="font-bold text-indigo-300 text-[10px] block mb-0.5">
                    Bạn đang nói...
                  </span>
                  <p className="italic">{userTranscript}</p>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Nút ngắt lời nổi bật khi AI đang nói */}
            {callStatus === 'SPEAKING' && (
              <div className="flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={interruptAi}
                  className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-emerald-300 transition shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chạm để ngắt lời AI và nói tiếp</span>
                </button>
              </div>
            )}

            {/* Fallback Text Input (Nhập văn bản khi không tiện bật Mic) */}
            <form onSubmit={handleManualSend} className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isMuted ? 'Micro đang tắt — Gõ câu hỏi để AI trả lời giọng nói...' : 'Nói qua mic hoặc gõ câu hỏi vào đây...'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || callStatus === 'PROCESSING'}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                title="Gửi câu hỏi"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Footer Điều khiển cuộc gọi thực tế */}
          <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-around shrink-0">
            {/* 1. Mute / Unmute Mic */}
            <button
              type="button"
              onClick={toggleMute}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition cursor-pointer ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isMuted ? 'Bật Microphone' : 'Tắt Microphone'}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-amber-400" />
              ) : (
                <Mic className="w-5 h-5 text-indigo-400" />
              )}
              <span className="text-[10px] font-bold">{isMuted ? 'Bật Mic' : 'Tắt Mic'}</span>
            </button>

            {/* 2. Kết thúc cuộc gọi */}
            <button
              type="button"
              onClick={handleEndCall}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Kết thúc cuộc gọi thoại"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-[10px] font-bold">Kết thúc</span>
            </button>

            {/* 3. Mute / Unmute Loa */}
            <button
              type="button"
              onClick={toggleSpeaker}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition cursor-pointer ${
                !speakerEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={speakerEnabled ? 'Tắt Loa' : 'Bật Loa'}
            >
              {!speakerEnabled ? (
                <VolumeX className="w-5 h-5 text-amber-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-[10px] font-bold">{speakerEnabled ? 'Loa bật' : 'Loa tắt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
