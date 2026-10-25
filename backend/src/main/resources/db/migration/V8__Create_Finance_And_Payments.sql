-- ==============================================================================
-- Flyway Migration V8: Create Receivables, Payments, Allocations & Refunds
-- ==============================================================================

-- 1. Receivables Table (Khoản phải thu)
CREATE TABLE IF NOT EXISTS receivables (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    enrollment_id BIGINT REFERENCES enrollments(id) ON DELETE SET NULL,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rec_status CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_rec_amounts CHECK (total_amount > 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_receivables_code ON receivables(code);
CREATE INDEX IF NOT EXISTS idx_receivables_student ON receivables(student_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due ON receivables(due_date);

-- 2. Payments Table (Giao dịch nộp tiền)
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER')),
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_code ON payments(payment_code);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 3. Payment Allocations Table (Phân bổ tiền thanh toán vào khoản phải thu)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    receivable_id BIGINT NOT NULL REFERENCES receivables(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alloc_amount CHECK (allocated_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_receivable ON payment_allocations(receivable_id);

-- 4. Refunds Table (Hoàn tiền)
CREATE TABLE IF NOT EXISTS refunds (
    id BIGSERIAL PRIMARY KEY,
    refund_code VARCHAR(50) UNIQUE NOT NULL,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_refund_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_refunds_code ON refunds(refund_code);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);

-- 5. Seed Initial Receivable for Seeded Enrollment (HV20240001)
INSERT INTO receivables (code, enrollment_id, student_id, title, total_amount, paid_amount, due_date, status)
SELECT
    'REC20240001',
    e.id,
    e.student_id,
    'Học phí Lớp Tiếng Anh Trẻ Em K01',
    e.final_fee,
    1500000.00,
    CURRENT_DATE + INTERVAL '14 days',
    'PARTIALLY_PAID'
FROM enrollments e
JOIN students s ON s.id = e.student_id
WHERE s.student_code = 'HV20240001'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- Seed Payment
INSERT INTO payments (payment_code, student_id, amount, payment_method, payment_date, notes)
SELECT
    'PAY20240001',
    s.id,
    1500000.00,
    'BANK_TRANSFER',
    CURRENT_DATE,
    'Phụ huynh chuyển khoản học phí đợt 1'
FROM students s WHERE s.student_code = 'HV20240001'
ON CONFLICT (payment_code) DO NOTHING;

-- Seed Allocation
INSERT INTO payment_allocations (payment_id, receivable_id, allocated_amount)
SELECT
    p.id,
    r.id,
    1500000.00
FROM payments p, receivables r
WHERE p.payment_code = 'PAY20240001' AND r.code = 'REC20240001';
