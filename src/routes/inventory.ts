import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import {
    cleanInventory,
    getDevelopment,
    getDevelopments,
    getProperties,
    getProperty,
    putProperty,
    imageUpload,
    updateProperty
} from "../controllers/inventory";

const router = Router();

router.post('/properties/:id/images', verifyToken, imageUpload);

router.get('/clean', verifyToken, cleanInventory);

router.get('/properties', verifyToken, getProperties);

router.get('/properties/:id', verifyToken, getProperty);

router.put('/properties', verifyToken, putProperty);

router.put('/properties/:id', verifyToken, updateProperty);

router.get('/developments', verifyToken, getDevelopments);

router.get('/developments/:id', verifyToken, getDevelopment);

router.put('/developments', verifyToken, (_, res) => {res.status(500).send('NI')});


export {
    router
}