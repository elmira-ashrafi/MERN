import express from "express"
import { getMyProviderApplication, submitProviderApplication, getProviderApplicationDoc } from "../controllers/providerApplication.js"
import { requireAuth } from "../controllers/auth.js"
import { providerDocsUploadMiddleware } from "../services/upload.service.js"

const router = express.Router();

router.get('/provider-application', requireAuth, getMyProviderApplication);

router.get('/provider-application/doc/:fileName', requireAuth, getProviderApplicationDoc);

router.post(
    '/provider-application',
    requireAuth,
    providerDocsUploadMiddleware(),
    submitProviderApplication
);

export default router
