const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");

const {
  sendUdpData,
  UdpClient,
} = require("../dist/nodes/UDP/UdpClient.node.js");
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

class MockUdpSocket extends EventEmitter {
  constructor() {
    super();
    this.send = createSpy((buffer, offset, length, port, host, callback) => {
      callback?.(null);
    });
    this.close = createSpy(() => {});
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("sendUdpData resolves when sending without waiting for response", async () => {
  const socket = new MockUdpSocket();

  const result = await sendUdpData(
    "localhost",
    4000,
    "hello",
    false,
    30,
    "utf8",
    { createSocket: () => socket }
  );

  assert.equal(result.status, "sent_no_wait");
  assert.equal(result.bytes, Buffer.from("hello", "utf8").length);
  assert.equal(socket.send.calls.length, 1);
  assert.equal(socket.close.calls.length, 1);
});

test("sendUdpData resolves with response when waiting for message", async () => {
  const socket = new MockUdpSocket();

  const promise = sendUdpData("localhost", 4000, "ping", true, 30, "utf8", {
    createSocket: () => socket,
  });

  queueMicrotask(() => {
    socket.emit("message", Buffer.from("pong", "utf8"), {
      address: "127.0.0.1",
      port: 5000,
      family: "udp4",
      size: 4,
    });
  });

  const result = await promise;
  assert.equal(result.status, "response_received");
  assert.deepEqual(result.response, {
    data: "pong",
    bytes: 4,
    from: { address: "127.0.0.1", port: 5000 },
  });
  assert.equal(socket.close.calls.length, 1);
});

test("sendUdpData resolves with no_response when timeout elapses", async () => {
  const socket = new MockUdpSocket();

  const promise = sendUdpData("localhost", 4000, "ping", true, 10, "utf8", {
    createSocket: () => socket,
  });

  await sleep(25);
  const result = await promise;
  assert.equal(result.status, "no_response");
});

test("sendUdpData rejects when send fails", async () => {
  const socket = new MockUdpSocket();
  socket.send = createSpy(
    (_buffer, _offset, _length, _port, _host, callback) => {
      callback?.(new Error("send failed"));
    }
  );

  await assert.rejects(
    sendUdpData("localhost", 4000, "ping", false, 10, "utf8", {
      createSocket: () => socket,
    }),
    /UDP Send Error: send failed/
  );
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
    getNode: () => ({ name: "UdpClient" }),
    helpers: helperOverrides,
    ...overrides,
  };
}

test("UdpClient.execute resolves with sendUdpData result", async () => {
  const sendCalls = [];
  const node = new UdpClient();
  const helpers = {
    udpClient: {
      sendUdpData: async (...args) => {
        sendCalls.push(args);
        return {
          protocol: "udp",
          host: "localhost",
          port: 4000,
          message: "payload",
        };
      },
    },
  };

  const parameters = {
    host: "localhost",
    port: 4000,
    message: "payload",
    options: {
      waitForResponse: true,
      responseTimeout: 15,
      encoding: "utf8",
    },
  };

  const context = createExecuteContext(parameters, {}, helpers);
  const result = await node.execute.call(context);

  assert.equal(sendCalls.length, 1);
  assert.deepEqual(result[0][0].json, {
    protocol: "udp",
    host: "localhost",
    port: 4000,
    message: "payload",
  });
});

test("UdpClient.execute throws NodeOperationError when sendUdpData fails", async () => {
  const node = new UdpClient();

  const parameters = {
    host: "localhost",
    port: 4000,
    message: "payload",
    options: {
      waitForResponse: false,
    },
  };

  const context = createExecuteContext(
    parameters,
    {},
    {
      udpClient: {
        sendUdpData: async () => {
          throw new Error("boom");
        },
      },
    }
  );

  await assert.rejects(node.execute.call(context), NodeOperationError);
});
