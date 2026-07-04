import { Router } from 'express';
import {
  branchSummary,
  pendingLoans,
  decideLoan,
  auditLogs,
} from '../controllers/adminController.js';

const router = Router();

router.get('/branch-summary', branchSummary);
router.get('/pending-loans', pendingLoans);
router.post('/loans/:id/decision', decideLoan);
router.get('/audit-logs', auditLogs);

export default router;
