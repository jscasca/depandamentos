import { Router } from "express";
import { getStatus, testDatabase } from "../controllers/status";

const router = Router();

router.get('/', getStatus);

router.get('/db', testDatabase);

export {
    router
}