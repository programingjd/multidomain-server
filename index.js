const MultiDomainServer=require('./multidomain-server').MultiDomainServer;
const handlers=require('./handlers');
const directory=require('./static');

module.exports={
  MultiDomainServer: MultiDomainServer,
  handlers: handlers,
  directory: directory
};
