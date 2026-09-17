# 📘 Cohort Academic Intelligence & Analytics Platform (CAIP)
## Comprehensive Technical Blueprint & Specification Document for Antigravity IDE / AI Coding Agents
**Project Code:** CAIP-BAHRI-BATCH13  
**Target:** Faculty of Medicine & Surgery, University of Bahri (`bahri.edu.sd`) — Batch 13 (Unified Cohort)  
**Document Version:** 3.0 (Production-Ready Architecture & Academic Regulations Specification)

---

## 1. System Overview & Academic Context

### 1.1 Program & Cohort Profile
* **Target Cohort:** **Batch 13** of the Faculty of Medicine & Surgery, University of Bahri.
* **Unified Class Structure:** The cohort represents a unified class resulting from the combination of students admitted in 2023 (delayed by war conditions) and 2024, alongside returning and transferred students from earlier cohorts (batches 21 and 22). The active student count in Year 1 stands at approximately 269 students.
* **Academic Program Scope:** 6-year professional medical degree (12 semesters) divided into:
  * **Pre-Clinical Phase:** Year 1 to Year 3.
  * **Clinical Phase:** Year 4 to Year 6.
* **Data Origin:** The official university portal (`bahri.edu.sd`) publishes individual student result slips per ID. Aggregated results are compiled into structured Excel files (reference: `multi - Copy.xlsx`).
* **Platform Purpose:** A private, secure, highly responsive academic analytics web application providing:
  1. Longitudinal student performance and GPA tracking over 6 years.
  2. Multi-tier leaderboards (CGPA, Academic Year GPA, Semester GPA, and Course-specific rankings).
  3. Cohort origin filtering (`Total Batch 13`, `Group 23`, `Group 24`, `Legacy transfers`).
  4. Course-level grade distribution curves (Bell curves) and target GPA simulators.
  5. Privacy-first architecture: server-side data masking, identity challenge authentication, and administrative controls.

---

## 2. Technology Stack & Architectural Decisions

| Layer | Selected Tech | Rationale & Architectural Value |
|---|---|---|
| **Framework** | **Next.js 14/15 (App Router, TypeScript)** | React Server Components (RSC), built-in Server Actions, optimized data fetching, and robust i18n routing. |
| **Styling & Design System** | **Tailwind CSS + shadcn/ui + Lucide Icons** | Accessible UI components with a custom Royal Violet design system supporting seamless Light/Dark themes. |
| **Backend & Database** | **Supabase (PostgreSQL, Supabase Auth, RLS)** | Managed PostgreSQL with native Row-Level Security, instant REST APIs, automated JSON serialization, and built-in auth. |
| **Data Grid Engine** | **@tanstack/react-table (v8)** | Headless table logic supporting multi-column sorting, client/server pagination, and sticky frozen columns for mobile screens. |
| **Data Visualizations** | **Recharts** | Lightweight SVG charting for academic trajectory curves and grade distribution histograms. |
| **Validation & Ingestion** | **xlsx (SheetJS) + Zod** | Binary `.xlsx` parsing coupled with runtime schema validation to reject malformed academic spreadsheets. |
| **Localization (i18n)** | **next-intl** | First-class Arabic (RTL, default) and English (LTR) support with dynamic single-column student name swapping. |
| **Theme Management** | **next-themes** | Dark/Light/System theme toggling without hydration mismatch. |

---

## 3. Academic Regulations, Grading System & Mathematical Engine

### 3.1 Faculty Weighting Model (Graduation CGPA)
The Faculty of Medicine assigns cumulative percentage weights to each academic year:
* **Year 1 (Pre-Clinical I):** $5\% \quad (w_1 = 0.05)$
* **Year 2 (Pre-Clinical II):** $10\% \quad (w_2 = 0.10)$
* **Year 3 (Pre-Clinical III):** $10\% \quad (w_3 = 0.10)$
* **Year 4 (Clinical I):** $15\% \quad (w_4 = 0.15)$
* **Year 5 (Clinical II):** $20\% \quad (w_5 = 0.20)$
* **Year 6 (Clinical III):** $40\% \quad (w_6 = 0.40)$
* **Total:** $100\% \quad (\sum_{k=1}^6 w_k = 1.00)$

### 3.2 Standard Grade Points Scale
| Score Range (%) | Letter Grade | Grade Points ($P_i$) |
|---|---|---|
| 80 – 100 | **A** | 4.0 |
| 70 – 79 | **B+** | 3.5 |
| 60 – 69 | **B** | 3.0 |
| 50 – 59 | **C** | 2.0 |
| 0 – 49 | **F** | 0.0 |

### 3.3 The 18 Academic Symbols & Business Logic Taxonomy

Academic symbols in university result slips must be strictly decoupled into **Course-Level Codes** and **Student/Year-Level Statuses**:

#### A. Course-Level Codes (`course_grade_note`)
| Code | Arabic Meaning | English Meaning | Mathematical & System Effect | UI Representation |
|---|---|---|---|---|
| **Sup** | ملحق | Supplementary Exam | Student sat for a repeat exam; **grade points are capped at 2.0 (Grade C)** regardless of score. | Orange Badge `[ملحق / Sup]` |
| **Sub** | بديل | Substitute Exam | Student sat for a substitute exam with verified excuse; **grade points are uncapped** (full A–F range). | Blue Badge `[بديل / Sub]` |
| **Cro** | مادة محمولة | Carried Over Course | Failed course carried into subsequent semester; tracked across multiple terms. | Slate Badge `[محمولة / Cro]` |
| **Inc** | غير مكتمل | Incomplete Assessment | Assessment incomplete; **course credit hours are excluded from the GPA denominator** until resolved. | Yellow Badge `[غير مكتمل / Inc]` |
| **Rtk** | إعادة حضور | Retake Entire Course | Mandatory re-attendance of lectures and labs in the following term. | Purple Badge `[إعادة حضور / Rtk]` |
| **Rst** | إعادة جلوس | Resit Exam Only | Sitting for final examination only without re-attendance. | Cyan Badge `[إعادة امتحان / Rst]` |
| **NONE** | عادي | Regular Completion | Standard course grading without conditions. | Normal Grade Letter |

#### B. Student/Year-Level Academic Remarks (`academic_remark`)
| Code | Arabic Meaning | Academic Status | System Handling |
|---|---|---|---|
| **Pas** | نجاح | Pass | Standard promotion; visible on active leaderboards. |
| **Prm** | منقول | Promoted with Conditions | Promoted to next year level while carrying allowed credits. |
| **Rpt** | إعادة سنة | Repeat Academic Year | Student re-registers current academic year; previous records archived. |
| **Rdo** | إعادة دراسة | Re-study Year | Programmatic re-study status; archived under previous academic year tag. |
| **Frz** | تجميد | Academic Freeze | Status paused; excluded from active cohort rankings without negative penalty. |
| **Sus** | تعليق دراسة | Academic Suspension | Administrative suspension; profile access retained in read-only state. |
| **Wdr** | انسحاب | Withdrawal | Officially withdrawn from the faculty; excluded from active leaderboards. |
| **Crg** | إيقاف تسجيل | Registration Block | Registration hold; flagged in admin dashboard. |
| **Dsc** | فصل مؤقت | Temporary Dismissal | Excluded from active student views for designated term. |
| **Dsm** | فصل نهائي | Permanent Dismissal | Account deactivated and purged from public directory. |
| **Rad** | إعادة قيد | Readmission | Re-activated account mapped to current term. |
| **Rrg** | إعادة تسجيل | Re-registration | Administrative re-enrollment tag. |
| **Rej** | رفض | Rejected Application | Enrollment request denied. |
| **PND** | قيد المعالجة | Withheld / Pending | Result withheld or under review; excluded from cohort ranking and mean calculations. |

### 3.4 Mathematical Calculation Algorithms

#### A. Semester GPA:
$$\text{GPA}_{\text{sem}} = \frac{\sum_{i \in \text{Valid Courses}} (P_i \times C_i)}{\sum_{i \in \text{Valid Courses}} C_i}$$
*Rules:*
* If course note is `Inc` or grade is pending, exclude $C_i$ from denominator.
* If course note is `Sup`, $\min(P_i, 2.0)$.

#### B. Year GPA:
$$\text{GPA}_{\text{year}} = \frac{\sum_{\text{Year Courses}} (P_j \times C_j)}{\sum_{\text{Year Courses}} C_j}$$

#### C. In-Progress Progressive Weighted CGPA:
For actively enrolled students who have not completed all 6 years, calculate the weighted average based exclusively on completed years to prevent artificial score suppression:
$$\text{CGPA}_{\text{current}} = \frac{\sum_{k \in \text{Completed Years}} (w_k \times \text{GPA}_{\text{year}, k})}{\sum_{k \in \text{Completed Years}} w_k}$$

*Worked Example:*
* Student completes **Year 1** with $\text{GPA} = 3.60$.
  $$\text{CGPA} = \frac{0.05 \times 3.60}{0.05} = 3.60$$
* Student completes **Year 2** with $\text{GPA} = 3.20$.
  $$\text{CGPA} = \frac{(0.05 \times 3.60) + (0.10 \times 3.20)}{0.05 + 0.10} = \frac{0.18 + 0.32}{0.15} = \frac{0.50}{0.15} = 3.333$$

#### D. Partial Semester Rule (Semester 1 Published, Semester 2 Pending):
1. Tag semester state as `partial`.
2. Do not compute an official `Year GPA` or advance official graduation `CGPA`.
3. Display:
   * **Official Completed CGPA:** Derived from previously verified academic years.
   * **Provisional Estimated CGPA:** Computed using an interim weight equal to $0.5 \times w_k$.

#### E. Handling Withheld / Pending Results (`PND`):
* The student's rank is explicitly set to `NULL` (displayed as `—` or `Pending`).
* The student is excluded from cohort grade averages and percentile distributions.
* The student portal displays an informative banner:
  > *"لم يتم اعتماد نتيجتك رسمياً لهذا الفصل من الكلية بعد. سيتم تحديث ترتيبك ومعدلك فور صدورها."*

---

## 4. Database Architecture & Supabase DDL SQL

Execute this script directly within the Supabase SQL Editor:

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
CREATE TYPE student_status AS ENUM ('active', 'repeated', 'transferred', 'leave', 'frozen', 'suspended', 'withdrawn', 'dismissed');
CREATE TYPE semester_status AS ENUM ('completed', 'partial', 'upcoming');
CREATE TYPE course_grade_note AS ENUM ('NONE', 'Sup', 'Sub', 'Cro', 'Inc', 'Rtk', 'Rst');
CREATE TYPE academic_remark AS ENUM ('Pas', 'Prm', 'Rpt', 'Rdo', 'Frz', 'Sus', 'Wdr', 'Dsc', 'Dsm', 'Rad', 'Rrg', 'Crg', 'Rej', 'PND');

-- 2. Students Table (Cohort Directory & Whitelist)
CREATE TABLE public.students (
    student_id VARCHAR(20) PRIMARY KEY,              -- University ID (e.g. '1100305423')
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    origin_tag VARCHAR(15) NOT NULL,                 -- '23', '24', 'legacy_22', 'legacy_21'
    status student_status DEFAULT 'active',
    current_year_level INT DEFAULT 1 CHECK (current_year_level BETWEEN 1 AND 6),
    is_claimed BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_name_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_origin ON public.students(origin_tag);
CREATE INDEX idx_students_auth ON public.students(auth_user_id);

-- 3. Semesters Table
CREATE TABLE public.semesters (
    semester_id VARCHAR(10) PRIMARY KEY,             -- 'Y1_S1', 'Y1_S2', ... 'Y6_S2'
    academic_year VARCHAR(20) NOT NULL,              -- '2023-2024'
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 6),
    semester_num INT NOT NULL CHECK (semester_num BETWEEN 1 AND 12),
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    status semester_status DEFAULT 'completed'
);

-- 4. Courses Table
CREATE TABLE public.courses (
    course_code VARCHAR(30) PRIMARY KEY,
    semester_id VARCHAR(10) REFERENCES public.semesters(semester_id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    credit_hours NUMERIC(3, 1) NOT NULL CHECK (credit_hours > 0)
);

-- 5. Grade Scale Reference
CREATE TABLE public.grade_scale (
    grade_letter VARCHAR(5) PRIMARY KEY,
    min_score NUMERIC(5,2) NOT NULL,
    max_score NUMERIC(5,2) NOT NULL,
    points NUMERIC(3, 2) NOT NULL
);

INSERT INTO public.grade_scale (grade_letter, min_score, max_score, points) VALUES
('A',  80, 100, 4.0),
('B+', 70, 79,  3.5),
('B',  60, 69,  3.0),
('C',  50, 59,  2.0),
('F',   0, 49,  0.0)
ON CONFLICT (grade_letter) DO NOTHING;

-- 6. Student Grades Table
CREATE TABLE public.student_grades (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES public.students(student_id) ON DELETE CASCADE,
    course_code VARCHAR(30) REFERENCES public.courses(course_code) ON DELETE CASCADE,
    semester_id VARCHAR(10) REFERENCES public.semesters(semester_id) ON DELETE CASCADE,
    grade_letter VARCHAR(5) REFERENCES public.grade_scale(grade_letter),
    numeric_score NUMERIC(5,2),
    note course_grade_note DEFAULT 'NONE',
    is_supplementary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_code, semester_id)
);

CREATE INDEX idx_student_grades_lookup ON public.student_grades(student_id, semester_id);

-- 7. GPA History & Standing Table
CREATE TABLE public.student_gpa_history (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES public.students(student_id) ON DELETE CASCADE,
    semester_id VARCHAR(10) REFERENCES public.semesters(semester_id) ON DELETE CASCADE,
    year_level INT NOT NULL,
    semester_gpa NUMERIC(4, 3),
    year_gpa NUMERIC(4, 3),
    cumulative_gpa NUMERIC(4, 3) NOT NULL,
    rank_overall INT,
    rank_origin_cohort INT,
    remark academic_remark DEFAULT 'Pas',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

-- 8. Platform Settings Table
CREATE TABLE public.platform_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_config (key, value) VALUES
('announcement', '{"enabled": true, "text_ar": "مرحباً بكم في منصة تحليلات الدفعة 13", "text_en": "Welcome to Batch 13 Academic Intelligence Platform"}'),
('visibility_toggles', '{"mask_all_names": false, "allow_student_registration": true, "show_semester_gpa": true}')
ON CONFLICT (key) DO NOTHING;

-- 9. Secure Server-Side Masked Public View (Anti-IDOR)
CREATE OR REPLACE VIEW public.vw_public_leaderboard AS
SELECT 
    s.student_id,
    CONCAT(SUBSTRING(s.student_id FROM 1 FOR 2), '****', SUBSTRING(s.student_id FROM LENGTH(s.student_id)-1 FOR 2)) AS masked_id,
    CASE 
        WHEN (SELECT (value->>'mask_all_names')::boolean FROM public.platform_config WHERE key = 'visibility_toggles') = TRUE THEN 'طالب مستتر'
        WHEN s.is_name_visible = FALSE THEN 'طالب مستتر'
        ELSE s.name_ar 
    END AS display_name_ar,
    CASE 
        WHEN (SELECT (value->>'mask_all_names')::boolean FROM public.platform_config WHERE key = 'visibility_toggles') = TRUE THEN 'Anonymous Student'
        WHEN s.is_name_visible = FALSE THEN 'Anonymous Student'
        ELSE s.name_en 
    END AS display_name_en,
    s.origin_tag,
    s.status,
    gpa.semester_id,
    gpa.year_level,
    gpa.semester_gpa,
    gpa.year_gpa,
    gpa.cumulative_gpa,
    gpa.rank_overall,
    gpa.rank_origin_cohort,
    gpa.remark
FROM public.students s
JOIN public.student_gpa_history gpa ON s.student_id = gpa.student_id;

-- 10. Row Level Security Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_gpa_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.vw_public_leaderboard TO anon, authenticated;

CREATE POLICY "Student read own record" ON public.students
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Student read own grades" ON public.student_grades
FOR SELECT USING (
    student_id IN (SELECT student_id FROM public.students WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Admin full access students" ON public.students
FOR ALL USING (auth.jwt() ->> 'email' = 'admin@bahri.edu.sd');
```

---

## 5. Year 1 Dataset Mapping & Migration Strategy

### 5.1 Excel File Architecture (`multi - Copy.xlsx`)
* **Header Metadata:** Row 2 holds column categories; Row 3 holds exact Course Names; Row 4 contains Credit Hours.
* **Student Data Rows:** Row 5 through Row 273 (269 active students).
* **Column Offsets (0-Indexed):**
  * `Col 0`: ID (e.g., `1100305423`)
  * `Col 1`: Name (EN) (`MOHAMMED AHMED ELSIDDIG MOHAMMEDNOUR`)
  * `Col 2`: Name (AR) (`محمد أحمد الصديق محمد نور`)
  * `Col 3`: Full Year 1 GPA (`3.567568`)
  * `Col 4`: Official Remark (`Pas`)
  * `Cols 6–13`: Semester 1 Courses (Cell Biology, Chemistry, English I, English II, Sociology/Psychology, Mathematics, Medical Physics, University Study Skills). Total Credits: 22.
  * `Col 14`: Semester 1 Computed GPA.
  * `Cols 15–19`: Semester 2 Courses (Biomolecules, Community Health, Homeostasis, Human Biology, Medical Terminology). Total Credits: 15.
  * `Col 20`: Semester 2 Computed GPA.
  * `Origin Tag Extraction`: Derived from `ID.slice(-2)` (`23`, `24`, `22`, `21`).

### 5.2 Transition from Mock Data to Real Data (Migration Plan)
1. **Idempotent Upsert Queries:**
   Use SQL `ON CONFLICT (student_id) DO UPDATE` for student records. Existing claimed user accounts (`auth_user_id`, email) remain untouched while grade records update seamlessly.
2. **Atomic Ingestion Transaction:**
   Wrap the import in a database transaction (`BEGIN ... COMMIT`). If parsing fails mid-sheet, the database rolls back to prevent corrupt data states.
3. **Admin Reset Button:**
   The admin interface includes an authenticated emergency action: `[تصفير الدرجات التجريبية / Flush Mock Grades]` to purge grade records and GPA tables while keeping student directories intact before live publishing.

---

## 6. Authentication, Security & Anti-Hijacking Protocol

### 6.1 The Whitelist Identity Challenge Flow
Because university IDs are sequential and publicly known, open self-registration invites malicious hijacking. Registration requires verification:

```
[Student Registration Screen]
  │
  ├── Required Inputs:
  │     1. University ID (e.g. 1100305423)
  │     2. Email Address & Password
  │     3. Identity Challenge Question:
  │        "ما هو تقديرك في مقرر الكيمياء (Chemistry) في كشف درجاتك الرسمي؟"
  │
  ▼
[Next.js Server Action: /api/student-claim]
  │
  ├── 1. Locate student in public.students by student_id.
  │      If not found: Throw error "الرقم الجامعي غير مسجل ضمن الدفعة 13".
  │      If is_claimed = true: Throw error "الحساب مفعل مسبقاً. سجل دخولك أو راجع المشرف".
  │
  ├── 2. Validate Challenge Answer against public.student_grades for that course.
  │      If mismatch: Throw error "بيانات التحقق غير مطابقة لكشف الدرجات الرسمي".
  │
  ├── 3. Create Supabase Auth user via Admin API (auto-confirmed).
  │
  └── 4. Update student record:
         SET is_claimed = TRUE, is_approved = TRUE, auth_user_id = new_user.id.
```

---

## 7. UI/UX Design System & Layout Requirements

### 7.1 Royal Violet Design System
* **Light Palette:**
  * Background: `#FAF8FF` (Lavender Frost)
  * Surface/Card: `#FFFFFF` (Border: `#EDE8F8`)
  * Primary: `#6D28D9` (Royal Violet)
  * Accent: `#8B5CF6` (Vibrant Violet)
  * Text Primary: `#1E1035`
* **Dark Palette:**
  * Background: `#0A0614` (Midnight Abyss)
  * Surface/Card: `#130D24` (Border: `#261A45`)
  * Primary: `#8B5CF6` (Electric Violet)
  * Text Primary: `#F5F3FF`

### 7.2 Language Engine & Single Adaptive Name Column
* Routes structured under `/[locale]/...` (`/ar` default RTL, `/en` LTR).
* Instead of dual Arabic and English columns, use a single dynamic table column:
  ```tsx
  const displayName = locale === 'ar' ? row.original.display_name_ar : row.original.display_name_en;
  ```

### 7.3 Mobile Responsive Grid Architecture
* On small screens (< 768px):
  * **Frozen Sticky Columns:** Column 1 (Masked ID) and Column 2 (Student Name) remain fixed on the scroll origin side during horizontal swipes.
  * **Course Grades & GPAs:** Horizontally scrollable with visual drop-shadow indicators.
  * **Filter Drawers:** Segment filters collapse into a slide-up bottom drawer.

---

## 8. Feature Modules Matrix

### 8.1 Multi-Tier Leaderboards
* **Timeframe Segment Tabs:**
  1. `[المعدل التراكمي الشامل (CGPA)]`: Full weighted cumulative trajectory.
  2. `[ترتيب السنة الأكاديمية]`: Full Year 1 GPA rank.
  3. `[ترتيب الفصول المنفصلة]`: Discrete Semester 1 / Semester 2 ranks.
  4. `[شرف المقررات]`: Course-level honor roll (highest grades in Chemistry, Anatomy, etc.).
* **Cohort Filter Pills:**
  `[الدفعة 13 كاملة (269)]` | `[مجموعة 23]` | `[مجموعة 24]` | `[المنضمون]`.

### 8.2 Student Personal Analytics Portal
* **Trajectory Chart:** Visual line plot displaying semester-by-semester GPA trends.
* **Interactive Course List:** Displaying grade letters, credits, and smart badge tooltips explaining academic symbols (`Sup`, `Sub`, `Cro`, `Inc`).
* **Percentile Indicator:** Dynamic badge calculating student percentile standing within the cohort.

### 8.3 Value-Added Tools
1. **Target & What-If GPA Simulator:**
   Enables medical students to adjust hypothetical grades for upcoming clinical years (Years 2 to 6) to project graduation honors.
2. **Grade Bell Curve (Distribution):**
   Interactive bar chart demonstrating cohort grade distribution ($A, B+, B, C, F$) for any selected course.
3. **Digital Report Card Export:**
   Client-side rendering of an official-looking digital standing card exportable as PNG/PDF.
4. **Cohort Announcement Banner:**
   Top-level global announcement banner editable from the admin dashboard.

---

## 9. Next.js 14 App Directory Architecture

```text
caip-bahri/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                 # Providers: Theme, Locale, Auth, Header, Footer
│   │   ├── page.tsx                   # Public Leaderboard & Analytics Hub
│   │   ├── login/page.tsx             # Student Login
│   │   ├── register/page.tsx          # Whitelist Identity Quiz & Claim
│   │   ├── student/
│   │   │   └── [id]/page.tsx          # Authenticated Personal Dashboard
│   │   ├── simulator/page.tsx         # What-If Clinical GPA Simulator
│   │   └── admin/
│   │       ├── page.tsx               # Admin Whitelist Approvals & Student Management
│   │       ├── upload/page.tsx        # Drag-and-drop Excel Ingestion
│   │       └── settings/page.tsx      # Privacy Switches & Banner Controls
│   ├── api/
│   │   ├── ingest-excel/route.ts      # Server-side Excel processing & DB Upsert
│   │   └── student-claim/route.ts     # Anti-hijack challenge verification
│   └── globals.css                    # Royal Violet CSS Variables
├── components/
│   ├── ui/                            # shadcn primitives (Button, Card, Dialog, Table, Tabs, Badge)
│   ├── leaderboard/
│   │   ├── data-table.tsx             # TanStack Table with sticky columns & multi-sort
│   │   ├── columns.tsx                # Dynamic language column definitions
│   │   └── cohort-filter.tsx          # Batch 13 / 23 / 24 / Legacy pill filters
│   ├── charts/
│   │   ├── trajectory-chart.tsx       # Recharts 6-Year Trajectory Line Plot
│   │   └── bell-curve-chart.tsx       # Recharts Course Grade Distribution Histogram
│   ├── shared/
│   │   ├── navbar.tsx                 # Language Selector, Dark Mode Toggle, Auth Buttons
│   │   └── announcement-banner.tsx    # Live Banner Component
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Client Supabase Client
│   │   ├── server.ts                  # Server Component Supabase Client
│   │   └── middleware.ts              # Route Guard & Session Protection
│   ├── gpa/
│   │   ├── calculations.ts            # Mathematical GPA formulas (Semester, Year, Progressive CGPA)
│   │   ├── weights.ts                 # Faculty Clinical/Pre-Clinical Weight Constants
│   │   └── taxonomy.ts                # The 18 Academic Symbols & Rules Definitions
│   ├── excel/
│   │   └── parser.ts                  # SheetJS parser with Zod validation
│   └── utils.ts                       # ID Masking, Classnames merger
├── messages/
│   ├── ar.json                        # Comprehensive Arabic Localizations
│   └── en.json                        # Comprehensive English Localizations
├── types/
│   └── database.types.ts              # Generated Supabase Database Types
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 10. Execution Directives for Antigravity IDE (Step-by-Step)

Execute the build sequentially across the following phases:

1. **Phase 1: Project Initialization & Theme Setup**
   * Scaffold Next.js App Router with TypeScript and Tailwind CSS.
   * Configure the Royal Violet design tokens in `tailwind.config.ts` and `app/globals.css`.
   * Configure `next-intl` with Arabic default and RTL support.
2. **Phase 2: Database Provisioning**
   * Run the SQL DDL in **Section 4** within Supabase.
   * Generate TypeScript definitions with `npx supabase gen types typescript`.
3. **Phase 3: Excel Ingestion Engine**
   * Implement `lib/excel/parser.ts` using the column specs from **Section 5**.
   * Seed the database using `multi - Copy.xlsx`.
4. **Phase 4: Responsive Leaderboard Grid**
   * Construct `data-table.tsx` with TanStack Table.
   * Implement sticky frozen columns for mobile screens and multi-tier sorting.
5. **Phase 5: Secure Whitelist Claim & Auth**
   * Implement the identity challenge server action in `app/api/student-claim/route.ts`.
   * Protect authenticated student routes via Supabase middleware.
6. **Phase 6: Visualizations & Simulator**
   * Integrate Recharts for GPA trajectories and course bell curves.
   * Build the interactive What-If GPA Simulator for the clinical phase.