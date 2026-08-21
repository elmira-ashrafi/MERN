import express from "express"
import { requireAuth, requireAdmin } from "../controllers/auth.js"
import {
    listCountries, listProvinces, listCities,
    createCountry, createProvince, createCity,
    updateCountry, updateProvince, updateCity,
    deleteCountry, deleteProvince, deleteCity
} from "../controllers/admin/locations.js"
import { listUsers, setUserProviderRole } from "../controllers/admin/users.js"
import { listRequests, countRequestsByStatus, setRequestStatus } from "../controllers/admin/requests.js"
import { listProposals } from "../controllers/admin/proposals.js"
import { listProviderApplications, setProviderApplicationStatus } from "../controllers/admin/providerApplications.js"
import { listCategories, createCategory } from "../controllers/admin/categories.js" 

const router = express.Router();

/*
 * Every admin route lives in this one file so the guard below cannot be forgotten: it covers
 * the whole /api/admin subtree, no matter what is added underneath.
 */
router.use('/admin', requireAuth, requireAdmin);

// locations
router.get('/admin/countries', listCountries);
router.post('/admin/countries', createCountry);
router.patch('/admin/countries/:id', updateCountry);
router.delete('/admin/countries/:id', deleteCountry);

router.get('/admin/provinces', listProvinces);
router.post('/admin/provinces', createProvince);
router.patch('/admin/provinces/:id', updateProvince);
router.delete('/admin/provinces/:id', deleteProvince);

router.get('/admin/cities', listCities);
router.post('/admin/cities', createCity);
router.patch('/admin/cities/:id', updateCity);
router.delete('/admin/cities/:id', deleteCity);

// users
router.get('/admin/users', listUsers);
router.post('/admin/users/:id/provider-role', setUserProviderRole);

// requests
router.get('/admin/requests', listRequests);
router.get('/admin/requests/counts', countRequestsByStatus);
router.post('/admin/requests/:id/status', setRequestStatus);

// categories
router.get('/admin/categories', listCategories);
router.post('/admin/categories', createCategory);

// proposals
router.get('/admin/proposals', listProposals);

// provider applications
router.get('/admin/provider-applications', listProviderApplications);
router.post('/admin/provider-applications/:id/status', setProviderApplicationStatus);

export default router
