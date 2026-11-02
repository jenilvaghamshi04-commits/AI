import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/generate/route';
import {PROVIDERS,initialConnections} from '../lib/image-providers';
const key='test-provider-key-12345', b64='dGVzdA==';
const request=(provider='openai',overrides:any={})=>new Request('https://studio.test/api/generate',{method:'POST',body:JSON.stringify({provider,key,prompt:'A green bottle',size:'1536x1024',model:PROVIDERS[provider as keyof typeof PROVIDERS]?.models[0],...overrides})});
const originalFetch=globalThis.fetch;
test('all providers route credentials only to their own endpoint and normalize image responses',async()=>{
 try{
 for(const provider of Object.keys(PROVIDERS)){
 let called=false;
 globalThis.fetch=async(input,init)=>{
 called=true;const url=String(input),headers=new Headers(init?.headers);
 if(provider==='gemini'){
 assert.equal(new URL(url).hostname,'generativelanguage.googleapis.com');assert.equal(headers.get('x-goog-api-key'),key);assert.equal(headers.get('authorization'),null);
 const body=JSON.parse(init?.body as string);assert.equal(body.generationConfig.imageConfig.aspectRatio,'3:2');assert.deepEqual(body.generationConfig.responseModalities,['TEXT','IMAGE']);
 return Response.json({candidates:[{content:{parts:[{text:'Here is your image'},{inlineData:{mimeType:'image/jpeg',data:b64}}]}}]});
 }
 assert.equal(headers.get('authorization'),`Bearer ${key}`);
 if(provider==='stability'){
 assert.equal(url,'https://api.stability.ai/v2beta/stable-image/generate/core');assert.ok(init?.body instanceof FormData);assert.equal(init.body.get('aspect_ratio'),'3:2');
 return new Response(Buffer.from('test'),{headers:{'Content-Type':'image/png'}});
 }
 const body=JSON.parse(init?.body as string);
 if(provider==='together'){assert.equal(url,'https://api.together.ai/v1/images/generations');assert.equal(body.width,1536);assert.equal(body.height,1024);assert.equal(body.response_format,'base64');assert.equal(body.output_format,'png');assert.equal(body.steps,4);}
 else{assert.equal(url,'https://api.openai.com/v1/images/generations');assert.equal(body.size,'1536x1024');}
 return Response.json({data:[{b64_json:b64}]});
 };
 const result=await POST(request(provider));assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'no-store');
 const data:any=await result.json();assert.equal(data.src,`data:image/${provider==='gemini'?'jpeg':'png'};base64,${b64}`);assert.ok(called);
 }
 }finally{globalThis.fetch=originalFetch;}
});
test('invalid provider, mismatched model, invalid size, and missing key are rejected before any request',async()=>{
 try{globalThis.fetch=async()=>{throw Error('Network must not be called');};
 for(const req of [request('unknown'),request('gemini',{model:'gpt-image-1.5'}),request('together',{size:'999x999'}),request('stability',{key:''})]){assert.equal((await POST(req)).status,400);}
 assert.equal((await POST(new Request('https://studio.test/api/generate',{method:'POST',body:'not json'}))).status,400);
 }finally{globalThis.fetch=originalFetch;}
});
test('provider failures redact keys and do not claim success without an image',async()=>{
 try{
 globalThis.fetch=async()=>Response.json({error:{message:`Invalid key ${key}`}},{status:401});
 let r=await POST(request());assert.equal(r.status,401);assert.ok(!(await r.text()).includes(key));
 globalThis.fetch=async()=>Response.json({candidates:[{content:{parts:[{text:'No image'}]}}]});
 r=await POST(request('gemini'));assert.equal(r.status,502);
 globalThis.fetch=async()=>Response.json({data:[]});assert.equal((await POST(request())).status,502);
 globalThis.fetch=async()=>{throw new DOMException('timeout','TimeoutError');};r=await POST(request('together'));assert.equal(r.status,502);assert.match(await r.text(),/timed out/);
 }finally{globalThis.fetch=originalFetch;}
});
test('provider keys are independent in each new session',()=>{const a=initialConnections(),b=initialConnections();a.gemini.key='example';assert.equal(a.openai.key,'');assert.equal(b.gemini.key,'');});
