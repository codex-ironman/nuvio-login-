import http from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/api.js':'api.js','/style.css':'style.css'};
const types={html:'text/html',js:'text/javascript',css:'text/css'};
http.createServer(async(req,res)=>{try{const path=allowed[new URL(req.url,'http://localhost').pathname];if(!path){res.writeHead(404);return res.end('Not found');}const body=await readFile(new URL(path,import.meta.url));res.writeHead(200,{'Content-Type':types[path.split('.').pop()]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end(body);}catch{res.writeHead(500);res.end('Unable to load app');}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Nuvio manager: http://localhost:3000'));
