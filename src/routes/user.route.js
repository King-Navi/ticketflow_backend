import express from 'express';
import { validateBody } from "../middlewares/validateBody.js";
import registerSchema from '../middlewares/schemes/register.schema.js';
import emailAndCodeSchema from '../middlewares/schemes/recoverEmailCode.schema.js';
import emailOnlySchema from '../middlewares/schemes/email.scheam.js';
import {recoverEmailController, registerController, sendRecoverCodeToEmailController} from "../controller/user.controller.js"
import { rateLimitOnce } from '../middlewares/rateonce.js';
import {authRequired} from '../middlewares/authVerify.middleware.js'
const router = express.Router();

//TODO: test

const LOGIN_ROUTE = "/v1/user";


router.put(`${LOGIN_ROUTE}/register`,
    validateBody(registerSchema),
    registerController
);

//TODO: doc in .yaml

router.post(`${LOGIN_ROUTE}/email`,
    validateBody(emailAndCodeSchema),
    recoverEmailController
);

const oncePerFive = rateLimitOnce({ windowMs: 5 * 60 * 1000 });

//TODO: doc in .yaml

router.post(`${LOGIN_ROUTE}/code`,
    validateBody(emailOnlySchema),
    oncePerFive,
    sendRecoverCodeToEmailController
);


//TODO: doc in .yaml
/**
 * Need to do the impl of changing info of profile
 * (attendee & organizer)
 */


router.post(`${LOGIN_ROUTE}/profile/edit`,
    authRequired()
);

export default router;