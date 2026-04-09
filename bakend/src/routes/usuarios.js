const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/usuariosController');

// Todas las rutas requieren autenticación
router.use(auth);

// GET  /usuarios/perfil
router.get('/perfil', ctrl.perfil);

// PUT  /usuarios/perfil
router.put('/perfil', ctrl.actualizarPerfil);

// GET  /usuarios/favoritos
router.get('/favoritos', ctrl.listarFavoritos);

// POST /usuarios/favoritos/:planId
router.post('/favoritos/:planId', ctrl.agregarFavorito);

// DELETE /usuarios/favoritos/:planId
router.delete('/favoritos/:planId', ctrl.eliminarFavorito);

// GET  /usuarios/mis-valoraciones
router.get('/mis-valoraciones', ctrl.misValoraciones);

module.exports = router;
