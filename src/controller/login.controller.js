import { loginService } from '../service/login.service.js'

export async function loginController(req, res) {
  try {
    let username = req.body.username;
    let passwordHash = req.body.passwordHash;
    let jwt = await loginService(username, passwordHash);

    return res.status(200).json({ "token": jwt });
  }
  catch (error) {
    console.log(error)
    return res.status(error.code).json({ "msg": error.message })
  }
};

