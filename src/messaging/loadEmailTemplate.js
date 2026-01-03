import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadVerificationCodeTemplate(code){
    try{
        const htmlPath = path.join(__dirname, 'verificationCode.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        htmlContent = htmlContent.replace('{{code}}', code);
        return htmlContent;
    }catch(error){
        throw new Error('No se pudo cargar el template del email.');
    }
}