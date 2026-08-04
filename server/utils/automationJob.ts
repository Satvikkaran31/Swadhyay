import cron from 'node-cron';
import { runPendingAutomations } from '../controllers/crmController.js';

export function startAutomationJob() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[AutomationJob] Running pending automations…');
    await runPendingAutomations();
  });
  console.log('[AutomationJob] Started (runs every 30 min)');
}
