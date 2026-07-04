import { Router } from 'express';
import {
  listTransactions,
  deposit,
  withdraw,
  transfer,
} from '../controllers/transactionController.js';

const router = Router();

router.get('/', listTransactions);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/transfer', transfer);

export default router;
