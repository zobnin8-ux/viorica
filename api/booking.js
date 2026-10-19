const SERVICES = {
  '': 'Не указано',
  hypnotherapy: 'Гипнотерапия',
  regression: 'Регрессионная гипнотерапия',
  emdr: 'ДПДГ (EMDR)',
  cosmoenergy: 'Космоэнергетика',
  angels: 'Ангелотерапия',
  ancestry: 'Работа с родом',
  parts: 'Работа с субличностями',
  mesmerism: 'Месмеризм'
};
const clean = (value, max) => value.trim().replace(/[<>]/g, '').slice(0, max);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { name = '', contact = '', service = '', message = '', website = '', consent = '' } = body;
  if (typeof website !== 'string') return res.status(400).json({ error: 'Invalid input' });
  if (website) return res.status(200).json({ ok: true });
  if (consent !== 'yes') return res.status(400).json({ error: 'Consent required' });
  if ([name, contact, service, message].some(v => typeof v !== 'string')
    || !name.trim() || !contact.trim()
    || name.length > 100 || contact.length > 200 || service.length > 100 || message.length > 1500
    || !Object.prototype.hasOwnProperty.call(SERVICES, service)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(503).json({ error: 'Not configured' });

  // Telegram HTML requires escaping all client-controlled fields.
  const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const field = (value, max) => escapeHtml(value.trim().slice(0, max));
  const submittedAt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Chisinau', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date());

  const text = [
    '✦ <b>VIORICA CAZAC</b>',
    '<b>НОВАЯ ЗАЯВКА</b>',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '👤 <b>Клиент</b>',
    field(name, 100),
    '',
    '✉️ <b>Контакт</b>',
    field(contact, 200),
    '',
    '◈ <b>Направление</b>',
    escapeHtml(SERVICES[service]),
    '',
    '📝 <b>Комментарий</b>',
    field(message, 1500) || 'Не указан',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '🌐 Источник: сайт',
    '🕒 ' + submittedAt + ' · Кишинёв',
    '✓ Согласие на обработку данных получено'
  ].join('\\n');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return res.status(502).json({ error: 'Delivery failed' });
    const result = await response.json();
    if (result.ok !== true) return res.status(502).json({ error: 'Delivery failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Delivery failed' });
  }
}
