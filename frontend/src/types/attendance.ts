export interface AttendanceRecord {
  id: number;
  sessionId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  topic?: string | null;
  studentId: number;
  studentCode: string;
  studentFullName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string | null;
  recordedById?: number | null;
  recordedByName?: string | null;
  recordedAt: string;
}

export interface AttendanceStats {
  studentId: number;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRatePercent: number;
}

export interface MarkAttendancePayload {
  studentId: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
}

export interface BulkAttendancePayload {
  records: MarkAttendancePayload[];
}

export interface ClassSessionItem {
  id: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  topic?: string | null;
  status: string;
}
