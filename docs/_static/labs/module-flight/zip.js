// Small, dependency-free ZIP writer for the classroom's UTF-8 source projects.
// Files use the standard stored method; Python's zipfile verifies the export.
const encoder=new TextEncoder();
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function record(size){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);return {bytes,u16:(offset,value)=>view.setUint16(offset,value,true),u32:(offset,value)=>view.setUint32(offset,value,true)};}
export function makeZip(files){
 const parts=[],central=[];let offset=0,centralSize=0,count=0;
 for(const [path,source]of Object.entries(files)){
  if(path.startsWith('/')||path.split('/').includes('..')||path.includes('\\'))throw new Error('Invalid project file path');
  const name=encoder.encode(path),data=encoder.encode(source),crc=crc32(data),local=record(30+name.length);
  local.u32(0,0x04034b50);local.u16(4,20);local.u16(6,0x0800);local.u16(12,33);local.u32(14,crc);local.u32(18,data.length);local.u32(22,data.length);local.u16(26,name.length);local.bytes.set(name,30);
  const directory=record(46+name.length);directory.u32(0,0x02014b50);directory.u16(4,20);directory.u16(6,20);directory.u16(8,0x0800);directory.u16(14,33);directory.u32(16,crc);directory.u32(20,data.length);directory.u32(24,data.length);directory.u16(28,name.length);directory.u32(42,offset);directory.bytes.set(name,46);
  parts.push(local.bytes,data);central.push(directory.bytes);offset+=local.bytes.length+data.length;centralSize+=directory.bytes.length;count++;
 }
 const end=record(22);end.u32(0,0x06054b50);end.u16(8,count);end.u16(10,count);end.u32(12,centralSize);end.u32(16,offset);
 const output=new Uint8Array(offset+centralSize+22);let position=0;for(const bytes of [...parts,...central,end.bytes]){output.set(bytes,position);position+=bytes.length;}return output;
}
