import express from 'express';
import { validateBody } from "../middlewares/validateBody.js";
import loginSchema from '../middlewares/schemes/login.schema.js';
import {loginController}  from '../controller/login.controller.js'

const router = express.Router();

//TODO: test
const LOGIN_ROUTE = "/v1/login";


router.post(`${LOGIN_ROUTE}`,
    validateBody(loginSchema), 
    loginController
);



export default router;