# Nodejs multiserver.

Serves multiple domains with the same server and ports.

HTTP requests are redirected to HTTPS.

HTTP2 and HTTP1.1.

Built-in Let's Encrypt certificate renewal.

# Setup

```javascript 1.8
const MultiDomainServer=require('./multidomain-server').MultiDomainServer;
const server = MultiDomainServer();
(async ()=>{
  await Promise.all(
    [
       server.addServer(
         {
            hostnames: [ // list of domains for this specific handler 
              'mydomain.com', // first one is the primary
              'www.mydomain.com', // redirects to primary
              'mydomain.net', // redirects to primary
              'www.mydomain.net'  // redirects to primary
            ]
         },
         key: { // tls certificate key
           path: 'mydomain.key.pem'
         },
         cert: { // tls certificate
           path: 'mydomcain.cert.pem'
         },
         acme: { // let's encrypt account for certificate renewal (optional)
           email: 'contact@mydomain.com'
         },
         handler: (request,response,hostname,remoteAddress,local,server)=>{
           response.writeHead(200, { 'Content-Type': 'text/plain' });
           response.write(`Hostname: ${hostname}\n`);
           response.write(`Remote address: ${remoteAddress}\n`);
           response.write(`Request from localhost: ${local}\n`);
           response.end();
         }
       ),
       server.addServer(
         {
            hostnames: [ // list of domains for this specific handler 
              'myotherdomain.com', // first one is the primary
              'www.myotherdomain.com' // redirects to primary
            ]
         },
         key: { // tls certificate key
           path: 'myotherdomain.key.pem'
         },
         cert: { // tls certificate
           path: 'myotherdomcain.cert.pem'
         },
         acme: { // let's encrypt account for certificate renewal (optional)
           email: 'contact@myotherdomain.com'
         },
         handler: (request,response,hostname,remoteAddress,local,server)=>{
           response.writeHead(200, { 'Content-Type': 'text/plain' });
           response.write(`Hostname: ${hostname}\n`);
           response.write(`Remote address: ${remoteAddress}\n`);
           response.write(`Request from localhost: ${local}\n`);
           response.end();
         }
       )
    ]
  )
})();
```

## Let's Encrypt certificate renewal

Endpoint only valid from the local host.

`http://mydomain.com/update_certificate`


## Ports

By default, port 80 is used for HTTP and 443 is used for HTTPS.
Those ports can be changed by passing different values to the MultiServer constructor.


## Systemd

You can run the server with systemd.

Note that you **SHOULD NOT** specify custom ports to the MultiServer constructor in this case.

Example configuration that runs the server with the www-data user but still binds to
priviledged ports 80 and 443.


`example.socket`

```
[Socket]
ListenStream=80
ListenStream=443
NoDelay=true

[Install]
WantedBy=sockets.target
```

`example.service`

```
[Unit]
Description=nodejs multiserver
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/admin/multiserver
ExecStart=/usr/bin/node index.js
NonBlocking=true
Restart=on-failure
RestartSec=15s

[Install]
WantedBy=multi-user.target
```

`example_certificate_renewal.service`

```
[Unit]
Description=mydomain.com certificate renewal
Wants=example_certificate_renewal.timer

[Service]
ExecStart=/usr/bin/curl "http://mydomain.com/update_certificate"
WorkingDirectory=/home/admin

[Install]
WantedBy=multi-user.target
```

`example_certificate_renewal.timer`

```
[Unit]
Description=Runs mydomain.com certificate renewal every week
Requires=example_certificate_renewal.service

[Timer]
Unit=example_certificate_renewal.service
OnBootSec=5min
OnUnitInactiveSec=1w
RandomizedDelaySec=12h
AccuracySec=1h

[Install]
WantedBy=timers.target
```


## Handlers

There is a helper for combining handlers.

directory urls with a trailing slash redirect to the same url with no trailing slash.

`/some/directory/?query => 301 to /some/directory?query`

```javascript 1.8
const handers=require('./handlers');
server.addServer(
  hostnames: [ 'mydomain.com', 'www.mydomain.com' ],
  key: { path: 'mydomain.key.pem' },
  cert: { path: 'mydomain.cert.pem' },
  handler: handlers(
    {
      accept: (request, response, hostname, remoteAddress, local, server) => {
        return request.url.indexOf('/test') === 0 ? { response: response } : null;
      },
      handle: (accepted)=>{
        accepted.response.end('first handler');
      }
    },
    {
      accept: (request, response, hostname, remoteAddress, local, server) => {
        return { response: response };
      },
      handle: (accepted)=>{
        accepted.response.end('second handler');
      }
    }
  )
)
```

## Static files

There is a helper for serving static files.

Only files with the following extensions are served:
- `js`, `mjs`
- `css`
- `html`, `htm`
- `txt`
- `csv`
- `xml`
- `json`
- `woff`, `woff2`
- `svg`
- `png`, `jpg`
- `ico`
- `webp`
- `mp4`
- `webm`
- `wav`
- `mp3`
- `zip`
- `pdf`
- `manifest`

Files are loaded in memory.

gzip and br (brotli) compression is enabled.

The compression occurs at server startup.

Etags based are generated.

index.html files are directory indexes and are only served from the directory url.

`/some/directory/index.html => 404`

`/some/directory/           => 301 to /some/directory`

`/some/directory            => 200`


```javascript 1.8
server.addServer(
  {
    hostnames: [ 'mydomain.com', 'www.mydomain.com' ],
    key: { path: 'mydomain.key.pem' },
    cert: { path: 'mydomain.cert.pem' },
    handler: handlers(await require('./static')('wwww'))
  }
)
```

### Updating files

Since the files are loading in memory, changes to the files on disk have no effect
until the server is restarted or the following endpoint is used.

`https://mydomain.com/sync`

This endpoint is only valid when called from the local host.
