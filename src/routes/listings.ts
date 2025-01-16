import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import {
    getListing,
    newListing,
    newListingFullAddress,
    updateListing,
    updateListingImage
} from "../controllers/listings";

const router = Router();

router.put('/newListingAddress', verifyToken, newListingFullAddress);

router.put('/', verifyToken, newListing);

router.get('/:id', getListing);

router.put('/:id', verifyToken, updateListing);

router.put('/:id/image', verifyToken, updateListingImage);

export {
    router
}