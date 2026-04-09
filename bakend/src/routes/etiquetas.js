const router = require('express').Router();
const ctrl   = require('../controllers/etiquetasController');

// GET /etiquetas
router.get('/', ctrl.listar);

module.exports = router;
