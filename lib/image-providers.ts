export const PROVIDERS = {
  openai: {name:'OpenAI', description:'GPT Image', models:['gpt-image-1.5','gpt-image-1-mini','gpt-image-2'], keyUrl:'https://platform.openai.com/api-keys'},
  gemini: {name:'Google Gemini', description:'Nano Banana · Gemini Image', models:['gemini-3.1-flash-image','gemini-nano-banana-2.1','gemini-2.5-flash-image'], keyUrl:'https://aistudio.google.com/api-keys'},
  stability: {name:'Stability AI', description:'Stable Image', models:['core','ultra'], keyUrl:'https://platform.stability.ai/account/keys'},
  together: {name:'Together AI', description:'FLUX image models', models:['black-forest-labs/FLUX.1-schnell','black-forest-labs/FLUX.2-pro'], keyUrl:'https://api.together.ai/settings/api-keys'},
} as const;
export type Provider = keyof typeof PROVIDERS;
export type Connection = {key:string; model:string};
export const initialConnections = ():Record<Provider,Connection> => Object.fromEntries(Object.entries(PROVIDERS).map(([id,p])=>[id,{key:'',model:p.models[0]}])) as Record<Provider,Connection>;
export const aspectRatio = (size:string) => size==='1536x1024'?'3:2':size==='1024x1536'?'2:3':'1:1';
