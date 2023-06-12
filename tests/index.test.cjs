const request = require("supertest");
const { randomUUID } = require("crypto");
const appModule = require("../src/index.cjs");

let { app } = appModule;

afterEach(() => {
  appModule.clearMessages();
  appModule.clearTimeoutIfNeeded();
  jest.useRealTimers();
});

describe("GET /", () => {
  it("should return a 200 status code and a hello message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("hello");
  });
});

describe("GET /waiting", () => {
  it("should return a 200 status code and a waiting message if timeoutHandle exists", async () => {
    appModule.enqueueMessage({ message: "Test message" });
    const response = await request(app).get("/waiting");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Waiting...");
  });

  it("should return a 404 status code and a not waiting message if timeoutHandle does not exist", async () => {
    const response = await request(app).get("/waiting");
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Nothing in queue");
  });
});

describe("GET /messages", () => {
  it("should return a 200 status code and an array of messages", async () => {
    const response = await request(app).get("/messages");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("GET /messages/:id", () => {
  it("should return a 200 status code and the message with the given id if it exists", async () => {
    const message = appModule.enqueueMessage({ message: "Test message" });

    const response = await request(app).get(`/messages/${message.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(message);
  });

  it("should return a 404 status code and an error message if the message with the given id does not exist", async () => {
    const id = randomUUID();

    const response = await request(app).get(`/messages/${id}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Cannot find message");
    expect(response.body.details).toBe(`Using message id ${id}`);
  });
});

describe("POST /message", () => {
  it("should return a 201 status code and the created message if the request body is valid", async () => {
    const message = { message: "Test message" };

    const response = await request(app).post("/message").send(message);
    expect(response.status).toBe(201);
    expect(response.body.message).toBe(message.message);
    expect(response.body.id).toBeTruthy();
    expect(response.body.replyId).toBeUndefined();
  });

  it("should return a 201 status code for replies if the request body is valid", async () => {
    const firstMessage = appModule.enqueueMessage({ message: "Test message" });
    const reply = { message: "Test reply message" };

    const response = await request(app).post("/message").send(reply);
    expect(response.status).toBe(201);
    expect(response.body.message).toBe(reply.message);
    expect(response.body.id).toBeTruthy();
    expect(response.body).toEqual(
      expect.objectContaining({ replyId: firstMessage.id })
    );
  });

  it("should return a 400 status code and an error message if the request body is missing the message", async () => {
    const response = await request(app).post("/message").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("you must supply a message");
  });
});

describe("auto answering messages", () => {
  it("auto answers messages if the timer advances by a specified amount", async () => {
    jest.useFakeTimers();
    const originalMessage = appModule.enqueueMessage({
      message: "this does not matter",
    });
    jest.runAllTimers();
    const updatedOriginalMessage = await request(app)
      .get(`/messages/${originalMessage.id}`)
      .send();
    const autoReplyMessage = await request(app)
      .get(`/messages/${updatedOriginalMessage.body.replyId}`)
      .send();
    expect(updatedOriginalMessage.status).toBe(200);
    expect(autoReplyMessage.status).toBe(200);
  });
});
