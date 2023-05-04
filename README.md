# SouthendTech chat app

Single-Threaded JavaScript chat server.

Every odd message which is not the first, queues an auto-reply.

If a response is received before the deadline, then an auto-reply is cancelled.

If a response is not received before the deadline, then an auto-reply is sent.

## Usage

### Setup

```
npm ci
```

### "Linting" / Style

```
npx --yes prettier -w .
```

### Running

```
node index.cjs
```
