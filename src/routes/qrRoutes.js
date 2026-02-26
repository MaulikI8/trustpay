const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const validateRequest = require('../middlewares/validateRequest');
const { reserveSchema, generateSchema, syncSchema } = require('../validations/qrValidation');

router.post('/reserve', validateRequest(reserveSchema), qrController.reserve);

router.post('/generate', validateRequest(generateSchema), qrController.generate);

router.post('/sync', validateRequest(syncSchema), qrController.sync);

module.exports = router;