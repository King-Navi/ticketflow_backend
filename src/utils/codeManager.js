class CodeManager {
    constructor(expirationMinutes = 10) {
        this.codes = new Map();
        this.expirationMs = expirationMinutes * 60 * 1000;
        setInterval(() => this.cleanupExpiredCodes(), 60 * 1000).unref();
    }

    generateCode() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    storeCode(email) {
        const code = this.generateCode();
        this.codes.set(email.toLowerCase(), { code, createdAt: Date.now() });
        return code;
    }


    verifyEmailCode(email, inputCode, consume = true) {
        const record = this.codes.get(email.toLowerCase());
        if (!record) return false;

        const expired = Date.now() - record.createdAt > this.expirationMs;
        const matches = record.code === inputCode;

        if (expired || !matches) {
            this.codes.delete(email.toLowerCase());
            return false;
        }

        if (consume) this.codes.delete(email.toLowerCase());
        return true;
    }

    cleanupExpiredCodes() {
        const now = Date.now();
        for (const [email, { createdAt }] of this.codes.entries()) {
            if (now - createdAt > this.expirationMs) {
                this.codes.delete(email);
            }
        }
    }

    getActiveCount() {
        return this.codes.size;
    }
}

// singleton
const codeManager = new CodeManager(10);
export default codeManager;
