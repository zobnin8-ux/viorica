export async function onRequestPost({request,env}) {
  let body;
  try { body=await request.json(); } catch {return Response.json({error:'Invalid JSON'},{status:400})}
  const {name='',contact='',service='',message='',website=''}=body||{};
  if(website)return Response.json({ok:true});
  if(typeof name!=='string'||typeof contact!=='string'||!name.trim()||!contact.trim()||name.length>100||contact.length>200||String(message).length>1500)return Response.json({error:'Invalid input'},{status:400});
  if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)return Response.json({error:'Not configured'},{status:503});
  const clean=x=>String(x).replace(/[<>]/g,'').slice(0,1500);
  const text=`Новая заявка с сайта Виорики\nИмя: ${clean(name)}\nКонтакт: ${clean(contact)}\nНаправление: ${clean(service)}\nКомментарий: ${clean(message)}`;
  const result=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text})});
  if(!result.ok)return Response.json({error:'Telegram error'},{status:502});
  return Response.json({ok:true});
}
