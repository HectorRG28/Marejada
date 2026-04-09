const router = require('express').Router();
const auth   = require('../middleware/auth');
const admin  = require('../middleware/admin');
const ctrl   = require('../controllers/adminController');

// Todas las rutas requieren token válido + rol admin
router.use(auth, admin);

// ── Planes ────────────────────────────────────────────────
router.get('/planes',         ctrl.listarPlanesAdmin);
router.post('/planes',        ctrl.crearPlan);
router.put('/planes/:id',     ctrl.editarPlan);
router.delete('/planes/:id',  ctrl.eliminarPlan);

// ── Etiquetas ─────────────────────────────────────────────
router.post('/etiquetas',        ctrl.crearEtiqueta);
router.put('/etiquetas/:id',     ctrl.editarEtiqueta);
router.delete('/etiquetas/:id',  ctrl.eliminarEtiqueta);

// ── Moderación de valoraciones ────────────────────────────
router.get('/valoraciones',                           ctrl.listarValoraciones);
router.patch('/valoraciones/:id/visibilidad',         ctrl.cambiarVisibilidad);
router.delete('/valoraciones/:id',                    ctrl.eliminarValoracion);

// ── Usuarios ──────────────────────────────────────────────
router.get('/usuarios',              ctrl.listarUsuarios);
router.patch('/usuarios/:id/rol',    ctrl.cambiarRol);

module.exports = router;
