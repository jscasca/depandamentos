import { Router } from "express";
import { loginClerk, loginUser, registerClerk, registerUser, refreshClerk, refreshUser } from "../controllers/auth";
import { verifyToken } from "../middleware/auth";

const router = Router();

// Separate auth for clerk and users
router.post('/clerk/login', loginClerk);

router.post('/clerk/register/', verifyToken, registerClerk);

router.post('/clerk/refresh', refreshClerk);

// Users can log in via different methods
router.post('/user/login', loginUser);

router.post('/user/register', registerUser);

router.post('/user/refresh', refreshUser);

export {
    router
}