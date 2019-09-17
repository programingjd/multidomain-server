const www='www.';

const splitUri=uri=>{
  const i1=uri.indexOf('?');
  const i2=uri.indexOf('#');
  if(i1===-1){
    if(i2===-1) return [uri,''];
    return [uri.substring(0,i2),uri.substring(i2)];
  }
  else if(i2===-1||i2>i1){
    return [uri.substring(0,i1),uri.substring(i1)];
  }
  else return [uri.substring(0,i2),uri.substring(i2)];
};

/**
 * @params {
 *   Array<
 *     {
 *       accept:function(
 *         request:http2.Http2ServerRequest?,
 *         response:http2.Http2ServerResponse?,
 *         hostname:string?,
 *         remoteAddress:string?,
 *         local:boolean?,
 *         server:MultiServer?
 *       ),
 *       handle:function(any)
 *     }
 *   >
 * } handlers
 * @returns {function(
 *   request:http2.Http2ServerRequest?,
*    response:http2.Http2ServerResponse?,
*    hostname:string?,
*    remoteAddress:string?,
*    local:boolean?,
*    server:MultiServer?
 * )}
 */
module.exports=(handlers)=>{
  return (request,response,hostname,remoteAddress,local,server)=>{
    request.setTimeout(300000);
    const [path,params]=splitUri(request.url);
    if(hostname.indexOf(www)===0){
      const authority=`${hostname.substring(www.length)}${server.httpsPort===443?'':':'+server.httpsPort}`;
      const redirect=`https://${authority}${path.replace(/[/]$/g,'')}${params}`;
      return response.writeHead(301,{ Location: redirect }).end();
    }
    if(path.length>1&&path[path.length-1]==='/'){
      const redirect=`${path.replace(/[/]$/g,'')}${params}`;
      return response.writeHead(301,{ Location: redirect}).end();
    }
    for(let i=0;i<handlers.length;++i){
      const handler=handlers[i];
      const accepted=handler.accept(request,response,hostname,remoteAddress,local,server);
      if(accepted) return handler.handle(accepted);
    }
    return response.writeHead(404).end();
  }
};
