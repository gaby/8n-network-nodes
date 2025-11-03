const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const {
  sendTcpData,
  TcpClient,
} = require("../dist/nodes/TCP/TcpClient.node.js");
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

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.connect = createSpy((_port, _host, callback) => {
      callback?.();
    });
    this.write = createSpy((message, encoding, callback) => {
      callback?.();
    });
    this.end = createSpy(() => {});
    this.destroy = createSpy(() => {});
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("sendTcpData resolves when sending without waiting for response", async () => {
  const socket = new MockSocket();

  const result = await sendTcpData(
    "127.0.0.1",
    5000,
    "hello",
    false,
    50,
    50,
    "utf8",
    false,
    { createSocket: () => socket }
  );

  assert.equal(result.status, "sent_no_wait");
  assert.equal(result.bytes, Buffer.byteLength("hello", "utf8"));
  assert.equal(socket.write.calls.length, 1);
  assert.equal(socket.end.calls.length, 1);
});

test("sendTcpData resolves with response when waiting for data", async () => {
  const socket = new MockSocket();

  const promise = sendTcpData(
    "127.0.0.1",
    5000,
    "ping",
    true,
    50,
    50,
    "utf8",
    false,
    { createSocket: () => socket }
  );

  queueMicrotask(() => {
    socket.emit("data", Buffer.from("pong", "utf8"));
  });

  const result = await promise;
  assert.equal(result.status, "response_received");
  assert.deepEqual(result.response, { data: "pong", bytes: 4 });
  assert.equal(socket.end.calls.length, 1);
});

test("sendTcpData resolves with no_response when timeout elapses", async () => {
  const socket = new MockSocket();

  const promise = sendTcpData(
    "127.0.0.1",
    5000,
    "ping",
    true,
    50,
    10,
    "utf8",
    false,
    { createSocket: () => socket }
  );

  await sleep(30);
  const result = await promise;
  assert.equal(result.status, "no_response");
  assert.equal(socket.destroy.calls.length >= 1, true);
});

test("sendTcpData rejects when socket emits error", async () => {
  const socket = new MockSocket();

  const promise = sendTcpData(
    "127.0.0.1",
    5000,
    "ping",
    true,
    50,
    50,
    "utf8",
    false,
    { createSocket: () => socket }
  );

  queueMicrotask(() => {
    socket.emit("error", new Error("TCP failure"));
  });

  await assert.rejects(promise, /TCP Error: TCP failure/);
});

function createExecuteContext(
  parameters,
  overrides = {},
  helperOverrides = {}
) {
  const getNodeParameter = (name) => parameters[name];
  return {
    getInputData: () => [{ json: {} }],
    getNodeParameter,
    getNode: () => ({ name: "TcpClient" }),
    helpers: helperOverrides,
    ...overrides,
  };
}

test("TcpClient.execute resolves with sendTcpData result", async () => {
  const sendCalls = [];
  const node = new TcpClient();
  const helpers = {
    tcpClient: {
      sendTcpData: async (...args) => {
        sendCalls.push(args);
        return {
          protocol: "tcp",
          host: "localhost",
          port: 1234,
          message: "payload",
        };
      },
    },
  };

  const parameters = {
    host: "localhost",
    port: 1234,
    message: "payload",
    options: {
      waitForResponse: false,
      connectionTimeout: 40,
      responseTimeout: 20,
      encoding: "utf8",
      keepConnectionOpen: false,
    },
  };

  const context = createExecuteContext(parameters, {}, helpers);
  const result = await node.execute.call(context);

  assert.equal(sendCalls.length, 1);
  assert.deepEqual(result[0][0].json, {
    protocol: "tcp",
    host: "localhost",
    port: 1234,
    message: "payload",
  });
});

test("TcpClient.execute throws NodeOperationError when sendTcpData fails", async () => {
  const node = new TcpClient();

  const parameters = {
    host: "localhost",
    port: 1234,
    message: "payload",
    options: {
      waitForResponse: false,
    },
  };

  const context = createExecuteContext(
    parameters,
    {},
    {
      tcpClient: {
        sendTcpData: async () => {
          throw new Error("write failed");
        },
      },
    }
  );

  await assert.rejects(node.execute.call(context), NodeOperationError);
});
