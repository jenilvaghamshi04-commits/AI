export async function POST(request:Request){
try{const {key,prompt,size,model}=await request.json() as {key:string;prompt:string;size:string;model:string};
if(typeof key!=='string'||key.length<10)return Response.json({error:'Enter a valid OpenAI API key in Settings.'},{status:400});
if(typeof prompt!=='string'||!prompt.trim()||prompt.length>12500)return Response.json({error:'Please enter a prompt under 12,000 characters.'},{status:400});
if(!['gpt-image-1.5','gpt-image-1-mini','gpt-image-2'].includes(model)||!['1024x1024','1536x1024','1024x1536'].includes(size))return Response.json({error:'Unsupported image settings.'},{status:400});
const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,size,n:1}),signal:AbortSignal.timeout(180000)});
const data=await r.json() as {error?:{message?:string};data?:{b64_json?:string}[]};if(!r.ok)return Response.json({error:data.error?.message||'Provider could not generate this image.'},{status:r.status});
const b64=data.data?.[0]?.b64_json;if(!b64)return Response.json({error:'The provider returned no image. Please try again.'},{status:502});
return Response.json({src:`data:image/png;base64,${b64}`},{headers:{'Cache-Control':'no-store'}});
}catch(e:any){return Response.json({error:e.name==='TimeoutError'?'Generation timed out. Please try again.':'Unable to connect to the image provider. Please try again.'},{status:502});}}
