const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const {
  TcpServerTrigger,
} = require("../dist/nodes/Triggers/TcpServerTrigger.node.js");
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

class MockServer extends EventEmitter {
  constructor() {
    super();
    this.maxConnections = 0;
    this.listen = createSpy((_port, _host, callback) => {
      callback?.();
    });
    this.close = createSpy(() => {});
  }
}

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.remoteAddress = "192.168.0.2";
    this.remotePort = 5001;
    this.localAddress = "127.0.0.1";
    this.localPort = 5000;
    this.write = createSpy(() => {});
    this.end = createSpy(() => {});
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
    getNode: () => ({ name: "TcpServerTrigger" }),
    helpers: helperOverrides,
    ...overrides,
  };
}

test("TcpServerTrigger configures server and emits workflow data", async () => {
  const server = new MockServer();
  const node = new TcpServerTrigger();

  const parameters = {
    port: 4000,
    host: "127.0.0.1",
    options: {
      encoding: "utf8",
      maxConnections: 5,
      keepConnectionOpen: false,
      sendResponse: true,
      responseMessage: "ack",
    },
  };

  const context = createTriggerContext(
    parameters,
    {},
    {
      tcpServerTrigger: {
        createServer: () => server,
      },
    }
  );
  const response = await node.trigger.call(context);

  assert.equal(server.maxConnections, 5);
  assert.equal(server.listen.calls.length, 1);
  const listenArgs = server.listen.calls[0];
  assert.equal(listenArgs[0], 4000);
  assert.equal(listenArgs[1], "127.0.0.1");

  const connectionHandler = server.listeners("connection")[0];
  const socket = new MockSocket();
  connectionHandler(socket);

  socket.emit("data", Buffer.from("hello", "utf8"));

  assert.equal(socket.write.calls.length, 1);
  assert.deepEqual(socket.write.calls[0], ["ack", "utf8"]);
  assert.equal(socket.end.calls.length, 1);

  assert.equal(context.emit.calls.length, 1);
  const emitted = context.emit.calls[0][0][0][0];
  assert.equal(emitted.json.protocol, "tcp");
  assert.equal(emitted.json.server.host, "127.0.0.1");
  assert.equal(emitted.json.server.port, 4000);
  assert.equal(emitted.json.data, "hello");
  assert.equal(emitted.json.responseSent, true);

  await response.closeFunction?.();
  assert.equal(server.close.calls.length, 1);
});

test("TcpServerTrigger throws NodeOperationError when server creation fails", async () => {
  const node = new TcpServerTrigger();

  const parameters = {
    port: 4000,
    host: "127.0.0.1",
    options: {},
  };

  const context = createTriggerContext(
    parameters,
    {},
    {
      tcpServerTrigger: {
        createServer: () => {
          throw new Error("bind failure");
        },
      },
    }
  );

  await assert.rejects(node.trigger.call(context), NodeOperationError);
});
