import {PROVIDERS,aspectRatio,type Provider} from '../../../lib/image-providers';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const image=(b64:string,mime='image/png')=>({src:`data:${mime};base64,${b64}`});
export async function POST(request:Request){
 let input:any;
 try{input=await request.json();}catch{return reply({error:'Invalid request body.'},400);}
 if(!input||typeof input!=='object')return reply({error:'Invalid request body.'},400);
 const {key,prompt,size,model}=input;const provider=input.provider??'openai';
 if(typeof provider!=='string'||!Object.hasOwn(PROVIDERS,provider))return reply({error:'Choose a supported image provider.'},400);
 const config=PROVIDERS[provider as Provider];
 if(typeof key!=='string'||key.trim().length<10||key.length>4096)return reply({error:`Enter your ${config.name} API key in Settings.`},400);
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>12500)return reply({error:'Please enter a prompt under 12,000 characters.'},400);
 if(!(config.models as readonly string[]).includes(model)||!['1024x1024','1536x1024','1024x1536'].includes(size))return reply({error:'Unsupported image settings for this provider.'},400);
 const signal=AbortSignal.timeout(180000);let response:Response;
 try{
 if(provider==='gemini'){
 response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio:aspectRatio(size)}}}),signal});
 }else if(provider==='stability'){
 const body=new FormData();body.set('prompt',prompt);body.set('aspect_ratio',aspectRatio(size));body.set('output_format','png');
 response=await fetch(`https://api.stability.ai/v2beta/stable-image/generate/${model}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,Accept:'image/*'},body,signal});
 }else{
 const [width,height]=size.split('x').map(Number);
 const body=provider==='together'?{model,prompt,width,height,n:1,response_format:'base64',output_format:'png',...(model.includes('schnell')?{steps:4}:{})}:{model,prompt,size,n:1};
 response=await fetch(provider==='together'?'https://api.together.ai/v1/images/generations':'https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 }
 if(!response.ok){
 const data:any=await response.json().catch(()=>({}));
 const message=typeof data.error==='string'?data.error:data.error?.message||data.message||(Array.isArray(data.errors)?data.errors.join(' '):'');
 const safeMessage=typeof message==='string'?message.replaceAll(key,'[redacted]').slice(0,700):'';
 return reply({error:`${config.name}: ${safeMessage||`Request failed (${response.status}). Check your key, credits, and model access.`}`},response.status>=400&&response.status<=599?response.status:502);
 }
 if(provider==='stability'){
 if(!response.headers.get('content-type')?.startsWith('image/'))return reply({error:'Stability AI returned no image.'},502);
 const bytes=await response.arrayBuffer();return reply(image(Buffer.from(bytes).toString('base64')));
 }
 const data:any=await response.json();
 if(provider==='gemini'){
 const parts=data.candidates?.[0]?.content?.parts||[];
 const part=parts.find((p:any)=>p.inlineData?.data&&['image/png','image/jpeg','image/webp'].includes(p.inlineData.mimeType));
 if(part)return reply(image(part.inlineData.data,part.inlineData.mimeType));
 return reply({error:data.promptFeedback?.blockReason?'Gemini could not generate this image due to its content policy. Try another prompt.':'Gemini returned no image. Try a different prompt or image model.'},502);
 }
 const b64=data.data?.[0]?.b64_json;
 if(typeof b64!=='string'||!b64)return reply({error:`${config.name} returned no image. Please try again.`},502);
 return reply(image(b64));
 }catch(e:any){return reply({error:e.name==='TimeoutError'?'Generation timed out. Please try again.':`Unable to connect to ${config.name}. Please try again.`},502);}
}
