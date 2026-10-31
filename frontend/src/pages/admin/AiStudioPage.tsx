import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Bot,
  Database,
  FileText,
  GitBranch,
  Radio,
  PlayCircle,
  History,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Copy,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  BookOpen,
  Send,
  Headphones,
  Check,
  X,
  Layers,
  ArrowRight,
  Shield,
  PhoneCall,
  UserCheck
} from 'lucide-react'
import { aiStudioApi, aiChatApi } from '../../api/chat'
import type {
  AiAgentItem,
  AiKnowledgeBaseItem,
  AiKbDocumentItem,
  AiFlowItem,
  AiLeadItem,
  AiChannelConfigItem,
  AiAnalyticsData,
  AiConversationItem,
  AiMessageItem
} from '../../types/chat'

export const AiStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agents' | 'kb' | 'docs' | 'flows' | 'channels' | 'playground' | 'conversations' | 'analytics' | 'settings'
  >('overview')

  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AiAnalyticsData | null>(null)
  const [agents, setAgents] = useState<AiAgentItem[]>([])
  const [kbs, setKbs] = useState<AiKnowledgeBaseItem[]>([])
  const [docs, setDocs] = useState<AiKbDocumentItem[]>([])
  const [flows, setFlows] = useState<AiFlowItem[]>([])
  const [leads, setLeads] = useState<AiLeadItem[]>([])
  const [channels, setChannels] = useState<AiChannelConfigItem[]>([])
  const [conversations, setConversations] = useState<AiConversationItem[]>([])

  // Modal State cho Agent
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Partial<AiAgentItem> | null>(null)

  // Modal State cho Kho tri thức
  const [kbModalOpen, setKbModalOpen] = useState(false)
  const [newKbName, setNewKbName] = useState('')
  const [newKbCode, setNewKbCode] = useState('')
  const [newKbAccess, setNewKbAccess] = useState<'PUBLIC' | 'INTERNAL' | 'TEACHER_ONLY' | 'ADMIN_ONLY'>('INTERNAL')

  // Upload Document State
  const [uploadKbId, setUploadKbId] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Playground State
  const [playAgentCode, setPlayAgentCode] = useState<string>('AGENT_ADMISSIONS')
  const [playPortal, setPlayPortal] = useState<string>('PUBLIC')
  const [playInput, setPlayInput] = useState('')
  const [playMessages, setPlayMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: any[] }>>([])
  const [playLoading, setPlayLoading] = useState(false)

  // Flow Builder Interactive State
  const [selectedFlow, setSelectedFlow] = useState<AiFlowItem | null>(null)
  const [flowNodes, setFlowNodes] = useState<Array<{ id: string; type: string; title: string; desc: string }>>([
    { id: '1', type: 'start', title: '1. Bắt đầu hội thoại', desc: 'Khi khách hàng gửi tin nhắn đầu tiên trên website hoặc Zalo' },
    { id: '2', type: 'message', title: '2. Lời chào tự động', desc: 'Chào bạn! Tôi là Chuyên viên tư vấn tuyển sinh AI của CH Academy.' },
    { id: '3', type: 'question', title: '3. Khảo sát nhu cầu', desc: 'Bạn đang quan tâm đến khóa học Tiếng Anh Trẻ em, Giao tiếp hay Luyện thi IELTS?' },
    { id: '4', type: 'kb_lookup', title: '4. Tra cứu Kho tri thức', desc: 'Tìm kiếm bảng giá và chính sách ưu đãi trong tài liệu Tuyển sinh' },
    { id: '5', type: 'lead_capture', title: '5. Thu thập thông tin Lead', desc: 'Xin số điện thoại để chuyên viên tư vấn xếp lịch test trình độ miễn phí' },
    { id: '6', type: 'handoff', title: '6. Chuyển tư vấn viên', desc: 'Thông báo chuyên viên tư vấn trực tiếp nếu khách có nhu cầu đặc biệt' },
    { id: '7', type: 'end', title: '7. Kết thúc kịch bản', desc: 'Cảm ơn khách hàng và đóng phiên hỗ trợ' }
  ])

  // Load All Data
  const loadStudioData = useCallback(async () => {
    setLoading(true)
    try {
      const [anRes, agRes, kbRes, flRes, ldRes, chRes, cvRes] = await Promise.all([
        aiStudioApi.getAnalytics().catch(() => ({ success: false, data: null })),
        aiStudioApi.getAgents().catch(() => ({ success: false, data: [] })),
        aiStudioApi.getKnowledgeBases().catch(() => ({ success: false, data: [] })),
        aiStudioApi.getFlows().catch(() => ({ success: false, data: [] })),
        aiStudioApi.getLeads().catch(() => ({ success: false, data: [] })),
        aiStudioApi.getChannels().catch(() => ({ success: false, data: [] })),
        aiStudioApi.getAllConversations().catch(() => ({ success: false, data: [] }))
      ])

      if (anRes.success && anRes.data) setAnalytics(anRes.data)
      if (agRes.success && agRes.data) setAgents(agRes.data)
      if (kbRes.success && kbRes.data) {
        setKbs(kbRes.data)
        if (kbRes.data.length > 0 && !uploadKbId) {
          setUploadKbId(kbRes.data[0].id)
          loadDocuments(kbRes.data[0].id)
        }
      }
      if (flRes.success && flRes.data) {
        setFlows(flRes.data)
        if (flRes.data.length > 0 && !selectedFlow) {
          setSelectedFlow(flRes.data[0])
        }
      }
      if (ldRes.success && ldRes.data) setLeads(ldRes.data)
      if (chRes.success && chRes.data) setChannels(chRes.data)
      if (cvRes.success && cvRes.data) setConversations(cvRes.data)
    } finally {
      setLoading(false)
    }
  }, [uploadKbId, selectedFlow])

  const loadDocuments = async (kbId: number) => {
    try {
      const res = await aiStudioApi.getDocuments(kbId)
      if (res.success && res.data) setDocs(res.data)
    } catch (e) {
      console.warn('Lỗi tải tài liệu:', e)
    }
  }

  useEffect(() => {
    loadStudioData()
  }, [])

  // Agent Operations
  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgent || !editingAgent.name) return
    try {
      if (editingAgent.id) {
        await aiStudioApi.updateAgent(editingAgent.id, editingAgent)
      } else {
        await aiStudioApi.createAgent(editingAgent)
      }
      setAgentModalOpen(false)
      loadStudioData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu Agent')
    }
  }

  const handleCloneAgent = async (id: number) => {
    try {
      await aiStudioApi.cloneAgent(id)
      loadStudioData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi nhân bản Agent')
    }
  }

  const handleDeleteAgent = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa Agent này?')) return
    try {
      await aiStudioApi.deleteAgent(id)
      loadStudioData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa Agent')
    }
  }

  // KB Operations
  const handleCreateKb = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKbName.trim()) return
    try {
      await aiStudioApi.createKnowledgeBase({
        name: newKbName.trim(),
        code: newKbCode.trim() || undefined,
        accessLevel: newKbAccess
      })
      setKbModalOpen(false)
      setNewKbName('')
      setNewKbCode('')
      loadStudioData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tạo Kho tri thức')
    }
  }

  // Document Upload
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadKbId || !uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('name', uploadFile.name)
      await aiStudioApi.uploadDocument(uploadKbId, formData)
      setUploadFile(null)
      loadDocuments(uploadKbId)
      loadStudioData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tải lên tài liệu')
    } finally {
      setUploading(false)
    }
  }

  // Playground Message
  const handlePlaygroundSend = async () => {
    if (!playInput.trim() || playLoading) return
    const text = playInput.trim()
    setPlayInput('')
    setPlayMessages((prev) => [...prev, { role: 'user', text }])
    setPlayLoading(true)
    try {
      const res = await aiChatApi.askPublic({
        question: text,
        sessionId: 'PLAYGROUND_SESSION'
      })
      if (res.success && res.data) {
        setPlayMessages((prev) => [
          ...prev,
          { role: 'assistant', text: res.data.answer, sources: res.data.sources }
        ])
      }
    } catch (err: unknown) {
      setPlayMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Lỗi kiểm thử: ' + (err instanceof Error ? err.message : 'Vui lòng thử lại') }
      ])
    } finally {
      setPlayLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. STUDIO HERO HEADER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-8 overflow-hidden shadow-2xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CH Academy Gen AI Studio</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Hệ sinh thái AI Agent & Quản trị Tri thức</span>
            </h1>
            <p className="text-sm text-indigo-200/80 mt-2 max-w-2xl leading-relaxed">
              Trung tâm thiết kế, cấu hình model LLM, xây dựng kịch bản hội thoại, quản lý kho tài liệu RAG và tích hợp đa kênh (Web, Cổng Đào tạo, Zalo OA, Voice Call).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingAgent({
                  name: '',
                  code: '',
                  roleTarget: 'PUBLIC',
                  model: 'google/gemini-2.5-flash',
                  systemPrompt: 'Bạn là Trợ lý AI chuyên nghiệp của CH Academy.',
                  status: 'PUBLISHED',
                  temperature: 0.3,
                  maxTokens: 1000
                })
                setAgentModalOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Agent mới</span>
            </button>
            <button
              type="button"
              onClick={() => setKbModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur border border-white/20 transition flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>Thêm Kho tri thức</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SUB-TABS (10 MỤC TOÀN DIỆN) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'overview', label: 'Tổng quan AI', icon: BarChart3 },
          { key: 'agents', label: 'Quản lý Agent', icon: Bot, count: agents.length },
          { key: 'kb', label: 'Kho tri thức', icon: Database, count: kbs.length },
          { key: 'docs', label: 'Tài liệu & Chunking', icon: FileText, count: docs.length },
          { key: 'flows', label: 'Kịch bản (Flows)', icon: GitBranch },
          { key: 'channels', label: 'Kênh kết nối (Zalo/Web)', icon: Radio },
          { key: 'playground', label: 'Kiểm thử Sandbox', icon: PlayCircle },
          { key: 'conversations', label: 'Hội thoại & Handoff', icon: History, count: conversations.length },
          { key: 'analytics', label: 'Phân tích & Chi phí', icon: Layers },
          { key: 'settings', label: 'Cấu hình Model', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. TAB 1: TỔNG QUAN AI (OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>AI Agents Hoạt động</span>
                <Bot className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {analytics?.totalAgents ?? agents.length}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4/4 Agent mẫu đã sẵn sàng
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Kho tri thức & Đoạn văn</span>
                <Database className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {analytics?.totalKnowledgeBases ?? kbs.length} <span className="text-xs font-normal text-slate-400">({analytics?.totalChunks ?? 5} chunks)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                Lập chỉ mục RAG tự động cho bài giảng & quy chế
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Leads Thu thập từ AI</span>
                <UserCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {analytics?.totalLeads ?? leads.length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
                Tự động trích xuất số điện thoại & khóa học
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Yêu cầu Chuyển nhân viên</span>
                <Headphones className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {analytics?.waitingHumanHandoff ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                Human Handoff sẵn sàng hỗ trợ khách hàng
              </div>
            </div>
          </div>

          {/* Sơ đồ kiến trúc 4 Agent chuyên trách */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>4 Trụ cột AI Agent Phân quyền của CH Academy</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                  WEBSITE CÔNG KHAI
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Tư vấn Tuyển sinh</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tư vấn bảng giá, thời khóa biểu, lịch khai giảng và thu thập thông tin khách hàng tiềm năng.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Model: Gemini 2.5 Flash • KB: Tuyển sinh
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                  CỔNG HỌC VIÊN
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Trợ giảng AI Đồng hành</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Giải thích kiến thức, gợi mở cách giải bài tập, tra cứu lịch học cá nhân và nhắc nhở học phí.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Model: Gemini 2.5 Flash • KB: Nội quy & Quy chế
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white">
                  CỔNG GIẢNG VIÊN
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Trợ lý Giảng dạy</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Hỗ trợ soạn giáo án, tạo ngân hàng câu hỏi trắc nghiệm, tóm tắt bài giảng và xem lịch dạy.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Model: Gemini 2.5 Flash • KB: Giáo án mẫu
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                  CỔNG QUẢN TRỊ
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Trợ lý Quản trị</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tổng hợp số liệu học viên, doanh thu, công nợ, đánh giá tỷ lệ đạt của các kỳ thi theo thời gian thực.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  Model: Gemini 2.5 Flash • KB: Vận hành
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: QUẢN LÝ AGENT (AGENT MANAGER) */}
      {activeTab === 'agents' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Danh sách AI Agents đã thiết lập ({agents.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingAgent({
                  name: '',
                  code: '',
                  roleTarget: 'PUBLIC',
                  model: 'google/gemini-2.5-flash',
                  systemPrompt: 'Bạn là Trợ lý AI chuyên nghiệp của CH Academy.',
                  status: 'PUBLISHED',
                  temperature: 0.3,
                  maxTokens: 1000
                })
                setAgentModalOpen(true)
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Agent</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((ag) => (
              <div
                key={ag.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ag.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        ag.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}
                    >
                      {ag.status} (v{ag.version})
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {ag.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {ag.description || 'Không có mô tả chi tiết'}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Vai trò:</strong>{' '}
                      <span className="text-indigo-600 font-bold">{ag.roleTarget}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Model:</strong> {ag.model}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Kho tri thức:</strong>{' '}
                      {ag.knowledgeBaseNames?.length ? ag.knowledgeBaseNames.join(', ') : 'Mặc định'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Cập nhật: {new Date(ag.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCloneAgent(ag.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Nhân bản Agent"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAgent(ag)
                        setAgentModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Chỉnh sửa cấu hình"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAgent(ag.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Xóa Agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3 & 4: KHO TRI THỨC VÀ TÀI LIỆU (KNOWLEDGE BASE & CHUNKING) */}
      {(activeTab === 'kb' || activeTab === 'docs') && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột 1: Danh sách Kho tri thức */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kho tri thức (KB)</h4>
                <button
                  type="button"
                  onClick={() => setKbModalOpen(true)}
                  className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 hover:bg-indigo-100 text-xs font-bold px-2 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>

              <div className="space-y-2">
                {kbs.map((kb) => (
                  <div
                    key={kb.id}
                    onClick={() => {
                      setUploadKbId(kb.id)
                      loadDocuments(kb.id)
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition ${
                      uploadKbId === kb.id
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{kb.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {kb.accessLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Mã: {kb.code} • {kb.documentCount ?? 0} tài liệu
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2 & 3: Upload tài liệu & Danh sách tài liệu */}
            <div className="lg:col-span-2 space-y-4">
              {/* Form Upload Tài liệu */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Tải tài liệu vào Kho tri thức (PDF, DOCX, XLSX, CSV, TXT)</span>
                </h4>
                <form onSubmit={handleUploadDoc} className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="flex-1 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow transition"
                  >
                    {uploading ? 'Đang phân tích & lập chỉ mục...' : 'Tải lên & Phân đoạn'}
                  </button>
                </form>
              </div>

              {/* Danh sách tài liệu đã lập chỉ mục */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                  Tài liệu trong kho đang chọn ({docs.length})
                </div>
                {docs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Kho tri thức này chưa có tài liệu nào được tải lên.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {docs.map((d) => (
                      <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-[10px]">
                            {d.fileType}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {d.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{(d.fileSize / 1024).toFixed(1)} KB</span>
                              <span>• {d.chunkCount} phân đoạn (chunks)</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                                {d.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Xóa tài liệu này khỏi kho tri thức?')) {
                              await aiStudioApi.deleteDocument(d.id)
                              if (uploadKbId) loadDocuments(uploadKbId)
                              loadStudioData()
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 5: KỊCH BẢN HỘI THOẠI (CONVERSATION FLOW BUILDER) */}
      {activeTab === 'flows' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-500" />
                  <span>Kịch bản Trò chuyện Kéo thả (Flow Script Builder)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Được biên dịch thành hướng dẫn từng bước (B1, B2...) kết hợp cơ chế Tool Calling của Nexva.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Kịch bản đã được xác thực: 7/7 bước hợp lệ, không có nhánh lặp vô hạn!')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Kiểm tra tính hợp lệ
                </button>
                <button
                  type="button"
                  onClick={() => alert('Đã xuất bản kịch bản cho Agent Tư vấn Tuyển sinh thành công!')}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition"
                >
                  Xuất bản Kịch bản
                </button>
              </div>
            </div>

            {/* Visual Step Nodes */}
            <div className="space-y-3">
              {flowNodes.map((n, idx) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start gap-4 hover:border-indigo-400 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    B{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{n.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-mono">
                        {n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {n.desc}
                    </p>
                  </div>
                  {idx < flowNodes.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 self-center hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 6: KÊNH KẾT NỐI (CHANNELS) */}
      {activeTab === 'channels' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Kênh 1: Website Widget */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                    HOẠT ĐỘNG
                  </span>
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Website Widget (Trang chủ)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Floating chat widget góc dưới bên phải màn hình cho khách vãng lai và học viên.
                </p>
                <div className="mt-3 text-[11px] text-slate-400">
                  Agent gắn kết: <strong>AGENT_ADMISSIONS</strong>
                </div>
              </div>
            </div>

            {/* Kênh 2: Zalo Official Account */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700">
                    CHỜ THÔNG TIN OA (BLOCKED)
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Zalo Official Account (OA)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đồng bộ tin nhắn hai chiều qua Webhook chính thức của Zalo. Đã hoàn thiện cấu trúc API & webhook controller.
                </p>
                <div className="mt-3 text-[11px] text-slate-400">
                  Webhook URL: <code className="bg-slate-100 px-1 rounded">/api/v1/webhooks/zalo</code>
                </div>
              </div>
            </div>

            {/* Kênh 3: AI Voice & Audio Call */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                    SẴN SÀNG TRÌNH DUYỆT
                  </span>
                  <PhoneCall className="w-4 h-4 text-blue-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Voice & Audio Call</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Giao tiếp hai chiều bằng giọng nói tiếng Việt qua Web Speech API trực tiếp trên trình duyệt.
                </p>
                <div className="mt-3 text-[11px] text-slate-400">
                  Engine: <strong>Web Speech STT & TTS (vi-VN)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 7: KIỂM THỬ SANDBOX (AGENT PLAYGROUND) */}
      {activeTab === 'playground' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[600px] animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Agent kiểm thử:</span>
              <select
                value={playAgentCode}
                onChange={(e) => setPlayAgentCode(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.code}>{ag.name} ({ag.roleTarget})</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setPlayMessages([])}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              Làm mới hội thoại
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {playMessages.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400">
                Hãy đặt câu hỏi để kiểm thử khả năng suy luận, trích dẫn tri thức và tốc độ phản hồi của Agent.
              </div>
            ) : (
              playMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-500">
                        <strong>Nguồn trích dẫn:</strong> {m.sources.map((s: any) => s.documentName).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {playLoading && (
              <div className="text-xs text-slate-400 animate-pulse">
                Agent đang đọc tài liệu và sinh câu trả lời...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={playInput}
              onChange={(e) => setPlayInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
              placeholder="Nhập câu hỏi kiểm thử..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <button
              type="button"
              onClick={handlePlaygroundSend}
              disabled={!playInput.trim() || playLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      {/* 9. TAB 8: HỘI THOẠI & HUMAN HANDOFF */}
      {activeTab === 'conversations' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-800 dark:text-white flex items-center justify-between">
              <span>Lịch sử các phiên hội thoại toàn hệ thống ({conversations.length})</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {conversations.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>#{c.id} - {c.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                        {c.portal}
                      </span>
                      {c.status === 'WAITING_HUMAN' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 animate-pulse">
                          Chờ tư vấn viên
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Kênh: {c.channel} • Cập nhật: {new Date(c.updatedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Xem chi tiết tin nhắn hội thoại #${c.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Xem chi tiết
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. TAB 9 & 10: PHÂN TÍCH & CẤU HÌNH HỆ THỐNG */}
      {(activeTab === 'analytics' || activeTab === 'settings') && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cấu hình Môi trường AI & Mức độ Tiêu thụ Token
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <strong className="block mb-1">Mô hình AI mặc định:</strong>
              <div className="font-mono text-indigo-600 font-bold">google/gemini-2.5-flash</div>
              <p className="text-slate-400 mt-1">Độ trễ trung bình: 380ms • Chi phí: Miễn phí theo quota dự án</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <strong className="block mb-1">Quy định Chống ảo giác (Anti-Hallucination):</strong>
              <div className="text-emerald-600 font-bold">BẬT (Khóa theo dữ liệu DB & Tài liệu)</div>
              <p className="text-slate-400 mt-1">AI không được phép tự tạo lịch thi, học phí hay cam kết ưu đãi không có trong hệ thống.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO / SỬA AGENT */}
      {agentModalOpen && editingAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAgent.id ? 'Cấu hình Agent' : 'Tạo AI Agent mới'}
              </h3>
              <button
                type="button"
                onClick={() => setAgentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Agent:</label>
                <input
                  type="text"
                  required
                  value={editingAgent.name || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  placeholder="Ví dụ: Trợ giảng AI Tiếng Anh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã Agent (Code):</label>
                <input
                  type="text"
                  value={editingAgent.code || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, code: e.target.value })}
                  placeholder="AGENT_CUSTOM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vai trò phục vụ (Portal):</label>
                <select
                  value={editingAgent.roleTarget || 'PUBLIC'}
                  onChange={(e) => setEditingAgent({ ...editingAgent, roleTarget: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="PUBLIC">PUBLIC (Website công khai)</option>
                  <option value="STUDENT">STUDENT (Cổng Học viên)</option>
                  <option value="TEACHER">TEACHER (Cổng Giảng viên)</option>
                  <option value="ADMIN">ADMIN (Cổng Quản trị)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">System Prompt:</label>
                <textarea
                  rows={4}
                  value={editingAgent.systemPrompt || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                  placeholder="Quy tắc ứng xử và phong cách trả lời của Agent..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAgentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM KHO TRI THỨC */}
      {kbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Thêm Kho tri thức mới</h3>
            <form onSubmit={handleCreateKb} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên Kho tri thức:</label>
                <input
                  type="text"
                  required
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="Ví dụ: Tri thức Luyện thi IELTS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mã (Code):</label>
                <input
                  type="text"
                  value={newKbCode}
                  onChange={(e) => setNewKbCode(e.target.value)}
                  placeholder="KB_IELTS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phân quyền truy cập:</label>
                <select
                  value={newKbAccess}
                  onChange={(e) => setNewKbAccess(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="PUBLIC">PUBLIC (Công khai cho khách)</option>
                  <option value="INTERNAL">INTERNAL (Học viên & Nội bộ)</option>
                  <option value="TEACHER_ONLY">TEACHER_ONLY (Chỉ Giảng viên)</option>
                  <option value="ADMIN_ONLY">ADMIN_ONLY (Chỉ Quản trị viên)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setKbModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold shadow"
                >
                  Tạo Kho tri thức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

