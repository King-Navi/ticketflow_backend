import express from 'express';
import {loginController}  from '../controller/login.controller.js'

const router = express.Router();

const LOGIN_ROUTE = "/api/login";


router.get(`${LOGIN_ROUTE}`, loginController);



export default router;