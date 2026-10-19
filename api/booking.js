const SERVICES=new Set(['','hypnotherapy','regression','emdr','cosmoenergy','angels','ancestry','parts','mesmerism']);
const clean=(value,max)=>value.trim().replace(/[<>]/g,'').slice(0,max);
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const body=req.body||{};
  const {name='',contact='',service='',message='',website='',consent=''}=body;
  if(website)return res.status(200).json({ok:true});
  if(consent!=='yes')return res.status(400).json({error:'Consent required'});
  if([name,contact,service,message].some(v=>typeof v!=='string')||!name.trim()||!contact.trim()||name.length>100||contact.length>200||service.length>100||message.length>1500||!SERVICES.has(service))return res.status(400).json({error:'Invalid input'});
  const token=process.env.TELEGRAM_BOT_TOKEN;
  const chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat)return res.status(503).json({error:'Not configured'});
  const text=['Новая заявка с сайта Виорики','Имя: '+clean(name,100),'Контакт: '+clean(contact,200),'Направление: '+clean(service,100),'Комментарий: '+clean(message,1500),'Согласие на обработку данных: да'].join('\\n');
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    let response;
    try{response=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text}),signal:controller.signal});}
    finally{clearTimeout(timeout);}
    if(!response.ok)return res.status(502).json({error:'Delivery failed'});
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({error:'Delivery failed'});}
}
