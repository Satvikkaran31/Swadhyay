import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getLeads, createLead, updateLead, deleteLead,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  sendToLeads, previewTemplate, getEmailLogs, getCRMStats,
} from '../controllers/crmController.js';

const router = express.Router();

// All CRM routes require admin
router.use(isAdmin);

// Leads
router.get('/leads',          getLeads);
router.post('/leads',         createLead);
router.put('/leads/:id',      updateLead);
router.delete('/leads/:id',   deleteLead);

// Templates
router.get('/templates',          getTemplates);
router.post('/templates',         createTemplate);
router.put('/templates/:id',      updateTemplate);
router.delete('/templates/:id',   deleteTemplate);
router.get('/templates/:id/preview', previewTemplate);

// Email
router.post('/send',     sendToLeads);
router.get('/logs',      getEmailLogs);
router.get('/stats',     getCRMStats);

export default router;
