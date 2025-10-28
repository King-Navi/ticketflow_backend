import { resetPasswrodService } from "../service/auth.service";

export async function resetPasswordController(req, res) {
    await resetPasswrodService()
    return res.status(404).json({mesage:"Not impl"});
}