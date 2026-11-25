const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
const PORT = 3000;
const JWT_SECRET = 'neurogrid_super_secret_2026';
// Llave simétrica estática (MALA PRÁCTICA intencional para fase de criptoanálisis)
const WEAK_AES_KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
// Carga de llaves asimétricas RSA-2048 generadas en el Paso 1
const PRIVATE_KEY = fs.readFileSync('./server_private.pem', 'utf8');
const PUBLIC_KEY = fs.readFileSync('./server_public.pem', 'utf8');
// Base de datos simulada en memoria

const USERS = {
'carlos.mendoza@neurogrid.local': {
password: 'AdminIA_2026!',
role: 'ai_admin',
name: 'Ing. Carlos Mendoza'
}
};
// -------------------------------------------------------------------------
// 1. SUPERFICIE OSINT (Metadatos expuestos por mala configuración)
// -------------------------------------------------------------------------
app.get('/api/v1/public/status', (req, res) => {
res.json({
system: 'NeuroGrid-API v2.4 (Modelo Predictivo Energético)',
maintainer: 'Ing. Carlos Mendoza <carlos.mendoza@neurogrid.local>',
schedule_note: 'Sincronizacion critica de dataset cada viernes a las 16:00 hrs',
public_key_pem: PUBLIC_KEY
});
});
// -------------------------------------------------------------------------
// 2. SIMULADOR DE INGENIERÍA SOCIAL (Buzón del Administrador Objetivo)
// -------------------------------------------------------------------------
app.post('/api/v1/mail/phishing-target', (req, res) => {
const { sender, subject, body, phishingUrl } = req.body;
console.log(`\n[Buzón IA] Correo recibido de: ${sender} | Asunto: ${subject}`);
// Validación pedagógica: el pretexto generado con IA debe usar contexto OSINT
const hasContext =
body &&
(body.toLowerCase().includes('neurogrid') ||
body.toLowerCase().includes('dataset')) &&
(body.toLowerCase().includes('carlos') ||
body.toLowerCase().includes('sincronizacion'));

if (hasContext && phishingUrl) {
console.log('[ALERTA INGENIERÍA SOCIAL] El administrador confió en el pretexto IA e hizo clic en el enlace.');
return res.json({
status: 'COMPROMISED',
message: 'Víctima engañada por pretexto contextualizado con IA.',
captured_credentials: {
email: 'carlos.mendoza@neurogrid.local',
password: USERS['carlos.mendoza@neurogrid.local'].password
}
});
}
console.log('[Buzón IA] Correo descartado por el usuario (pretexto genérico sin contexto OSINT).');
return res.status(400).json({
status: 'IGNORED',
message: 'El correo parece spam genérico. Mejora el reconocimiento OSINT y el prompt de IA.'}); 
});
// -------------------------------------------------------------------------
// 3. AUTENTICACIÓN Y ENDPOINT VULNERABLE (Cifrado Simétrico AES-256-ECB)
// -------------------------------------------------------------------------
app.post('/api/v1/login', (req, res) => {
const { email, password } = req.body;
const user = USERS[email];
if (!user || user.password !== password) {
return res.status(401).json({ error: 'Credenciales inválidas' });
}
const token = jwt.sign({ email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
console.log(`[Auth] Sesión iniciada por ${email}`);
res.json({ token });

});
function verifyToken(req, res, next) {
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
if (!token) return res.status(403).json({ error: 'Token JWT requerido' });
jwt.verify(token, JWT_SECRET, (err, decoded) => {
if (err) return res.status(401).json({ error: 'Token JWT inválido o expirado' });
req.user = decoded;
next();
});
}
// Endpoint que cifra bloques idénticos de forma determinista (Fuga de patrones)
app.get('/api/v1/telemetry/vulnerable-ecb', verifyToken, (req, res) => {
// Bloques repetitivos de exactamente 16 bytes para evidenciar debilidad de ECB
const sensitiveDataset =
'NODO_01:OK_99.8%' +
'NODO_01:OK_99.8%' +
'NODO_02:ALERTA!!';
const cipher = crypto.createCipheriv('aes-256-ecb', WEAK_AES_KEY, null);
let encrypted = cipher.update(sensitiveDataset, 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log('[API Vulnerable] Telemetría enviada usando AES-256-ECB (sin IV ni autenticación)');
res.json({
algorithm: 'AES-256-ECB',
ciphertext_hex: encrypted
});
});
// -------------------------------------------------------------------------
// 4. ENDPOINT REMEDIADO (Criptografía Híbrida: RSA-OAEP + AES-256-GCM)

// -------------------------------------------------------------------------
app.post('/api/v1/telemetry/secure-hybrid', verifyToken, (req, res) => {
try {
const { encryptedSessionKey, ivHex, authTagHex, ciphertextHex } = req.body;
// 1. Descifrar la llave simétrica efímera usando la llave privada RSA-2048
const aesSessionKey = crypto.privateDecrypt(
{
key: PRIVATE_KEY,
padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
oaepHash: 'sha256'
},
Buffer.from(encryptedSessionKey, 'base64')
);
// 2. Descifrar el payload con AES-256-GCM y validar etiqueta de integridad(AuthTag)
const decipher = crypto.createDecipheriv(
'aes-256-gcm',
aesSessionKey,
Buffer.from(ivHex, 'hex')
);
decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(`[API Segura] Payload híbrido descifrado e íntegro: ${decrypted}`);
res.json({
status: 'VERIFIED_AND_DECRYPTED',
integrity: 'GCM_AUTH_TAG_OK',
data: JSON.parse(decrypted)
});
} catch (error) {
console.error('[ALERTA INTEGRIDAD] Fallo al verificar firma/tag criptográfico:',
error.message);

res.status(400).json({ error: 'Fallo de integridad o clave criptográfica inválida' });
}
});
app.listen(PORT, () => {
console.log(`[Servidor NeuroGrid-API] Escuchando en http://localhost:${PORT}`);
});