import { Router } from 'express';
import { listLoans, applyLoan, payEmi } from '../controllers/loanController.js';

const router = Router();

router.get('/', listLoans);
router.post('/', applyLoan);
router.post('/:id/pay', payEmi);

export default router;
