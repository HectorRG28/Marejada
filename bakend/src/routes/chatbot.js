const router = require('express').Router();
const ctrl   = require('../controllers/chatbotController');

// GET  /chatbot/preguntas  — Devuelve el flujo de preguntas al frontend
router.get('/preguntas', ctrl.preguntas);

// POST /chatbot/recomendar  — Recibe respuestas y devuelve planes recomendados
router.post('/recomendar', ctrl.recomendar);

module.exports = router;
