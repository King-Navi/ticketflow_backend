import express from 'express';
import {authRequired} from '../middlewares/authVerify.middleware.js'

const router = express.Router();

//TODO: test

const AUTH_ROUTE = "/v1/auth";


//TODO: doc in .yaml
/**
 * Need to do the impl of password info of profile
 * (attendee & organizer)
 */

router.post(`${AUTH_ROUTE}/profile/reset`,
    authRequired
    
);

export default router;