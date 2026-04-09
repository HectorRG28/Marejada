const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/valoracionesController');

// GET /valoraciones/plan/:planId
router.get('/plan/:planId', ctrl.porPlan);

// POST /valoraciones  (autenticado)
router.post('/', auth, ctrl.crear);

// PUT /valoraciones/:id  (autenticado)
router.put('/:id', auth, ctrl.editar);

// DELETE /valoraciones/:id  (autenticado)
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;
