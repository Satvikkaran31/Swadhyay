import pool from '../utils/db.js';
import mailer from '../utils/mailer.js';
import validator from 'validator';

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const VALID_SOURCES  = ['inquiry', 'newsletter', 'manual'];
const VALID_CATS     = ['welcome', 'follow-up', 'promotional', 'nurture', 'general'];

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : `{{${key}}}`));
}

function buildVars(lead: any, extra: Record<string, string> = {}): Record<string, string> {
  const base = process.env.CLIENT_URL || 'https://swadhyay.co';
  return {
    name:           esc(lead.name || ''),
    first_name:     esc((lead.name || '').split(' ')[0]),
    email:          esc(lead.email || ''),
    phone:          esc(lead.phone || ''),
    booking_link:   `${base}/booking`,
    courses_link:   `${base}/series`,
    ...extra,
  };
}

// ── LEADS ─────────────────────────────────────────────────────────────────────

export const getLeads = async (req, res) => {
  const { status, source, search } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status && status !== 'all') {
    params.push(status); conditions.push(`status = $${params.length}`);
  }
  if (source && source !== 'all') {
    params.push(source); conditions.push(`source = $${params.length}`);
  }
  if (search) {
    params.push(`%${String(search).toLowerCase()}%`);
    conditions.push(`(lower(name) LIKE $${params.length} OR lower(email) LIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT * FROM leads ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const createLead = async (req, res) => {
  const { name, email, phone, linkedin_url, source = 'manual', status = 'new', notes, tags = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!VALID_SOURCES.includes(source))  return res.status(400).json({ error: 'Invalid source' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (name, email, phone, linkedin_url, source, status, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (lower(email)) DO UPDATE
         SET name         = EXCLUDED.name,
             phone        = COALESCE(EXCLUDED.phone, leads.phone),
             linkedin_url = COALESCE(EXCLUDED.linkedin_url, leads.linkedin_url),
             updated_at   = NOW()
       RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), phone?.trim() || null,
       linkedin_url?.trim() || null, source, status, notes?.trim() || null, tags]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const updateLead = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, linkedin_url, status, notes, tags } = req.body;
  if (email && !validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const { rows } = await pool.query(
      `UPDATE leads
       SET name         = COALESCE($1, name),
           email        = COALESCE($2, email),
           phone        = COALESCE($3, phone),
           linkedin_url = COALESCE($4, linkedin_url),
           status       = COALESCE($5, status),
           notes        = COALESCE($6, notes),
           tags         = COALESCE($7, tags),
           updated_at   = NOW()
       WHERE id = $8 RETURNING *`,
      [name?.trim() || null, email?.toLowerCase().trim() || null,
       phone !== undefined ? (phone?.trim() || null) : undefined,
       linkedin_url !== undefined ? (linkedin_url?.trim() || null) : undefined,
       status ?? null, notes !== undefined ? (notes?.trim() || null) : undefined,
       tags ?? null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// Upsert a lead from an external event (inquiry, newsletter) — never 500s the caller
export async function upsertLeadQuietly(
  email: string, name: string,
  source: 'inquiry' | 'newsletter',
  extra: { phone?: string; linkedin_url?: string; notes?: string } = {}
) {
  if (!email || !validator.isEmail(email)) return;
  try {
    await pool.query(
      `INSERT INTO leads (name, email, phone, linkedin_url, source, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'new', $6)
       ON CONFLICT (lower(email)) DO UPDATE
         SET name         = CASE WHEN leads.name = leads.email THEN EXCLUDED.name ELSE leads.name END,
             phone        = COALESCE(EXCLUDED.phone, leads.phone),
             linkedin_url = COALESCE(EXCLUDED.linkedin_url, leads.linkedin_url),
             updated_at   = NOW()`,
      [name || email, email.toLowerCase().trim(),
       extra.phone?.trim() || null, extra.linkedin_url?.trim() || null,
       source, extra.notes?.slice(0, 300) || null]
    );
  } catch (err: any) {
    console.error(`CRM upsertLead(${source}) error:`, err.message);
  }
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────────

export const getTemplates = async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM email_templates ORDER BY created_at DESC');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

export const createTemplate = async (req, res) => {
  const { name, subject, body, category = 'general' } = req.body;
  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'name, subject and body are required' });
  }
  if (!VALID_CATS.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO email_templates (name, subject, body, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), subject.trim(), body, category]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, subject, body, category } = req.body;
  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'name, subject and body are required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE email_templates
       SET name=COALESCE($1,name), subject=COALESCE($2,subject), body=COALESCE($3,body),
           category=COALESCE($4,category), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name.trim(), subject.trim(), body, category || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM email_templates WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// ── EMAIL SENDING ─────────────────────────────────────────────────────────────

export const sendToLeads = async (req, res) => {
  const { lead_ids, template_id, extra_vars = {} } = req.body;
  if (!Array.isArray(lead_ids) || !lead_ids.length) {
    return res.status(400).json({ error: 'lead_ids (array) is required' });
  }
  if (!template_id) return res.status(400).json({ error: 'template_id is required' });

  try {
    const [{ rows: tmpl }, { rows: leads }] = await Promise.all([
      pool.query('SELECT * FROM email_templates WHERE id=$1', [template_id]),
      pool.query('SELECT * FROM leads WHERE id = ANY($1::int[])', [lead_ids]),
    ]);
    if (!tmpl.length) return res.status(404).json({ error: 'Template not found' });
    const t = tmpl[0];

    const results: { sent: number; failed: number; details: string[] } = { sent: 0, failed: 0, details: [] };

    for (const lead of leads) {
      const vars = buildVars(lead, extra_vars);
      const subject = substitute(t.subject, vars);
      const html    = substitute(t.body, vars);

      let status: 'sent' | 'failed' = 'sent';
      let errMsg: string | null = null;

      try {
        await mailer.sendMail({
          from:    { name: 'Neha Verma · Swadhyay', address: process.env.MAIL_USER as string },
          to:      lead.email,
          subject,
          html,
          replyTo: process.env.ADMIN_EMAIL,
        });
        results.sent++;
      } catch (err: any) {
        status = 'failed';
        errMsg = (err.message ?? 'Unknown error').slice(0, 300);
        results.failed++;
        results.details.push(`${lead.email}: ${errMsg}`);
      }

      await pool.query(
        `INSERT INTO email_logs (lead_id, template_id, to_email, to_name, subject, status, error_msg)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [lead.id, t.id, lead.email, lead.name, subject, status, errMsg]
      );

      if (status === 'sent' && lead.status === 'new') {
        await pool.query(
          `UPDATE leads SET status='contacted', updated_at=NOW() WHERE id=$1`,
          [lead.id]
        );
      }
    }

    res.json({ success: true, ...results });
  } catch (err: any) {
    console.error('sendToLeads error:', err.message);
    res.status(500).json({ error: 'Failed to send emails' });
  }
};

// Preview a template — substitutes real or sample variables
export const previewTemplate = async (req, res) => {
  const { id } = req.params;
  const { lead_id } = req.query;

  try {
    const { rows: tmpl } = await pool.query('SELECT * FROM email_templates WHERE id=$1', [id]);
    if (!tmpl.length) return res.status(404).json({ error: 'Template not found' });

    let sampleLead = {
      name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210',
      linkedin_url: null, status: 'new',
    };
    if (lead_id) {
      const { rows } = await pool.query('SELECT * FROM leads WHERE id=$1', [lead_id]);
      if (rows.length) sampleLead = rows[0];
    }

    const vars = buildVars(sampleLead, { course_name: 'Who Am I?' });
    res.json({
      subject: substitute(tmpl[0].subject, vars),
      body:    substitute(tmpl[0].body,    vars),
    });
  } catch {
    res.status(500).json({ error: 'Failed to preview template' });
  }
};

// ── EMAIL LOG ─────────────────────────────────────────────────────────────────

export const getEmailLogs = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT el.id, el.to_email, el.to_name, el.subject, el.status, el.error_msg,
              el.sent_at, et.name AS template_name, et.category
       FROM email_logs el
       LEFT JOIN email_templates et ON et.id = el.template_id
       ORDER BY el.sent_at DESC LIMIT 300`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
};

// ── STATS ─────────────────────────────────────────────────────────────────────

export const getCRMStats = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'new')       AS new_count,
        COUNT(*) FILTER (WHERE status = 'contacted') AS contacted_count,
        COUNT(*) FILTER (WHERE status = 'qualified') AS qualified_count,
        COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
        COUNT(*) FILTER (WHERE status = 'lost')      AS lost_count,
        COUNT(*)                                     AS total_count
      FROM leads
    `);
    const { rows: logs } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status='sent') AS emails_sent,
              COUNT(*) FILTER (WHERE status='failed') AS emails_failed
       FROM email_logs`
    );
    res.json({ leads: rows[0], emails: logs[0] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch CRM stats' });
  }
};
