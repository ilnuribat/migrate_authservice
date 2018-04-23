const { ServiceBroker } = require('moleculer');
const Boom = require('boom');

require('dotenv').config();

let broker;

async function connect() {
  broker = new ServiceBroker({
    namespace: 'authService',
    transporter: process.env.AUTH_SERVICE_TRANSPORTER || 'redis://localhost:6378',
  });

  await broker.start();

  return broker.waitForServices('User');
}

function getBroker() {
  // Грязная имитация getBroker().call('Service.action', { key: value });
  // Чтобы завернуть всё это дело красиво в Boom
  return {
    async call(actionName, data) {
      try {
        return await broker.call(actionName, data);
      } catch (err) {
        if (err.code === 422) {
          throw Boom.create(400, 'E_VALIDATION_FAILED', {
            errors: err.data,
          });
        }
        if (err.code) {
          throw Boom.create(err.code, err.type, {
            errors: [{
              code: err.type,
              message: __(err.type),
            }],
          });
        }
        throw err;
      }
    },
  };
}

async function start () {
  console.log('connecting...');
  await connect();
  console.log('connected');
}


start();
