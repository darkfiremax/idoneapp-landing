export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, name, _hp, _t } = req.body;

  // Anti-spam: honeypot — si el campo oculto tiene algo, es un bot
  if (_hp && _hp.length > 0) {
    return res.status(200).json({ success: true }); // respuesta falsa para no delatar
  }

  // Anti-spam: time check — menos de 2 segundos desde que cargó la página = bot
  if (typeof _t === 'number' && _t < 2000) {
    return res.status(200).json({ success: true }); // respuesta falsa
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = 3;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  const firstName = name ? name.split(' ')[0] : null;

  try {
    // 1. Guardar contacto en Brevo
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: name ? { FIRSTNAME: firstName, LASTNAME: name.split(' ').slice(1).join(' ') || '' } : {},
      }),
    });

    if (!contactRes.ok) {
      const error = await contactRes.json();
      console.error('Brevo contact error:', error);
      return res.status(contactRes.status).json({ error: 'No se pudo guardar el email' });
    }

    // 2. Enviar email de bienvenida
    const greeting = firstName ? `Hola ${firstName}` : 'Hola';

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'idoneApp', email: 'no-reply@idoneapp.com' },
        to: [{ email, name: name || email }],
        replyTo: { email: 'hola@idoneapp.com', name: 'idoneApp' },
        headers: {
          'List-Unsubscribe': `<https://idoneapp.com/unsubscribe?email=${encodeURIComponent(email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        subject: '¡Tu lugar está reservado! 🎉',
        htmlContent: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡Bienvenido a idoneApp!</title>
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    :root { color-scheme: light dark; }
    /* Prevent Gmail auto dark mode from transforming our intentional dark design */
    [data-ogsc] body, [data-ogsb] body { background-color: #0D0118 !important; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0D0118 !important; }
      .email-wrapper { background: linear-gradient(145deg,#1a0530,#2a0a40) !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0D0118;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0118;padding:40px 16px;">
    <tr>
      <td align="center">
        <table class="email-wrapper" width="100%" style="max-width:520px;background:linear-gradient(145deg,#1a0530,#2a0a40);border-radius:24px;border:1px solid rgba(123,63,158,0.3);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 40px 32px;">
              <img src="https://idoneapp.com/icon.png" alt="idoneApp" width="64" height="64" style="border-radius:16px;display:block;margin:0 auto 16px;" />
              <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                idone<span style="color:#C96868;">App</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;">Pre-lanzamiento</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">
                ${greeting},<br/>ya tienes tu lugar. ✨
              </p>
              <p style="margin:16px 0 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
                Eres uno de los primeros en unirte a <strong style="color:#fff;">idoneApp</strong> — la primera app de citas para adventistas.
                Cuando abramos las puertas, serás de los primeros en entrar.
              </p>

              <!-- Benefit box -->
              <table width="100%" style="margin:28px 0;background:rgba(201,104,104,0.1);border:1px solid rgba(201,104,104,0.25);border-radius:16px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#C96868;letter-spacing:1.5px;text-transform:uppercase;">Tu beneficio de fundador</p>
                    <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#ffffff;">30 días Premium gratis</p>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Sin tarjeta de crédito. Sin compromisos.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
                Te avisaremos en este correo cuando la app esté lista. Mientras tanto, si tienes preguntas puedes responder este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;line-height:1.8;">
                idoneApp · Hecho con ❤️ para la comunidad adventista<br/>
                Recibiste este correo porque te registraste en idoneapp.com<br/>
                <a href="https://idoneapp.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(255,255,255,0.2);text-decoration:underline;font-size:11px;">Cancelar suscripción</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    });

    // 3. Chequear milestones y notificar al fundador
    const MILESTONES = [20, 50, 80, 100];
    try {
      const listRes = await fetch('https://api.brevo.com/v3/contacts/lists/3', {
        headers: { 'api-key': apiKey },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const total = listData.totalSubscribers || 0;
        if (MILESTONES.includes(total)) {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'idoneApp', email: 'no-reply@idoneapp.com' },
              to: [{ email: 'firemax12@gmail.com', name: 'Jonathan' }],
              subject: `🚀 ¡Ya llevas ${total} personas en idoneApp!`,
              htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0D0118;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0118;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:500px;background:linear-gradient(145deg,#1a0530,#2a0a40);border-radius:24px;border:1px solid rgba(123,63,158,0.3);overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <img src="https://idoneapp.com/icon.png" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 20px;"/>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#C96868;letter-spacing:2px;text-transform:uppercase;text-align:center;">Hito alcanzado 🎯</p>
          <p style="margin:0 0 24px;font-size:42px;font-weight:800;color:#fff;text-align:center;line-height:1.1;">${total} personas</p>
          <p style="margin:0 0 20px;font-size:16px;color:rgba(255,255,255,0.75);line-height:1.7;">
            Ya llevas <strong style="color:#fff;">${total} adventistas</strong> esperando idoneApp.
            Prepárate para ir liberando la app — la comunidad está lista para ti. 🚀
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,104,104,0.1);border:1px solid rgba(201,104,104,0.25);border-radius:16px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;color:#C96868;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Próximos pasos</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;">
                ✦ Prepara el backend y los códigos promo<br/>
                ✦ Activa las cuentas @idoneapp en redes<br/>
                ✦ Cuando estés listo, envía la campaña de lanzamiento
              </p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">Último registro: ${name ? name + ' · ' : ''}${email}</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);text-align:center;">idoneApp · Notificación automática de hito</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
            }),
          });
        }
      }
    } catch (milestoneErr) {
      console.error('Milestone error:', milestoneErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
