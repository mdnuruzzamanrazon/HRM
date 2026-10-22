import express from 'express';
import {
  getDivisions,
  getDistricts,
  getUpazilas,
  getUnions,
  getFullHierarchy,
} from '../controllers/locationController.js';

const router = express.Router();

router.get('/divisions', getDivisions);
router.get('/districts', getDistricts);
router.get('/upazilas', getUpazilas);
router.get('/unions', getUnions);
router.get('/hierarchy', getFullHierarchy);

export default router;
