/* Restore exact official runtime bytes from small, same-origin file parts. */
self.installFlightAssetLoader = async function () {
  const nativeFetch=self.fetch.bind(self);
  const vendor=new URL('./vendor/',self.location.href);
  const metadata=await nativeFetch(new URL('ASSET_PARTS.json',vendor));
  if(!metadata.ok)throw new Error('无法加载 Python 资源清单。');
  const {assets}=await metadata.json();
  const descriptors=new Map(assets.map(asset=>[new URL(asset.path,vendor).href,asset]));
  const pending=new Map();
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  async function assemble(asset){
    const bytes=new Uint8Array(asset.bytes);
    let next=0;
    const offsets=asset.parts.map(part=>{const start=next;next+=part.bytes;return start;});
    if(next!==asset.bytes)throw new Error('Python 资源清单长度不一致。');
    let cursor=0;
    await Promise.all(Array.from({length:Math.min(4,asset.parts.length)},async()=>{
      while(cursor<asset.parts.length){
        const index=cursor++,part=asset.parts[index];
        let buffer;
        for(let attempt=0;attempt<3;attempt++){
          try{
            const response=await nativeFetch(new URL(part.path,vendor));
            if(!response.ok)throw new Error('Python 资源加载失败，请刷新重试。');
            buffer=new Uint8Array(await response.arrayBuffer());
            break;
          }catch(error){if(attempt===2)throw error;}
        }
        if(buffer.length!==part.bytes||await hash(buffer)!==part.sha256)throw new Error('Python 资源校验未通过，请刷新重试。');
        bytes.set(buffer,offsets[index]);
      }
    }));
    if(await hash(bytes)!==asset.sha256)throw new Error('Python 完整资源校验未通过。');
    return bytes;
  }
  // Complete verification before CPython bootstrap: the upstream loader logs
  // stdlib fetch errors and otherwise continues into an unusable interpreter.
  for(const asset of assets){
    const url=new URL(asset.path,vendor).href;
    pending.set(url,assemble(asset));
    await pending.get(url);
  }
  self.fetch=async function(input,options){
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;
    const url=new URL(raw,self.location.href).href;
    const asset=descriptors.get(url);
    if(!asset)return nativeFetch(input,options);
    if(!pending.has(url))pending.set(url,assemble(asset));
    return new Response(await pending.get(url),{status:200,headers:{'Content-Type':asset.mime,'Content-Length':String(asset.bytes)}});
  };
};
