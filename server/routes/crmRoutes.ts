import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getLeads, createLead, updateLead, deleteLead,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  sendToLeads, previewTemplate, getEmailLogs, getCRMStats,
  unsubscribeLead, trackOpen,
  getAutomations, createAutomation, updateAutomation, deleteAutomation,
} from '../controllers/crmController.js';

const router = express.Router();

// Public routes — no admin required
router.get('/unsubscribe', unsubscribeLead);
router.get('/track/open/:token', trackOpen);

// All CRM routes below require admin
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

// Automations
router.get('/automations',        getAutomations);
router.post('/automations',       createAutomation);
router.put('/automations/:id',    updateAutomation);
router.delete('/automations/:id', deleteAutomation);

export default router;
