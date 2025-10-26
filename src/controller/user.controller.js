import { registerService } from "../service/user.service.js"


export async function registerController(req, res) {
    try {
        const data = req.body;
        const result = await registerService(data);
        return res.status(201).json({
            message: "User registered successfully.",
            result,
        });
    } catch (error) {
        //TODO: manage errors
        return res.status(500).json({
            error: "Internal server error during registration.",
            details: error.message,
        });
    }
}