import { Router } from 'express';
import { listAccounts, openAccount, listBranches } from '../controllers/accountController.js';

const router = Router();

router.get('/', listAccounts);
router.get('/branches', listBranches);
router.post('/', openAccount);

export default router;
