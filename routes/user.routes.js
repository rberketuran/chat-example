import { Router } from 'express';
import controller from '../controllers/user.controller.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/register', (req, res) => {
    res.sendFile(join(__dirname, '../public/register.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(join(__dirname, '../public/login.html'));
});
router.post('/register', controller.register);
router.post('/login', controller.login);

export default router;
