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
  RotateCcw,
  Activity,
  Terminal,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume1,
  Play
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

export interface VoiceTelemetry {
  sttLatencyMs: number
  aiLatencyMs: number
  ttfaLatencyMs: number
  totalRoundTripMs: number
  lastTurnTimestamp: string
}

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
  const [textInput, setTextInput] = useState('')
  const [recentTranscripts, setRecentTranscripts] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; time: string }>
  >([])

  // Live Audio Signal & Device Metrics
  const [micLevel, setMicLevel] = useState(0) // 0..1 RMS
  const [micDb, setMicDb] = useState(-60) // dB scale: -60dB to 0dB
  const [deviceName, setDeviceName] = useState<string>('Đang dò thiết bị...')
  const [hasLiveAudioSignal, setHasLiveAudioSignal] = useState(false)

  // Debug Panel State
  const [showDebug, setShowDebug] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [sttEngineName, setSttEngineName] = useState('Web Speech API (vi-VN)')
  const [ttsVoiceName, setTtsVoiceName] = useState('Default TTS')
  const [telemetry, setTelemetry] = useState<VoiceTelemetry>({
    sttLatencyMs: 0,
    aiLatencyMs: 0,
    ttfaLatencyMs: 0,
    totalRoundTripMs: 0,
    lastTurnTimestamp: '--'
  })

  // Audio Context & Analyser Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Speech Recognition & Playback Refs
  const recognitionRef = useRef<any>(null)
  const isComponentMounted = useRef(true)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const interimTranscriptRef = useRef('')
  const finalTranscriptRef = useRef('')
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const turnStartTimeRef = useRef(0)
  const aiRequestStartTimeRef = useRef(0)
  const ttsQueueRef = useRef<string[]>([])
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const activeConversationIdRef = useRef<number | null>(conversationId || null)
  const bargeInDebounceRef = useRef(0)

  const addDebugLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setDebugLog((prev) => [`[${ts}] ${msg}`, ...prev.slice(0, 30)])
  }

  const scrollToTranscriptBottom = () => {
    if (typeof transcriptEndRef.current?.scrollIntoView === 'function') {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 1. Quản lý thời lượng cuộc gọi
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isOpen && callStatus !== 'ENDED') {
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

  // 2. Ngắt lời AI (Barge-in)
  const interruptAi = useCallback(() => {
    addDebugLog('Người dùng ngắt lời AI (Barge-in)')
    ttsQueueRef.current = []
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    isSpeakingRef.current = false
    setCallStatus('LISTENING')
    startListening()
  }, [])

  // 3. Chuỗi phát âm thanh TTS tiếng Việt (Sentence-by-Sentence Queue)
  const playNextTtsSentence = useCallback(() => {
    if (!speakerEnabled || !('speechSynthesis' in window)) {
      isSpeakingRef.current = false
      setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
      startListening()
      return
    }

    if (ttsQueueRef.current.length === 0) {
      // Đã phát xong toàn bộ câu trả lời, tự động chuyển sang lắng nghe lượt tiếp theo
      isSpeakingRef.current = false
      setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
      addDebugLog('AI phát xong âm thanh. Bắt đầu lắng nghe lượt tiếp theo...')
      setTimeout(() => {
        if (isComponentMounted.current && !isMuted) {
          startListening()
        }
      }, 200)
      return
    }

    const nextSentence = ttsQueueRef.current.shift()
    if (!nextSentence || !nextSentence.trim()) {
      playNextTtsSentence()
      return
    }

    try {
      const utterance = new SpeechSynthesisUtterance(nextSentence.trim())
      utterance.lang = 'vi-VN'
      utterance.rate = 1.05
      utterance.pitch = 1.0

      // Chọn giọng tiếng Việt chất lượng cao
      const voices = window.speechSynthesis.getVoices()
      const viVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('vi') ||
          v.lang.toLowerCase().includes('vn') ||
          v.name.includes('Vietnamese')
      )
      if (viVoice) {
        utterance.voice = viVoice
        setTtsVoiceName(viVoice.name)
      }

      utterance.onstart = () => {
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true
          setCallStatus('SPEAKING')
          const ttfa = Date.now() - aiRequestStartTimeRef.current
          setTelemetry((prev) => ({
            ...prev,
            ttfaLatencyMs: ttfa,
            totalRoundTripMs: Date.now() - turnStartTimeRef.current
          }))
          addDebugLog(`Loa bắt đầu phát âm thanh đầu tiên (TTFA: ${ttfa}ms)`)
        }
      }

      // Fallback timer nếu trình duyệt bỏ rơi sự kiện onend/onerror
      const safetyEndTimer = setTimeout(() => {
        if (currentUtteranceRef.current === utterance && isSpeakingRef.current && !window.speechSynthesis.speaking) {
          playNextTtsSentence()
        }
      }, 8000)

      utterance.onend = () => {
        clearTimeout(safetyEndTimer)
        playNextTtsSentence()
      }

      utterance.onerror = (err) => {
        clearTimeout(safetyEndTimer)
        console.warn('TTS utterance error:', err)
        playNextTtsSentence()
      }

      // Giữ tham chiếu để tránh bị Chrome thu gom rác (Garbage Collector bug)
      currentUtteranceRef.current = utterance
      ;(window as any)._chAcademyUtterance = utterance
      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.error('Lỗi gọi SpeechSynthesis:', err)
      playNextTtsSentence()
    }
  }, [speakerEnabled, isMuted])

  // 4. Phát câu trả lời của AI bằng giọng nói
  const speakAiResponse = useCallback(
    (text: string, preSplitSentences?: string[]) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      // Dừng nhận diện tạm thời khi AI đang nói để micro không thu lại tiếng của AI
      stopListening()

      const sentences =
        preSplitSentences && preSplitSentences.length > 0
          ? preSplitSentences
          : text
              .replace(/https?:\/\/\S+/gu, '')
              .replace(/[*#_`>|~]+/gu, ' ')
              .split(/(?<=[.!?…])\s+|\n+/)
              .map((s) => s.trim())
              .filter(Boolean)

      ttsQueueRef.current = [...sentences]
      addDebugLog(`Bắt đầu phát TTS (${sentences.length} phân đoạn câu)`)
      playNextTtsSentence()
    },
    [playNextTtsSentence]
  )

  // 5. Gửi câu nói của người dùng tới Backend AI
  const processUserSpeech = useCallback(
    async (speechText: string) => {
      const clean = speechText.trim()
      if (!clean) return

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setCallStatus('PROCESSING')
      setUserTranscript('')
      setRecentTranscripts((prev) => [...prev, { role: 'user', text: clean, time: timeStr }])
      setTimeout(scrollToTranscriptBottom, 50)

      aiRequestStartTimeRef.current = Date.now()
      addDebugLog(`Gửi câu nói tới AI Runtime: "${clean}"`)

      try {
        let answer = ''
        let sentences: string[] = []
        let latencyMs = 0

        if (portal === 'PUBLIC') {
          const res = await aiChatApi.askPublic({
            question: clean,
            sessionId: guestSessionId || 'voice_guest_' + Date.now(),
            channel: 'VOICE',
            agentCode
          })
          if (res?.success && res.data) {
            answer = res.data.answer
            sentences = res.data.sentences || []
            latencyMs = res.data.latencyMs || (Date.now() - aiRequestStartTimeRef.current)
            if (res.data.conversationId) {
              activeConversationIdRef.current = res.data.conversationId
            }
          }
        } else {
          const res = await aiChatApi.ask({
            question: clean,
            portal,
            channel: 'VOICE',
            agentCode,
            conversationId: activeConversationIdRef.current || undefined
          })
          if (res?.success && res.data) {
            answer = res.data.answer
            sentences = res.data.sentences || []
            latencyMs = res.data.latencyMs || (Date.now() - aiRequestStartTimeRef.current)
            if (res.data.conversationId) {
              activeConversationIdRef.current = res.data.conversationId
            }
          }
        }

        if (!answer) {
          answer = 'Tôi đã nhận được câu hỏi. Bạn có thể nói chi tiết hơn để tôi giải đáp cụ thể hơn không?'
        }

        const aiTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setRecentTranscripts((prev) => [...prev, { role: 'assistant', text: answer, time: aiTimeStr }])
        setTimeout(scrollToTranscriptBottom, 50)

        setTelemetry((prev) => ({
          ...prev,
          aiLatencyMs: latencyMs,
          lastTurnTimestamp: new Date().toLocaleTimeString()
        }))
        addDebugLog(`AI phản hồi thành công (Độ trễ máy chủ: ${latencyMs}ms)`)

        if (onMessageLogged) {
          onMessageLogged(clean, answer)
        }

        speakAiResponse(answer, sentences)
      } catch (err: unknown) {
        const errText = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI'
        addDebugLog(`[Lỗi AI]: ${errText}`)
        setRecentTranscripts((prev) => [
          ...prev,
          { role: 'assistant', text: `[Lỗi]: ${errText}`, time: timeStr }
        ])
        setCallStatus(isMuted ? 'MUTED' : 'LISTENING')
        startListening()
      }
    },
    [portal, guestSessionId, agentCode, conversationId, onMessageLogged, speakAiResponse, isMuted]
  )

  // 6. Dừng lắng nghe
  const stopListening = () => {
    isListeningRef.current = false
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.abort ? recognitionRef.current.abort() : recognitionRef.current.stop()
      } catch {}
    }
  }

  // 7. Bắt đầu lắng nghe nhận diện giọng nói (STT Turn)
  const startListening = () => {
    if (!isComponentMounted.current || isMuted || isSpeakingRef.current) return

    stopListening()
    isListeningRef.current = true
    interimTranscriptRef.current = ''
    finalTranscriptRef.current = ''
    turnStartTimeRef.current = Date.now()

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSttEngineName('MediaRecorder VAD (Fallback)')
      setMicNotice('Trình duyệt chưa có Web Speech API native. Bạn có thể nói hoặc gõ câu hỏi phía dưới.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.continuous = true // Lắng nghe liên tục, không bị ngắt giữa chừng
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        if (isComponentMounted.current && !isMuted) {
          setCallStatus('LISTENING')
          addDebugLog('STT đang lắng nghe giọng nói tiếng Việt...')
        }
      }

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i]
          if (item.isFinal) {
            final += item[0].transcript
          } else {
            interim += item[0].transcript
          }
        }

        if (final) {
          finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + final).trim()
        }
        interimTranscriptRef.current = interim

        const combined = (finalTranscriptRef.current + ' ' + interim).trim()
        setUserTranscript(combined)

        // Reset bộ đếm im lặng để chốt câu khi ngừng nói (1600ms giúp học viên nói tiếng Việt tự nhiên)
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        silenceTimerRef.current = setTimeout(() => {
          if (combined && isListeningRef.current) {
            const sttElapsed = Date.now() - turnStartTimeRef.current
            setTelemetry((prev) => ({ ...prev, sttLatencyMs: sttElapsed }))
            addDebugLog(`STT nhận diện hoàn tất: "${combined}" (${sttElapsed}ms)`)
            stopListening()
            processUserSpeech(combined)
          }
        }, 1600)
      }

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          addDebugLog(`STT notice: ${event.error}`)
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Quyền truy cập Microphone bị từ chối.')
          setCallStatus('ERROR')
        }
      }

      recognition.onend = () => {
        const textToSend = (finalTranscriptRef.current || interimTranscriptRef.current).trim()
        if (textToSend && isListeningRef.current && !isSpeakingRef.current) {
          const sttElapsed = Date.now() - turnStartTimeRef.current
          setTelemetry((prev) => ({ ...prev, sttLatencyMs: sttElapsed }))
          addDebugLog(`STT kết thúc lượt: "${textToSend}" (${sttElapsed}ms)`)
          stopListening()
          processUserSpeech(textToSend)
        } else if (isListeningRef.current && !isSpeakingRef.current && !isMuted) {
          // Chưa có âm thanh, tiếp tục lắng nghe lượt kế tiếp
          setTimeout(() => {
            if (isListeningRef.current && !isSpeakingRef.current) {
              startListening()
            }
          }, 150)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('SpeechRecognition start notice:', err)
    }
  }

  // 8. Khởi tạo Microphone & Web Audio Analyser (Xác nhận tín hiệu thực tế)
  const initAudioVisualizer = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicNotice('Trình duyệt hoặc môi trường này chưa hỗ trợ getUserMedia. Bạn có thể gõ câu hỏi phía dưới.')
      return false
    }

    try {
      addDebugLog('Đang yêu cầu quyền truy cập Microphone...')
      
      // Bọc promise getUserMedia trong timeout 3s để không bao giờ bị đơ giao diện
      const getMediaPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      })
      const timeoutPromise = new Promise<MediaStream>((_, reject) =>
        setTimeout(() => reject(new Error('Yêu cầu Microphone hết hạn thời gian (Timeout)')), 3000)
      )

      const stream = await Promise.race([getMediaPromise, timeoutPromise])
      micStreamRef.current = stream

      const track = stream.getAudioTracks()[0]
      if (track) {
        setDeviceName(track.label || 'Microphone hệ thống')
        addDebugLog(`Microphone kết nối thành công: ${track.label || 'Default'}`)
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioContextClass()
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume()
        } catch {}
      }
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      setMicNotice(null)
      setErrorMessage(null)
      return true
    } catch (err: unknown) {
      console.warn('Lỗi truy cập Micro:', err)
      const eText = err instanceof Error ? err.message : String(err)
      setMicNotice(
        'Chưa nhận được tín hiệu Microphone. Bạn có thể nhấn "Thử lại", cho phép quyền micro hoặc gõ câu hỏi trực tiếp.'
      )
      addDebugLog(`[Lỗi Micro]: ${eText}`)
      return false
    }
  }, [])

  // 9. Vòng lặp vẽ Sóng âm thanh Canvas & Tính Decibels thực tế
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
          const timeData = new Float32Array(analyserRef.current ? analyserRef.current.fftSize : 256)

          if (analyserRef.current && micStreamRef.current?.active && !isMuted) {
            analyserRef.current.getByteFrequencyData(dataArray)
            analyserRef.current.getFloatTimeDomainData(timeData)

            // Tính RMS và Decibels thực tế
            let sumSq = 0
            for (let i = 0; i < timeData.length; i++) {
              sumSq += timeData[i] * timeData[i]
            }
            const rms = Math.sqrt(sumSq / timeData.length)
            setMicLevel(rms)

            const db = rms > 0.0001 ? Math.max(-60, Math.min(0, Math.round(20 * Math.log10(rms)))) : -60
            setMicDb(db)
            setHasLiveAudioSignal(rms > 0.008)

            // Auto Barge-in: Nếu AI đang nói mà micro phát hiện người dùng nói (RMS > 0.055)
            if (isSpeakingRef.current && rms > 0.055) {
              const now = Date.now()
              if (now - bargeInDebounceRef.current > 1200) {
                bargeInDebounceRef.current = now
                addDebugLog(`Tự động ngắt lời (Barge-in do nhận diện tiếng nói RMS: ${(rms * 100).toFixed(0)}%)`)
                interruptAi()
              }
            }
          } else {
            // Sóng mô phỏng khi AI đang trả lời hoặc Micro tắt
            wavePhase += 0.08
            for (let i = 0; i < bufferLength; i++) {
              if (callStatus === 'SPEAKING') {
                dataArray[i] = Math.floor(65 + Math.sin(wavePhase + i * 0.4) * 45 + Math.random() * 20)
              } else if (callStatus === 'PROCESSING') {
                dataArray[i] = Math.floor(40 + Math.sin(wavePhase * 1.5 + i * 0.6) * 30)
              } else {
                dataArray[i] = Math.floor(15 + Math.sin(wavePhase + i * 0.3) * 8)
              }
            }
            setMicDb(-60)
            setHasLiveAudioSignal(false)
          }

          // Vẽ biểu đồ sóng âm thanh Gradient
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
  }, [isOpen, callStatus, isMuted])

  // 10. Lifecycle mở/đóng Modal cuộc gọi
  useEffect(() => {
    isComponentMounted.current = true

    if (isOpen) {
      setCallStatus('CONNECTING')
      setCallDuration(0)
      setErrorMessage(null)
      setMicNotice(null)
      setUserTranscript('')
      setIsMuted(false)
      setSpeakerEnabled(true)
      setTextInput('')
      addDebugLog('Khởi tạo phiên Voice AI CH Academy...')

      // Lời chào mở đầu chuyên biệt theo cổng
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

      // 1. Phục hồi Web SpeechSynthesis và lập tức phát lời chào mở đầu
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
          window.speechSynthesis.resume()
        } catch {}
      }
      setCallStatus('SPEAKING')
      speakAiResponse(greeting)

      // 2. Khởi tạo Microphone song song (không làm chậm phản hồi ban đầu)
      initAudioVisualizer().then((ok) => {
        if (!isComponentMounted.current) return
        if (ok) {
          addDebugLog('Microphone và Web Audio đã sẵn sàng')
        } else {
          addDebugLog('Chưa nhận tín hiệu micro, sẵn sàng gõ câu hỏi hoặc thử lại')
        }
      })
    } else {
      // Dọn dẹp tài nguyên
      stopListening()
      ttsQueueRef.current = []
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
      stopListening()
      ttsQueueRef.current = []
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
  }, [isOpen, initAudioVisualizer, portal, speakAiResponse])

  // 11. Bật / Tắt Microphone
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
      startListening()
      addDebugLog('Đã mở Microphone')
    } else {
      setIsMuted(true)
      setCallStatus('MUTED')
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false))
      }
      stopListening()
      addDebugLog('Đã tắt Microphone')
    }
  }

  // 12. Bật / Tắt Loa
  const toggleSpeaker = () => {
    if (speakerEnabled) {
      setSpeakerEnabled(false)
      ttsQueueRef.current = []
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      addDebugLog('Đã tắt Loa')
    } else {
      setSpeakerEnabled(true)
      addDebugLog('Đã bật Loa')
    }
  }

  // 13. Gửi văn bản trực tiếp
  const handleManualSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || callStatus === 'PROCESSING') return
    const text = textInput.trim()
    setTextInput('')
    processUserSpeech(text)
  }

  // 14. Kết thúc cuộc gọi
  const handleEndCall = () => {
    stopListening()
    ttsQueueRef.current = []
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    setCallStatus('ENDED')
    onClose()
  }

  // ==========================================
  // BỘ CÔNG CỤ TEST VOICE PIPELINE (Debug Mode)
  // ==========================================
  const runTestMicrophone = () => {
    addDebugLog('Kiểm tra Micro: Đo mức tín hiệu âm thanh trong 2 giây...')
    setTimeout(() => {
      const active = hasLiveAudioSignal || micLevel > 0.005
      addDebugLog(
        active
          ? `Microphone hoạt động tốt (Tín hiệu: ${micDb} dB, RMS: ${(micLevel * 100).toFixed(1)}%)`
          : 'Cảnh báo: Chưa phát hiện âm thanh vào Micro. Hãy nói thử vào micro!'
      )
    }, 1500)
  }

  const runTestStt = () => {
    addDebugLog('Kiểm tra STT: Kích hoạt Web Speech API vi-VN...')
    startListening()
  }

  const runTestAi = async () => {
    addDebugLog('Kiểm tra AI Runtime: Gọi API /chat/ai/voice/diagnostics...')
    try {
      const res = await aiChatApi.getVoiceDiagnostics()
      if (res?.success) {
        addDebugLog(`AI Runtime hoạt động tốt: Model ${res.data.model}, Latency Target < ${res.data.latencyTargetMs}ms`)
      }
    } catch (e) {
      addDebugLog('Kiểm tra AI Runtime thất bại')
    }
  }

  const runTestTts = () => {
    addDebugLog('Kiểm tra TTS: Phát âm thanh kiểm tra tiếng Việt...')
    speakAiResponse('CH Academy xin chào! Hệ thống âm thanh và giọng nói tiếng Việt đang hoạt động chính xác.')
  }

  const runTestFullPipeline = () => {
    addDebugLog('Bắt đầu kiểm tra Toàn bộ Voice Pipeline (End-to-End)...')
    runTestMicrophone()
    runTestAi()
    setTimeout(runTestTts, 1000)
  }

  if (!isOpen) return null

  const orbScale = 1 + Math.min(0.28, micLevel * 3.5)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white text-left max-h-[95vh]">
          {/* Header */}
          <div className="pt-5 pb-3 px-6 flex flex-col items-center text-center border-b border-slate-800/80 shrink-0 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => setShowDebug((prev) => !prev)}
                className={`p-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 ${
                  showDebug
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Bật/Tắt chế độ Debug & Đo độ trễ thời gian thực"
              >
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-bold">Debug</span>
              </button>

              <button
                onClick={handleEndCall}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Đóng cuộc gọi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quả cầu năng lượng Orb phản hồi âm thanh thực tế */}
            <div className="relative mb-2">
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

            <h3 className="text-lg font-bold tracking-tight text-white mb-0.5">{agentName}</h3>
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
                  ? 'AI Đang trả lời (Chạm Orb để ngắt)'
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
          <div className="px-5 py-3 flex-1 flex flex-col justify-between space-y-2.5 min-h-0 overflow-hidden">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Thông báo thiết bị:</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {micNotice && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="truncate text-[11px]">{micNotice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => initAudioVisualizer().then(() => startListening())}
                  className="px-2 py-0.8 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Thử lại
                </button>
              </div>
            )}

            {/* 1. Canvas Visualizer & VU Meter thực tế */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-2 overflow-hidden shadow-inner shrink-0 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span className="truncate max-w-[200px] flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasLiveAudioSignal ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  {deviceName}
                </span>
                <span className="font-bold text-sky-400">
                  {callStatus === 'MUTED' ? 'TẮT MIC' : `${micDb} dB (RMS: ${(micLevel * 100).toFixed(0)}%)`}
                </span>
              </div>
              <canvas ref={canvasRef} width={460} height={46} className="w-full h-11" />
            </div>

            {/* 2. Bảng Debug Voice & Telemetry (Khi bật nút Debug) */}
            {showDebug && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/40 text-xs font-mono space-y-2.5 animate-in fade-in max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Chẩn đoán Độ trễ Voice AI Telemetry
                  </span>
                  <span className="text-[10px] text-slate-400">{telemetry.lastTurnTimestamp}</span>
                </div>

                {/* Các chỉ số độ trễ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">STT Turn</span>
                    <span className="font-bold text-sky-400">{telemetry.sttLatencyMs}ms</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">AI Backend</span>
                    <span className="font-bold text-emerald-400">{telemetry.aiLatencyMs}ms</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">First Audio (TTFA)</span>
                    <span className="font-bold text-amber-400">{telemetry.ttfaLatencyMs}ms</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Tổng Round-Trip</span>
                    <span className="font-bold text-indigo-400">{telemetry.totalRoundTripMs}ms</span>
                  </div>
                </div>

                {/* Nút bấm kiểm tra từng công đoạn thực tế */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={runTestMicrophone}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold cursor-pointer"
                  >
                    Test Micro
                  </button>
                  <button
                    type="button"
                    onClick={runTestStt}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold cursor-pointer"
                  >
                    Test STT
                  </button>
                  <button
                    type="button"
                    onClick={runTestAi}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold cursor-pointer"
                  >
                    Test AI Runtime
                  </button>
                  <button
                    type="button"
                    onClick={runTestTts}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer"
                  >
                    Test TTS
                  </button>
                  <button
                    type="button"
                    onClick={runTestFullPipeline}
                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Test Toàn bộ Pipeline
                  </button>
                </div>

                {/* Nhật ký Debug thời gian thực */}
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px] text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                  {debugLog.map((log, idx) => (
                    <div key={idx} className="truncate">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Khu vực Lịch sử hội thoại đầy đủ */}
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

            {/* Fallback Text Input */}
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
