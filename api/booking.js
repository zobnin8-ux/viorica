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

  const text = [
    '📩 Новая заявка с сайта Виорики',
    'Имя: ' + clean(name, 100),
    'Контакт: ' + clean(contact, 200),
    'Направление: ' + SERVICES[service],
    'Комментарий: ' + (clean(message, 1500) || '—'),
    'Согласие на обработку данных: да'
  ].join('\n');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response;
    try {
      response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text }),
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
