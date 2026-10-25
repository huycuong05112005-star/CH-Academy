import React, { useEffect, useState, useCallback } from 'react'
import { leadsApi } from '../../../api/leads'
import { coursesApi } from '../../../api/courses'
import { classesApi } from '../../../api/classes'
import type { Lead, CreateLeadRequest, AddActivityRequest, ConvertLeadRequest } from '../../../types/lead'
import type { Course } from '../../../types/course'
import type { ClassItem } from '../../../types/class'
import {
  UserPlus,
  Users,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  MessageSquare,
  BookOpen,
  CreditCard,
  Key
} from 'lucide-react'

export const LeadListPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [classList, setClassList] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filters & Pagination
  const [keyword, setKeyword] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 10

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false)
  const [activeLeadForActivity, setActiveLeadForActivity] = useState<Lead | null>(null)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false)
  const [activeLeadForConvert, setActiveLeadForConvert] = useState<Lead | null>(null)
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateLeadRequest>({
    fullName: '',
    phone: '',
    email: '',
    source: 'WALK_IN',
    targetCourseId: undefined,
    notes: ''
  })

  // Activity Form State
  const [activityForm, setActivityForm] = useState<AddActivityRequest>({
    actionType: 'CALL',
    content: ''
  })

  // Convert Form State
  const [convertForm, setConvertForm] = useState<ConvertLeadRequest>({
    studentType: 'ADULT',
    dob: '',
    gender: 'MALE',
    address: '',
    guardianFullName: '',
    guardianPhone: '',
    guardianRelationship: 'FATHER',
    classId: undefined,
    paidAmount: 0,
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    provisionAccount: true
  })

  // Load Courses and Classes
  useEffect(() => {
    const loadCoursesAndClasses = async () => {
      try {
        const [courseRes, classRes] = await Promise.all([
          coursesApi.searchCourses({ page: 0, size: 100 }),
          classesApi.searchClasses({ size: 100 })
        ])
        if (courseRes.success && courseRes.data) {
          setCourses(courseRes.data.content || [])
        }
        if (classRes.success && classRes.data) {
          setClassList(classRes.data.content || [])
        }
      } catch {
        // Silently ignore
      }
    }
    loadCoursesAndClasses()
  }, [])

  // Load Leads list
  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await leadsApi.searchLeads({
        keyword: keyword.trim() || undefined,
        status: selectedStatus || undefined,
        source: selectedSource || undefined,
        page,
        size: pageSize
      })

      if (res.success && res.data) {
        setLeads(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      } else {
        setError(res.message || 'Không thể tải danh sách khách hàng tiềm năng')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [keyword, selectedStatus, selectedSource, page])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    loadLeads()
  }

  // Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setError(null)
    try {
      const res = await leadsApi.createLead(createForm)
      if (res.success) {
        setSuccessMsg('Tạo khách hàng tiềm năng thành công!')
        setIsCreateModalOpen(false)
        setCreateForm({
          fullName: '',
          phone: '',
          email: '',
          source: 'WALK_IN',
          targetCourseId: undefined,
          notes: ''
        })
        loadLeads()
      } else {
        setError(res.message || 'Tạo khách hàng thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi tạo khách hàng')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Add Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLeadForActivity) return
    setFormSubmitting(true)
    try {
      const res = await leadsApi.addActivity(activeLeadForActivity.id, activityForm)
      if (res.success) {
        setSuccessMsg('Đã thêm lịch sử tư vấn thành công!')
        setIsActivityModalOpen(false)
        setActivityForm({ actionType: 'CALL', content: '' })
        loadLeads()
        if (detailLead && detailLead.id === activeLeadForActivity.id) {
          const updatedDetail = await leadsApi.getLeadById(detailLead.id)
          if (updatedDetail.success && updatedDetail.data) {
            setDetailLead(updatedDetail.data)
          }
        }
      } else {
        setError(res.message || 'Không thể thêm hoạt động')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi thêm hoạt động')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Open Convert Modal with preselected class and fee
  const openConvertModal = (lead: Lead) => {
    setActiveLeadForConvert(lead)
    const matchedClass = classList.find((c) => lead.targetCourseId && c.courseId === lead.targetCourseId)
    const course = courses.find((c) => c.id === (matchedClass ? matchedClass.courseId : lead.targetCourseId))
    const fee = course?.defaultTuitionFee || 0

    setConvertForm({
      studentType: 'ADULT',
      dob: '',
      gender: 'MALE',
      address: '',
      guardianFullName: '',
      guardianPhone: lead.phone,
      guardianRelationship: 'FATHER',
      classId: matchedClass?.id,
      paidAmount: fee,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      provisionAccount: true
    })
    setIsConvertModalOpen(true)
  }

  const handleConvertClassChange = (cidStr: string) => {
    const cid = Number(cidStr) || undefined
    const cl = classList.find((c) => c.id === cid)
    const course = courses.find((c) => c.id === cl?.courseId)
    const fee = course?.defaultTuitionFee || 0
    setConvertForm((prev) => ({
      ...prev,
      classId: cid,
      paidAmount: fee
    }))
  }

  // Convert Lead to Student
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLeadForConvert) return
    setFormSubmitting(true)
    try {
      const res = await leadsApi.convertLead(activeLeadForConvert.id, convertForm)
      if (res.success) {
        setSuccessMsg(`Chuyển đổi thành công! Học viên mới: ${res.data?.convertedStudentName || ''} (${res.data?.convertedStudentCode || ''})`)
        setIsConvertModalOpen(false)
        loadLeads()
      } else {
        setError(res.message || 'Chuyển đổi thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi khi chuyển đổi học viên')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Status update directly
  const handleQuickStatusChange = async (leadId: number, status: string) => {
    try {
      const res = await leadsApi.updateLeadStatus(leadId, status)
      if (res.success) {
        setSuccessMsg('Cập nhật trạng thái thành công!')
        loadLeads()
      } else {
        setError(res.message || 'Cập nhật trạng thái thất bại')
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Lỗi cập nhật trạng thái')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Mới</span>
      case 'CONTACTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">Đã liên hệ</span>
      case 'CONSULTING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Đang tư vấn</span>
      case 'APPOINTMENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Hẹn lịch</span>
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Đã chuyển đổi</span>
      case 'LOST':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Không tiếp tục</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'WEBSITE':
        return <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Website</span>
      case 'FACEBOOK':
        return <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Facebook</span>
      case 'HOTLINE':
        return <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200">Hotline</span>
      case 'REFERRAL':
        return <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Giới thiệu</span>
      default:
        return <span className="text-xs bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{source}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5 font-medium">
          <span>Quản trị</span>
          <span>/</span>
          <span className="text-[#142B4A]">Danh sách Leads</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#142B4A]">Tuyển sinh & Khách hàng tiềm năng</h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý phễu tư vấn, theo dõi lịch sử chăm sóc và chuyển đổi khách hàng tiềm năng thành học viên chính thức
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#142B4A] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3860] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng tiềm năng
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Tổng hồ sơ</div>
            <div className="text-xl font-bold text-gray-900">{totalElements}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Hồ sơ mới</div>
            <div className="text-xl font-bold text-gray-900">
              {leads.filter((l) => l.status === 'NEW').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Đang tư vấn / Hẹn lịch</div>
            <div className="text-xl font-bold text-gray-900">
              {leads.filter((l) => l.status === 'CONSULTING' || l.status === 'APPOINTMENT' || l.status === 'CONTACTED').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Đã chuyển đổi</div>
            <div className="text-xl font-bold text-gray-900">
              {leads.filter((l) => l.status === 'CONVERTED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên, SĐT, email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="NEW">Mới</option>
              <option value="CONTACTED">Đã liên hệ</option>
              <option value="CONSULTING">Đang tư vấn</option>
              <option value="APPOINTMENT">Hẹn lịch</option>
              <option value="CONVERTED">Đã chuyển đổi</option>
              <option value="LOST">Không tiếp tục</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
            >
              <option value="">Tất cả nguồn</option>
              <option value="WEBSITE">Website công khai</option>
              <option value="FACEBOOK">Facebook Fanpage</option>
              <option value="HOTLINE">Hotline trung tâm</option>
              <option value="REFERRAL">Người quen giới thiệu</option>
              <option value="WALK_IN">Đến trực tiếp</option>
              <option value="OTHER">Nguồn khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Lọc
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                setSelectedStatus('')
                setSelectedSource('')
                setPage(0)
              }}
              title="Đặt lại bộ lọc"
              className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#142B4A]" />
            Đang tải danh sách khách hàng tiềm năng...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Không có khách hàng tiềm năng nào</h3>
            <p className="text-sm text-gray-500 mb-4">
              Không tìm thấy hồ sơ phù hợp với tiêu chí lọc. Bạn có thể thêm hồ sơ mới ngay.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#142B4A] text-white text-sm font-medium rounded-lg hover:bg-[#1a3860] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left border-collapse text-sm min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] text-xs font-semibold text-slate-500 dark:text-[#A6B4C8] uppercase tracking-wider">
                  <th className="py-3 px-4 w-[110px] whitespace-nowrap">Mã KH</th>
                  <th className="py-3 px-4 min-w-[190px]">Họ và tên</th>
                  <th className="py-3 px-4 w-[170px] whitespace-nowrap">Liên hệ</th>
                  <th className="py-3 px-4 w-[130px] whitespace-nowrap">Nguồn</th>
                  <th className="py-3 px-4 min-w-[180px]">Khóa quan tâm</th>
                  <th className="py-3 px-4 w-[210px] whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 w-[120px] text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A50]/60">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 dark:hover:bg-[#1C293D]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-xs text-[#142B4A] dark:text-[#38BDF8] whitespace-nowrap">
                      {lead.leadCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-[#E8EEF7]">{lead.fullName}</div>
                      {lead.convertedStudentCode && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Học viên: {lead.convertedStudentCode}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-[#E8EEF7] text-xs font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#A6B4C8] text-xs mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getSourceBadge(lead.source)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-[#E8EEF7] font-medium text-xs">
                      {lead.targetCourseName || <span className="text-slate-400 font-normal italic">Chưa chọn</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(lead.status)}
                        {lead.status !== 'CONVERTED' && (
                          <select
                            value={lead.status}
                            onChange={(e) => handleQuickStatusChange(lead.id, e.target.value)}
                            className="text-xs border border-slate-200 dark:border-[#2A3A50] rounded px-1.5 py-0.5 bg-white dark:bg-[#1C293D] text-slate-700 dark:text-[#E8EEF7]"
                            title="Thay đổi nhanh trạng thái"
                          >
                            <option value="NEW">Mới</option>
                            <option value="CONTACTED">Đã liên hệ</option>
                            <option value="CONSULTING">Đang tư vấn</option>
                            <option value="APPOINTMENT">Hẹn lịch</option>
                            <option value="LOST">Không tiếp tục</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveLeadForActivity(lead)
                            setIsActivityModalOpen(true)
                          }}
                          title="Ghi nhận hoạt động tư vấn"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const res = await leadsApi.getLeadById(lead.id)
                            if (res.success && res.data) {
                              setDetailLead(res.data)
                            } else {
                              setDetailLead(lead)
                            }
                          }}
                          title="Xem chi tiết & lịch sử"
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        {lead.status !== 'CONVERTED' && (
                          <button
                            onClick={() => openConvertModal(lead)}
                            title="Chuyển đổi thành Học viên"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-semibold transition-colors border border-green-200"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Chuyển đổi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && leads.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
            <div>
              Hiển thị <strong>{leads.length}</strong> trên tổng số <strong>{totalElements}</strong> khách hàng tiềm năng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREATE LEAD */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-[#142B4A]">Thêm khách hàng tiềm năng</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={createForm.email || ''}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nguồn khách hàng</label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="WALK_IN">Đến trực tiếp</option>
                    <option value="HOTLINE">Hotline</option>
                    <option value="FACEBOOK">Facebook Fanpage</option>
                    <option value="REFERRAL">Người quen giới thiệu</option>
                    <option value="WEBSITE">Website</option>
                    <option value="OTHER">Nguồn khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Khóa học quan tâm</label>
                  <select
                    value={createForm.targetCourseId || ''}
                    onChange={(e) => setCreateForm({ ...createForm, targetCourseId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="">-- Chưa xác định --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú nhu cầu tư vấn</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú trình độ hiện tại, thời gian mong muốn học, lưu ý đặc biệt..."
                  value={createForm.notes || ''}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#142B4A] text-white text-sm font-medium rounded-lg hover:bg-[#1a3860] transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACTIVITY */}
      {isActivityModalOpen && activeLeadForActivity && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-[#142B4A]">Ghi nhận hoạt động tư vấn</h2>
                <p className="text-xs text-gray-500">{activeLeadForActivity.fullName} ({activeLeadForActivity.phone})</p>
              </div>
              <button onClick={() => setIsActivityModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hình thức tương tác</label>
                <select
                  value={activityForm.actionType}
                  onChange={(e) => setActivityForm({ ...activityForm, actionType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                >
                  <option value="CALL">Gọi điện thoại</option>
                  <option value="MESSAGE">Nhắn tin (Zalo / SMS / Email)</option>
                  <option value="MEETING">Hẹn gặp trực tiếp tại trung tâm</option>
                  <option value="NOTE">Ghi chú nội bộ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nội dung trao đổi / kết quả <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi chi tiết kết quả cuộc gọi, phản hồi học phí, lịch hẹn test đầu vào..."
                  value={activityForm.content}
                  onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#142B4A] text-white text-sm font-medium rounded-lg hover:bg-[#1a3860] transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : 'Ghi nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT TO STUDENT */}
      {isConvertModalOpen && activeLeadForConvert && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-green-50">
              <div>
                <h2 className="text-base font-bold text-green-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-700" />
                  Chuyển đổi thành Học viên chính thức
                </h2>
                <p className="text-xs text-green-700">{activeLeadForConvert.fullName} ({activeLeadForConvert.phone})</p>
              </div>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phân loại học viên</label>
                <select
                  value={convertForm.studentType}
                  onChange={(e) => setConvertForm({ ...convertForm, studentType: e.target.value as 'KID' | 'ADULT' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                >
                  <option value="ADULT">Người lớn (Người trưởng thành)</option>
                  <option value="KID">Trẻ em (Dưới 18 tuổi - có người giám hộ)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={convertForm.dob || ''}
                    onChange={(e) => setConvertForm({ ...convertForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={convertForm.gender || 'MALE'}
                    onChange={(e) => setConvertForm({ ...convertForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                  value={convertForm.address || ''}
                  onChange={(e) => setConvertForm({ ...convertForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142B4A]"
                />
              </div>

              {convertForm.studentType === 'KID' && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase">Thông tin phụ huynh / Người giám hộ</h4>
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">Họ tên phụ huynh</label>
                    <input
                      type="text"
                      placeholder="Họ tên bố/mẹ..."
                      value={convertForm.guardianFullName || ''}
                      onChange={(e) => setConvertForm({ ...convertForm, guardianFullName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded text-sm bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">SĐT phụ huynh</label>
                      <input
                        type="tel"
                        value={convertForm.guardianPhone || ''}
                        onChange={(e) => setConvertForm({ ...convertForm, guardianPhone: e.target.value })}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-800 mb-1">Quan hệ</label>
                      <select
                        value={convertForm.guardianRelationship || 'FATHER'}
                        onChange={(e) => setConvertForm({ ...convertForm, guardianRelationship: e.target.value })}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded text-sm bg-white"
                      >
                        <option value="FATHER">Bố</option>
                        <option value="MOTHER">Mẹ</option>
                        <option value="OTHER">Người bảo hộ khác</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Enrollment & Tuition Automation */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Xác nhận đóng học phí & Cấp tài khoản tự động</span>
                </div>
                <p className="text-xs text-slate-600">
                  Khi khách hàng đã thanh toán, hãy chọn lớp học để hệ thống tự động ghi danh, sinh học phí, biên lai thu tiền và gửi tài khoản qua Email: <strong>{activeLeadForConvert?.email || '(Chưa có email)'}</strong>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn Lớp học ghi danh
                  </label>
                  <select
                    value={convertForm.classId || ''}
                    onChange={(e) => handleConvertClassChange(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Chưa xếp lớp (Chỉ tạo hồ sơ học viên) --</option>
                    {classList.map((cl) => {
                      const course = courses.find((c) => c.id === cl.courseId)
                      return (
                        <option key={cl.id} value={cl.id}>
                          {cl.name} ({cl.code}) — {course?.name} {course?.defaultTuitionFee ? `[${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.defaultTuitionFee)}]` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {convertForm.classId && (
                  <div className="space-y-3 pt-2 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Số tiền khách đã chuyển (VND)
                        </label>
                        <input
                          type="number"
                          step="50000"
                          value={convertForm.paidAmount || 0}
                          onChange={(e) => setConvertForm({ ...convertForm, paidAmount: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-bold text-emerald-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Hình thức thanh toán
                        </label>
                        <select
                          value={convertForm.paymentMethod || 'BANK_TRANSFER'}
                          onChange={(e) => setConvertForm({ ...convertForm, paymentMethod: e.target.value })}
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white"
                        >
                          <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                          <option value="CASH">Tiền mặt</option>
                          <option value="POS">Quẹt thẻ POS</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mã tham chiếu ngân hàng (nếu có)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: MB-84729103"
                        value={convertForm.referenceNumber || ''}
                        onChange={(e) => setConvertForm({ ...convertForm, referenceNumber: e.target.value })}
                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-mono bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-blue-200">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        Tự động cấp tài khoản & gửi Email cho học viên:
                      </span>
                      <input
                        type="checkbox"
                        checked={convertForm.provisionAccount ?? true}
                        onChange={(e) => setConvertForm({ ...convertForm, provisionAccount: e.target.checked })}
                        className="w-4 h-4 text-[#142B4A] rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang chuyển đổi...' : 'Xác nhận tạo học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & TIMELINE */}
      {detailLead && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-[#142B4A]">Chi tiết hồ sơ khách hàng</h2>
                <p className="text-xs text-gray-500">Mã: {detailLead.leadCode}</p>
              </div>
              <button onClick={() => setDetailLead(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Basic Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Họ và tên</span>
                  <span className="font-semibold text-gray-900 text-sm">{detailLead.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Số điện thoại</span>
                  <span className="font-semibold text-gray-900">{detailLead.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Email</span>
                  <span className="font-semibold text-gray-900">{detailLead.email || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Khóa quan tâm</span>
                  <span className="font-semibold text-gray-900">{detailLead.targetCourseName || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Nguồn tiếp cận</span>
                  <span className="font-semibold text-gray-900">{detailLead.source}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Trạng thái</span>
                  <span className="mt-0.5 inline-block">{getStatusBadge(detailLead.status)}</span>
                </div>
              </div>

              {detailLead.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Ghi chú nhu cầu</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                    {detailLead.notes}
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Lịch sử tư vấn & tương tác</h4>
                  <button
                    onClick={() => {
                      setActiveLeadForActivity(detailLead)
                      setIsActivityModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#142B4A] font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm tương tác
                  </button>
                </div>

                {!detailLead.activities || detailLead.activities.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Chưa có lịch sử chăm sóc nào được ghi nhận.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 pl-8">
                    {detailLead.activities.map((act) => (
                      <div key={act.id} className="relative text-xs">
                        <div className="absolute -left-8 top-1 w-2.5 h-2.5 rounded-full bg-[#142B4A] border-2 border-white ring-2 ring-gray-100" />
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="font-semibold text-gray-700">{act.actionType}</span>
                          <span>•</span>
                          <span>{new Date(act.activityTime || act.createdAt).toLocaleString('vi-VN')}</span>
                          {act.staffName && (
                            <>
                              <span>•</span>
                              <span>NV: {act.staffName}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-gray-800 text-sm">{act.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setDetailLead(null)}
                className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
