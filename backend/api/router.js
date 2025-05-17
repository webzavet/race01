// backend/api/router.js
import express from 'express';
import { registerHandler, loginHandler } from '../modules/auth/handlers.js';

const router = express.Router();

router.post('/register', registerHandler);
router.post('/login',  loginHandler);

export default router;
