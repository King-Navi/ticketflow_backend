import express from 'express';
import { validateBody } from "../middlewares/validateBody.js";
import loginSchema from '../middlewares/schemes/loginSchema.js';
import {loginController}  from '../controller/login.controller.js'

const router = express.Router();

const LOGIN_ROUTE = "/v1/login";


router.post(`${LOGIN_ROUTE}`,
    validateBody(loginSchema), 
    loginController);



export default router;