const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const {
  UdpServerTrigger,
} = require("../dist/nodes/Triggers/UdpServerTrigger.node.js");
const { NodeOperationError } = require("n8n-workflow");

function createSpy(implementation = () => undefined) {
  const calls = [];
  const spy = (...args) => {
    calls.push(args);
    return implementation(...args);
  };
  spy.calls = calls;
  return spy;
}

class MockUdpServer extends EventEmitter {
  constructor() {
    super();
    this.send = createSpy((buffer, offset, length, port, address, callback) => {
      callback?.(null);
    });
    this.close = createSpy(() => {});
    this.bind = createSpy(() => {});
    this.address = createSpy(() => ({ address: "127.0.0.1", port: 4500 }));
  }
}

function createTriggerContext(
  parameters,
  overrides = {},
  helperOverrides = {}
) {
  const getNodeParameter = (name) => parameters[name];
  return {
    emit: createSpy(() => {}),
    getNodeParameter,
    getNode: () => ({ name: "UdpServerTrigger" }),
    helpers: helperOverrides,
    ...overrides,
  };
}

test("UdpServerTrigger emits workflow data and sends response", async () => {
  const server = new MockUdpServer();
  const node = new UdpServerTrigger();

  const parameters = {
    port: 4500,
    host: "0.0.0.0",
    options: {
      encoding: "utf8",
      sendResponse: true,
      responseMessage: "ack",
    },
  };

  const context = createTriggerContext(
    parameters,
    {},
    {
      udpServerTrigger: {
        createSocket: () => server,
      },
    }
  );
  const response = await node.trigger.call(context);

  const messageHandler = server.listeners("message")[0];
  messageHandler(Buffer.from("payload", "utf8"), {
    address: "192.168.0.5",
    port: 6000,
    family: "udp4",
    size: 7,
  });

  assert.equal(server.send.calls.length, 1);
  const sendArgs = server.send.calls[0];
  assert.equal(sendArgs[0].toString("utf8"), "ack");
  assert.equal(sendArgs[1], 0);
  assert.equal(sendArgs[2], Buffer.from("ack", "utf8").length);
  assert.equal(sendArgs[3], 6000);
  assert.equal(sendArgs[4], "192.168.0.5");
  assert.equal(typeof sendArgs[5], "function");

  assert.equal(context.emit.calls.length, 1);
  const emitted = context.emit.calls[0][0][0][0];
  assert.equal(emitted.json.protocol, "udp");
  assert.equal(emitted.json.server.host, "0.0.0.0");
  assert.equal(emitted.json.server.port, 4500);
  assert.equal(emitted.json.data, "payload");
  assert.equal(emitted.json.responseSent, true);
  assert.equal(
    emitted.binary.data.data,
    Buffer.from("payload").toString("base64")
  );

  await response.closeFunction?.();
  assert.equal(server.close.calls.length, 1);
});

test("UdpServerTrigger throws NodeOperationError when socket creation fails", async () => {
  const node = new UdpServerTrigger();

  const parameters = {
    port: 4500,
    host: "0.0.0.0",
    options: {},
  };

  const context = createTriggerContext(
    parameters,
    {},
    {
      udpServerTrigger: {
        createSocket: () => {
          throw new Error("socket fail");
        },
      },
    }
  );

  await assert.rejects(node.trigger.call(context), NodeOperationError);
});
