import { recoverEmailService, registerService, sendRecoverCodeToEmailService } from "../service/user.service.js"


export async function registerController(req, res) {
    try {
        const data = req.body;
        const result = await registerService(data);
        return res.status(201).json({
            message: "User registered successfully.",
            result,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error during registration.",
            details: error.message,
        });
    }
}

export async function recoverEmailController(req, res) {
    try {
        const data = req.body;
        let result = await recoverEmailService(data);
        return res.status(201).json({ message: result });
    } catch (error) {
        return res.status(error.code).json({
            message: "OK"
        });
    }

}
export async function sendRecoverCodeToEmailController(req, res) {
    try {
        const email = req.body.email;
        await sendRecoverCodeToEmailService(email)
        return res.status(202).json({
            message: "Code send"
        });
    } catch (error) {
        if (process.env.DEBUG === "true") {
            console.error(error)
        }
        if (error.code == 404) {
            return res.status(400).json({
                message: "Try again later"
            });
        }
    }
    return res.status(400).json({
        message: "Failed"
    });
}