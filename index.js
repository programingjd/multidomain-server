const MultiServer=require('./multiserver').MultiServer;
const handlers=require('./handlers');
const files=require('./handlers');

const server=MultiServer();
(async ()=>{
  await Promise.all(
    [
      server.addServer({
        hostnames: [ 'localhost1', 'www.localhost1' ],
        key: {
          path: 'one.key.pem'
        },
        cert: {
          path: 'one.cert.pem'
        },
        acme: {
          email: 'contact@example.com'
        },
        handler: handlers(await require('./static')('www1'))
      }),
      server.addServer({
        hostnames: [ 'localhost2' ],
        key: {
          path: 'two.key.pem'
        },
        cert: {
          path: 'two.cert.pem'
        },
        acme: {
          email: 'contact@example.com'
        },
        handler: handlers(await require('./static')('www2'))
      })
    ]
  )
})();

