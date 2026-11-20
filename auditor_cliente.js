const crypto = require('crypto');
const BASE_URL = 'http://localhost:3000';
async function runCollaborativeLab() {
console.log('=== INICIANDO AUDITORÍA COLABORATIVA (EQUIPO DE 4) ===\n');
// -----------------------------------------------------------------------
// FASE 1 (Rol 1): Reconocimiento OSINT e Ingeniería Social Asistida por IA
// -----------------------------------------------------------------------
console.log('[Rol 1 - OSINT] Consultando superficie pública del sistema inteligente...');
const osintRes = await fetch(`${BASE_URL}/api/v1/public/status`);

const osintData = await osintRes.json();
console.log(` -> Objetivo identificado: ${osintData.maintainer}`);
console.log(` -> Contexto operativo: ${osintData.schedule_note}\n`);
console.log('[Rol 1 - Ing. Social] Enviando correo spear-phishing redactado con IA...');
const phishRes = await fetch(`${BASE_URL}/api/v1/mail/phishing-target`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
sender: 'soporte-infraestructura@neurogrid-ops.local',
subject: 'URGENTE: Error de integridad antes de sincronización de dataset',
body: 'Estimado Ing. Carlos Mendoza, detectamos una anomalía en NeuroGrid-API previo a la sincronizacion del dataset de las 16:00 hrs. Valide su sesión aquí.',
phishingUrl: 'http://192.168.56.101:8080/auth-verify'
})
});
const phishResult = await phishRes.json();
if (phishResult.status !== 'COMPROMISED') {
console.error('Fallo en ingeniería social:', phishResult.message);
return;
}
console.log(' -> ¡Éxito! Credenciales capturadas:', phishResult.captured_credentials,
'\n');
// -----------------------------------------------------------------------
// FASE 2 (Rol 2): Hacking Ético sobre API e Interceptación de Tráfico
// -----------------------------------------------------------------------
console.log('[Rol 2 - Pentester] Autenticando en la API con credenciales obtenidas...');
const loginRes = await fetch(`${BASE_URL}/api/v1/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(phishResult.captured_credentials)
});
const { token } = await loginRes.json();

const vulnRes = await fetch(`${BASE_URL}/api/v1/telemetry/vulnerable-ecb`, {
headers: { Authorization: `Bearer ${token}` }
});
const vulnData = await vulnRes.json();
console.log(` -> Payload interceptado (${vulnData.algorithm}):
${vulnData.ciphertext_hex}\n`);
// -----------------------------------------------------------------------
// FASE 3 (Rol 3): Criptoanálisis de Bloques ECB y Remediación Híbrida
// -----------------------------------------------------------------------
console.log('[Rol 3 - Criptoanalista] Analizando bloques de 16 bytes (32 caracteres hex)...');
const blocks = vulnData.ciphertext_hex.match(/.{1,32}/g);
blocks.forEach((b, idx) => console.log(` Bloque ${idx + 1}: ${b}`));
if (blocks[0] === blocks[1]) {
console.log(' -> [VULNERABILIDAD CONFIRMADA] Bloque 1 === Bloque 2. Fuga de patrones por modo ECB.\n');}

console.log('[Rol 3 - Dev Seguro] Ejecutando Criptografía Híbrida (RSA-2048 + AES- 256-GCM)...');

// 1. Generar llave de sesión efímera de 256 bits (32 bytes) y vector IV de 96 bits (12bytes)
const ephemeralAesKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
// 2. Cifrar telemetría sensible con AES-256-GCM
const telemetryPayload = JSON.stringify({
nodo: 'Subestacion-IA-01',
prediccion_carga_mw: 148.75,
estado: 'OPERATIVO_SEGURO',
timestamp: new Date().toISOString()
});

const cipher = crypto.createCipheriv('aes-256-gcm', ephemeralAesKey, iv);
let ciphertextHex = cipher.update(telemetryPayload, 'utf8', 'hex');
ciphertextHex += cipher.final('hex');
const authTagHex = cipher.getAuthTag().toString('hex');
// 3. Cifrar la llave simétrica con la llave pública RSA-2048 del servidor
const encryptedSessionKey = crypto
.publicEncrypt(
{
key: osintData.public_key_pem,
padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
oaepHash: 'sha256'
},
ephemeralAesKey
)
.toString('base64');
// 4. Enviar paquete protegido al endpoint remediado
const secureRes = await fetch(`${BASE_URL}/api/v1/telemetry/secure-hybrid`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`
},
body: JSON.stringify({
encryptedSessionKey,
ivHex: iv.toString('hex'),
authTagHex,
ciphertextHex
})
});
const secureResult = await secureRes.json();
console.log(' -> Respuesta del Servidor IA:', secureResult);
}
runCollaborativeLab().catch(console.error);