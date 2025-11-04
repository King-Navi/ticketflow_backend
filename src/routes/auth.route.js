import express from 'express';
import { authRequired } from '../middlewares/authVerify.middleware.js'

import {
  validateBody,
  validateQuery,
} from "../middlewares/validateBody.js";
import {
  passwordForgotBodySchema,
  passwordResetBodySchema,
  passwordResetValidateQuerySchema
} from '../middlewares/schemes/authPassword.schemas.js'
import {
  passwordForgotController,
  passwordResetValidateController,
  passwordResetController,
} from "../controller/auth.controller.js";

const router = express.Router();

//TODO: test

const AUTH_ROUTE = "/v1/auth";


router.post(
  `${AUTH_ROUTE}/password/forgot`,
  validateBody(passwordForgotBodySchema),
  passwordForgotController
);

router.get(
  `${AUTH_ROUTE}/password/reset/validate`,
  validateQuery(passwordResetValidateQuerySchema),
  passwordResetValidateController
);

router.post(
  `${AUTH_ROUTE}/password/reset`,
  validateBody(passwordResetBodySchema),
  passwordResetController
);

router.post(
  `${AUTH_ROUTE}/profile/reset`,
  authRequired(),
  // TODO: logged user wants to change his password
  async (req, res) => {
    return res.status(501).json({ message: "Not implemented yet." });
  }
);

export default router;