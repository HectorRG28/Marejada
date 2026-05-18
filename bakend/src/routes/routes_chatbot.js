const router = require('express').Router();
const ctrl   = require('../controllers/chatbotController');

// POST /chatbot/groq       — Proxy seguro hacia Groq (la API key solo está en el servidor)
router.post('/groq', ctrl.groqChat);

// GET  /chatbot/preguntas  — Devuelve el flujo de preguntas al frontend
router.get('/preguntas', ctrl.preguntas);

// POST /chatbot/recomendar — Recibe respuestas y devuelve planes recomendados
router.post('/recomendar', ctrl.recomendar);

module.exports = router;