const router = require('express').Router();
const ctrl   = require('../controllers/planesController');

// GET /planes?provincia=Cádiz&etiquetas=familia,aventura&page=1&limit=12
router.get('/', ctrl.listar);

// GET /planes/:id
router.get('/:id', ctrl.detalle);

module.exports = router;
