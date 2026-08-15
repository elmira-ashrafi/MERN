import { getProvinces, getCountries, getCities } from "../controllers/locations.js"
import express from "express"
const router = express.Router();

router.get('/get-countries', getCountries);
router.get('/get-provinces/:countryId', getProvinces);
router.get('/get-cities/:provinceId', getCities);

export default router