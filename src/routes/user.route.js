import express from 'express';
import { validateBody } from "../middlewares/validateBody.js";
import registerSchema from '../middlewares/schemes/register.schem.js';
import {registerController} from "../controller/user.controller.js"
const router = express.Router();

//TODO: doc in .yaml
//TODO: test

const LOGIN_ROUTE = "/v1/user";


router.post(`${LOGIN_ROUTE}`,
    validateBody(registerSchema),
    registerController
);



export default router;