export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { name, email, message, _hp } = req.body;

  // Anti-spam: honeypot
  if (_hp && _hp.length > 0) {
    return res.status(200).json({ success: true });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: 'Mensaje muy corto' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  const senderName = name ? name.trim() : 'Visitante';

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'idoneApp Contacto', email: 'no-reply@idoneapp.com' },
        to: [{ email: 'info@idoneapp.com', name: 'idoneApp' }],
        replyTo: { email, name: senderName },
        subject: `[Contacto landing] Mensaje de ${senderName}`,
        htmlContent: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0D0118;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0118;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:linear-gradient(145deg,#1a0530,#2a0a40);border-radius:24px;border:1px solid rgba(123,63,158,0.3);overflow:hidden;">
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#C96868;letter-spacing:2px;text-transform:uppercase;">Nuevo mensaje · Landing</p>
          <p style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;">De: ${senderName}</p>
          <table width="100%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:20px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;">Correo</p>
              <p style="margin:0;font-size:14px;color:#C96868;">${email}</p>
            </td></tr>
          </table>
          <table width="100%" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:1px;">Mensaje</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.7;white-space:pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">Puedes responder directamente a este correo para contestarle a ${senderName}.</p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;">idoneApp · Formulario de contacto</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
