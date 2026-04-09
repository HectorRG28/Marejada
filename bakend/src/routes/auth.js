const router  = require('express').Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/authController');

// POST /auth/register
router.post('/register', ctrl.register);

// POST /auth/login
router.post('/login', ctrl.login);

// GET /auth/me  (requiere token)
router.get('/me', auth, ctrl.me);

module.exports = router;
