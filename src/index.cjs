const express = require("express");
const { randomUUID } = require("crypto");

const app = express();

app.use(express.json({}));

const messages = [];
let timeoutHandle;

const clearTimeoutIfNeeded = () => {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
};

const clearMessages = () => {
  while (messages.length) {
    messages.pop();
  }
};

const enqueueMessage = (data) => {
  const id = randomUUID();

  const lastIndex = Math.max(messages.length - 1, 0);
  const msgCount = messages.length + 1;
  let replyId;

  if (msgCount % 2 === 0 && messages.length) {
    messages[lastIndex].replyId = id;
    replyId = messages[lastIndex].id;
    clearTimeoutIfNeeded();
  } else {
    timeoutHandle = setTimeout(autoReply, 60_000);
  }
  const message = { ...data, id, replyId };
  messages.push(message);

  return message;
};

const autoReply = () => {
  const id = randomUUID();

  const lastIndex = messages.length - 1;
  const { id: replyToId } = messages[lastIndex];
  if (messages.length % 2 !== 0) {
    messages.push({
      message: "Sorry, no replies as yet",
      id,
      replyId: replyToId,
    });
    messages[lastIndex].replyId = id;
    clearTimeoutIfNeeded();
  }
};

const areWeWaiting = () => {
  return { message: timeoutHandle ? "Waiting..." : "Nothing in queue" };
};

app.get("/", (req, res) => {
  return res.status(200).json({ message: "hello" });
});

app.get("/waiting", (req, res) => {
  return res.status(timeoutHandle ? 200 : 404).json(areWeWaiting());
});

app.get("/messages", (req, res) => {
  res.status(200).json(messages);
});

app.get("/messages/:id", (req, res) => {
  const { id: msgId } = req.params;
  const [message] = messages.filter((value) => value.id === msgId);
  if (!message) {
    return res.status(404).json({
      message: "Cannot find message",
      details: `Using message id ${msgId}`,
    });
  }
  return res.status(200).json(message);
});

app.post("/message", (req, res) => {
  if (!req.body.message) {
    return res.status(400).json({ message: "you must supply a message" });
  }
  const message = enqueueMessage(req.body);

  return res.status(201).json(message);
});

module.exports = {
  app,
  clearTimeoutIfNeeded,
  clearMessages,
  enqueueMessage,
};
