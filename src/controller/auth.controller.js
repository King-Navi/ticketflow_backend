import {
    requestPasswordResetService,
    validatePasswordResetTokenService,
    performPasswordResetService,
} from "../service/passwordReset.service.js";


export async function passwordForgotController(req, res) {
    try {
        const { email } = req.body ?? {};
        const ip = req.ip ?? null;
        const ua = req.get("user-agent") ?? null;

        const result = await requestPasswordResetService(email, ip, ua);
        if (process.env.DEBUG === "true") {
            console.log(result)
        }
        return res.status(200).json({
            message: "If the email exists, a password reset link will be sent.",
        });
    } catch (error) {
        console.error("passwordForgotController error:", error);
        return res.status(500).json({
            message: "Error requesting password reset.",
        });
    }
}

export async function passwordResetValidateController(req, res) {
    try {
        const token = req.query.token || req.body?.token;
        if (!token) {
            return res.status(400).json({ message: "token is required." });
        }

        const info = await validatePasswordResetTokenService(token);
        if (!info) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }
        if (process.env.DEBUG === "true") {
            console.log(info);
        }
        return res.status(200).json({
            message: "Token is valid.",
            credential_id: info.credential_id,
            password_reset_token_id: info.password_reset_token_id,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error validating password reset token.",
        });
    }
}


export async function passwordResetController(req, res) {
    try {
        const { token, newPassword } = req.body ?? {};
        if (!token || !newPassword) {
            return res.status(400).json({
                message: "token and newPassword are required.",
            });
        }

        await performPasswordResetService(token, newPassword);

        return res.status(200).json({
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("passwordResetController error:", error);
        if (error.message === "Invalid or expired token.") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Error resetting password.",
        });
    }
}