import pool from './db.js';

const migrations = [
  // ── Series ─────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS series (
    id            SERIAL PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    thumbnail_url TEXT,
    is_published  BOOLEAN DEFAULT false,
    position      INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Articles ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    thumbnail_url TEXT,
    author TEXT DEFAULT 'Neha',
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_id TEXT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    session_type TEXT NOT NULL,
    session_start TIMESTAMPTZ NOT NULL,
    meet_link TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_type TEXT`,

  // ── Course enhancements ─────────────────────────────────────────────────────
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS series_id INT REFERENCES series(id) ON DELETE SET NULL`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description TEXT`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_youll_learn TEXT[] DEFAULT '{}'`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}'`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'all-levels'`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English'`,

  // ── Seed: series ───────────────────────────────────────────────────────────
  `INSERT INTO series (slug, title, description, is_published, position)
   VALUES
     ('swadhyay-youth-series', 'Swadhyay Youth Series',
      'A curated series for young professionals ready to step into their best selves — with confidence, clarity, and purpose.',
      true, 1),
     ('leadership-coaching', 'Leadership Coaching',
      'Deep coaching for leaders who want to elevate their presence, communication, and impact — from the inside out.',
      true, 2),
     ('eft-tapping', 'EFT Tapping',
      'Evidence-based Emotional Freedom Techniques to release stress, fear, and anxiety — for anyone seeking calm and resilience.',
      true, 3),
     ('swadhyay-immersion', 'Swadhyay Immersion',
      'An immersive retreat experience combining deep coaching, somatic work, and community for transformative breakthroughs.',
      true, 4)
   ON CONFLICT (slug) DO NOTHING`,

  // ── Seed: courses ──────────────────────────────────────────────────────────
  `INSERT INTO courses (slug, title, short_description, description, price, is_published, level, series_id)
   SELECT
     'your-best-interview-is-your-best-self',
     'Your Best Interview Is Your Best Self',
     'Land your dream role by showing up as your most authentic, confident self.',
     'This course helps young professionals master the inner game of interviews — moving beyond rehearsed answers to genuine, powerful presence. You will learn how to manage nerves, articulate your value, and connect authentically with interviewers.',
     0,
     true,
     'beginner',
     s.id
   FROM series s WHERE s.slug = 'swadhyay-youth-series'
   ON CONFLICT (slug) DO NOTHING`,

  `INSERT INTO courses (slug, title, short_description, description, price, is_published, level, series_id)
   SELECT
     'who-am-i',
     'Who Am I?',
     'A guided self-discovery journey to uncover your values, strengths, and authentic identity.',
     'This course takes you through a structured self-assessment process — combining reflective exercises, coaching frameworks, and Neha''s signature methodology — to help you understand who you truly are beneath the roles you play. Ideal for anyone at a crossroads or seeking deeper clarity.',
     0,
     true,
     'all-levels',
     s.id
   FROM series s WHERE s.slug = 'swadhyay-youth-series'
   ON CONFLICT (slug) DO NOTHING`,

  `INSERT INTO courses (slug, title, short_description, description, price, is_published, level, series_id)
   SELECT
     'leadership-presence',
     'Leadership Presence',
     'Command the room and lead with authenticity, clarity, and executive gravitas.',
     'This course is designed for leaders who want to move beyond technical competence and develop the inner qualities that define great leadership — presence, emotional intelligence, and the ability to inspire trust. Neha draws on 25+ years of executive coaching to guide you through a transformative process.',
     0,
     true,
     'intermediate',
     s.id
   FROM series s WHERE s.slug = 'leadership-coaching'
   ON CONFLICT (slug) DO NOTHING`,

  `INSERT INTO courses (slug, title, short_description, description, price, is_published, level, series_id)
   SELECT
     'eft-tapping-managing-fear-stress-anxiety',
     'EFT Tapping: Managing Fear, Stress & Anxiety',
     'Use tapping sequences to calm your nervous system and reclaim peace in minutes.',
     'Learn the complete EFT (Emotional Freedom Techniques) protocol to process and release fear, stress, and anxiety. This course combines ancient meridian wisdom with modern psychology to give you a practical toolkit for emotional regulation.',
     0,
     true,
     'all-levels',
     s.id
   FROM series s WHERE s.slug = 'eft-tapping'
   ON CONFLICT (slug) DO NOTHING`,

  `INSERT INTO courses (slug, title, short_description, description, price, is_published, level, series_id)
   SELECT
     'swadhyay-immersion-retreat',
     'Swadhyay Immersion Retreat',
     'A transformative in-person retreat for deep self-discovery and lasting change.',
     'The Swadhyay Immersion is a curated retreat experience that combines executive coaching, EFT, somatic movement, and group dialogue. Spend dedicated time stepping away from the daily grind to reconnect with yourself and your purpose.',
     0,
     true,
     'all-levels',
     s.id
   FROM series s WHERE s.slug = 'swadhyay-immersion'
   ON CONFLICT (slug) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    quote TEXT NOT NULL,
    avatar_url TEXT,
    is_published BOOLEAN DEFAULT false,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, course_id)
  )`,
  `CREATE TABLE IF NOT EXISTS lesson_notes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    content TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, lesson_id)
  )`,
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Payment order tracking (prevents cross-course credential replay) ─────────
  `CREATE TABLE IF NOT EXISTS payment_orders (
    id         SERIAL PRIMARY KEY,
    order_id   TEXT UNIQUE NOT NULL,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id  INT REFERENCES courses(id) ON DELETE SET NULL,
    amount     INT NOT NULL,
    currency   TEXT NOT NULL DEFAULT 'INR',
    status     TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id)`,

  // ── Performance indices ───────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id)`,

  // ── Enrollment integrity: each Razorpay payment_id can only enroll one user ─
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_payment_id_unique'
     ) THEN
       ALTER TABLE enrollments ADD CONSTRAINT enrollments_payment_id_unique UNIQUE (payment_id);
     END IF;
   END $$`,

  // ── Store Razorpay payment_id on completed orders (needed for refund webhooks) ──
  `ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT`,

  // ── Series feature cards (editable "What This Series Offers" blocks) ──────────
  `ALTER TABLE series ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'`,

  // ── Instructor profile ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS instructor_profiles (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    title       TEXT,
    bio         TEXT,
    avatar_url  TEXT,
    is_primary  BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  )`,
  `INSERT INTO instructor_profiles (name, title, bio, is_primary)
   SELECT 'Neha Verma',
          'Executive & Life Coach · 25+ years of experience',
          'Neha is a certified executive and life coach who has worked with leaders, young professionals, and organisations across India. Her coaching integrates evidence-based practices with deep human presence — helping clients move from clarity of mind to clarity of self.',
          true
   WHERE NOT EXISTS (SELECT 1 FROM instructor_profiles WHERE is_primary = true)`,

  // ── Lesson types: 'video' (default) or 'text' (reading/reflection lesson) ──
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'text'))`,

  // ── Rich text / markdown content for text-type lessons ───────────────────────
  `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT`,

  // ── Module-level description (shown under module title in curriculum) ─────────
  `ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT`,

  // ── LinkedIn URL on user profiles ─────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT`,

  // ── CRM: leads ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS leads (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT,
    linkedin_url TEXT,
    source       TEXT NOT NULL DEFAULT 'manual',
    status       TEXT NOT NULL DEFAULT 'new',
    notes        TEXT,
    tags         TEXT[] DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(lower(email))`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,

  // ── CRM: email templates ──────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS email_templates (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    category   TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── CRM: email send log ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS email_logs (
    id          SERIAL PRIMARY KEY,
    lead_id     INT REFERENCES leads(id) ON DELETE SET NULL,
    template_id INT REFERENCES email_templates(id) ON DELETE SET NULL,
    to_email    TEXT NOT NULL,
    to_name     TEXT,
    subject     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'sent',
    error_msg   TEXT,
    sent_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC)`,

  // ── CRM: seed 4 starter templates (skipped if any already exist) ─────────────
  `INSERT INTO email_templates (name, subject, body, category)
   SELECT * FROM (VALUES
     (
       'Welcome – New Lead',
       'Welcome to Swadhyay, {{first_name}}!',
       '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f1e9;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#0c241c;color:#f4f1e9;padding:28px 32px;border-radius:12px;text-align:center;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;opacity:.6;text-transform:uppercase;">Swadhyay Coaching</p>
    <h1 style="margin:8px 0 0;font-size:26px;font-weight:600;letter-spacing:1px;">A space for inner work</h1>
  </div>
  <h2 style="color:#0c241c;font-size:20px;">Hi {{first_name}},</h2>
  <p style="line-height:1.75;color:#333;">Thank you for reaching out. I''m Neha — and I''m genuinely glad you''re here.</p>
  <p style="line-height:1.75;color:#333;">Whether you''re navigating a career transition, preparing for something important, or simply feeling the pull toward deeper self-knowledge — you''ve come to the right place.</p>
  <p style="line-height:1.75;color:#333;">The first conversation is always about listening. I''d love to understand where you are and how I can best support you.</p>
  <p style="text-align:center;margin:36px 0;">
    <a href="{{booking_link}}" style="background:#0c241c;color:#f4f1e9;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block;">Book a free 20-min call →</a>
  </p>
  <p style="line-height:1.75;color:#333;">With warmth,<br><strong>Neha Verma</strong><br><span style="color:#888;font-size:13px;">Executive &amp; Life Coach · Swadhyay</span></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
  <p style="font-size:11px;color:#aaa;text-align:center;">Swadhyay · swadhyay.co · You''re receiving this because you connected with us.</p>
</div></body></html>',
       'welcome'
     ),
     (
       'Follow-Up After Enquiry',
       'Just checking in, {{first_name}}',
       '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f1e9;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#0c241c;color:#f4f1e9;padding:28px 32px;border-radius:12px;text-align:center;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;opacity:.6;text-transform:uppercase;">Swadhyay Coaching</p>
  </div>
  <h2 style="color:#0c241c;font-size:20px;">Hi {{first_name}},</h2>
  <p style="line-height:1.75;color:#333;">I wanted to follow up on your recent enquiry — I hope things are going well on your end.</p>
  <p style="line-height:1.75;color:#333;">Sometimes the right moment to begin this kind of inner work takes a little while to arrive. There''s no pressure here.</p>
  <p style="line-height:1.75;color:#333;">When you''re ready, I''m here. If you have any questions before booking, simply reply to this email — I read every message personally.</p>
  <p style="text-align:center;margin:36px 0;">
    <a href="{{booking_link}}" style="background:#0c241c;color:#f4f1e9;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block;">Book a session →</a>
  </p>
  <p style="line-height:1.75;color:#333;">Warmly,<br><strong>Neha</strong></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
  <p style="font-size:11px;color:#aaa;text-align:center;">Swadhyay · swadhyay.co</p>
</div></body></html>',
       'follow-up'
     ),
     (
       'Course Recommendation',
       'A course I think you''ll find valuable, {{first_name}}',
       '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f1e9;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#0c241c;color:#f4f1e9;padding:28px 32px;border-radius:12px;text-align:center;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;opacity:.6;text-transform:uppercase;">Swadhyay Coaching</p>
  </div>
  <h2 style="color:#0c241c;font-size:20px;">Hi {{first_name}},</h2>
  <p style="line-height:1.75;color:#333;">Based on our conversation, I wanted to share something that I think will resonate with where you are right now.</p>
  <p style="line-height:1.75;color:#333;">Our <strong>{{course_name}}</strong> course has helped many professionals in exactly your position — and it''s available to start immediately, at your own pace.</p>
  <p style="line-height:1.75;color:#333;">It''s completely free to begin. The first module gives you a real sense of whether it''s the right fit.</p>
  <p style="text-align:center;margin:36px 0;">
    <a href="{{courses_link}}" style="background:#0c241c;color:#f4f1e9;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block;">Explore the course →</a>
  </p>
  <p style="line-height:1.75;color:#333;">With warmth,<br><strong>Neha</strong></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
  <p style="font-size:11px;color:#aaa;text-align:center;">Swadhyay · swadhyay.co</p>
</div></body></html>',
       'promotional'
     ),
     (
       'Re-Engagement – Cold Lead',
       'It''s been a while, {{first_name}} — still thinking about this?',
       '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f1e9;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#0c241c;color:#f4f1e9;padding:28px 32px;border-radius:12px;text-align:center;margin-bottom:32px;">
    <p style="margin:0;font-size:11px;letter-spacing:3px;opacity:.6;text-transform:uppercase;">Swadhyay Coaching</p>
  </div>
  <h2 style="color:#0c241c;font-size:20px;">Hi {{first_name}},</h2>
  <p style="line-height:1.75;color:#333;">It''s been a little while since we were in touch, and I just wanted to check in.</p>
  <p style="line-height:1.75;color:#333;">I know life gets full. The work of genuine self-reflection — the kind that actually changes things — often gets pushed to "later."</p>
  <p style="line-height:1.75;color:#333;">If you''re still feeling the pull toward something more, I''m still here. No pressure, no pitch. Just a conversation when you''re ready.</p>
  <p style="text-align:center;margin:36px 0;">
    <a href="{{booking_link}}" style="background:#0c241c;color:#f4f1e9;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;display:inline-block;">Let''s reconnect →</a>
  </p>
  <p style="line-height:1.75;color:#333;">Warmly,<br><strong>Neha</strong></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
  <p style="font-size:11px;color:#aaa;text-align:center;">Swadhyay · swadhyay.co · Reply to unsubscribe from future emails.</p>
</div></body></html>',
       'nurture'
     )
   ) AS t(name, subject, body, category)
   WHERE NOT EXISTS (SELECT 1 FROM email_templates LIMIT 1)`,
];

export async function runMigrations() {
  for (const sql of migrations) {
    await pool.query(sql).catch(err => {
      console.error('Migration failed:', err.message, '\nSQL:', sql.slice(0, 120));
      throw err;
    });
  }
  console.log('Migrations complete');
}
