---
title: "Mastering Bidirectional Streaming RPC with Node.js and gRPC"
description: "Explore the intricacies of Bidirectional Streaming RPC in gRPC, a high-performance, open-source Remote Procedure Call (RPC) framework. Learn how to efficiently connect services, enable load balancing, tracing, and authentication using HTTP/2 and Protocol Buffers."
image: "../../public/blogs/1_6ufkIOzURh0WBg_q9jrSgQ.webp"
publishedAt: "2023-05-12"
updatedAt: "2023-05-12"
author: "Rizwan Ishaq"
isPublished: true
tags:
  - NodeJs
  - gRPC
  - streaming
---

Welcome to the world of gRPC, a cutting-edge Remote Procedure Call (RPC) framework. In this blog post, we're going to delve deep into the intricacies of Unary RPC, a mode within gRPC that empowers seamless communication between services. This mode allows the client to send a single request to the server, which then processes it and responds with a single message. Let's embark on this journey to understand how it all comes together.

## Unraveling gRPC: A Swift Overview

Before we dive into Bidirectional Streaming RPC, let's take a moment to appreciate what gRPC is all about. It's not just an RPC framework; it's a high-performance marvel that bridges services across diverse environments. Load balancing, tracing, health checks, and authentication are just some of the powerful features it offers. What makes it tick? It leverages HTTP/2 for transport and Protocol Buffers (protobuf) for structured data. This dynamic duo ensures that devices and backend services communicate seamlessly in distributed computing environments.

## Understanding the Modes of gRPC

To truly appreciate Bidirectional Streaming RPC, it's essential to grasp the different communication modes gRPC offers. These modes cater to various scenarios, each with its unique strengths:

1. **Unary RPC**: In this mode, the client sends a single request to the server, which processes it and returns a single response after completing the operation.

2. **Server Streaming RPC**: The client sends a single request, and the server responds with a stream of messages.

3. **Client Streaming RPC**: The client sends a stream of messages, and the server responds with a single message.

4. **Bidirectional Streaming RPC**: Both the client and server send a stream of messages, enabling bidirectional communication.

## Protocol Buffers: A Serialization Method

Protocol Buffers, often referred to as protobuf, is a serialization method that transforms structured data into a format ideal for transmitting over networks or storing on disk. If you're keen on mastering this concept, I highly recommend checking out this [Protocol Buffers crash course video](https://www.youtube.com/watch?v=46O73On0gyI&t=1716s).

```protobuf
// protocol/square.proto
syntax = "proto3";

package square.v1;

message squareRequest {
    double number = 1;
    string uid = 2;
}

message squareResponse {
    double number=1;
    string uid=2;
}



// Services for the system
service SquareService {
    rpc squareStream(stream squareRequest) returns (stream squareResponse) {}
}
```

Here's a quick breakdown:

- `syntax = "proto3";`: Specifies that we're using proto3 syntax.
- `package square.v1;`: Defines the package name as square.v1.
- `message squareRequest and message squareResponse`: These define the request and response structures for our square service.
- `service SquareService`: This defines our service, which contains a streaming RPC method named squareStream.

## Setting up the Project

Getting started with gRPC in Node.js is a breeze. Here's a step-by-step guide:

- Begin by initializing the project and installing the necessary dependencies:

```console
npm init -y
npm install grpc/grpc-js @grpc/proto-loader
```

With these steps, your project is primed and ready for action!

## Server Implementation: Bringing Bidirectional Streaming RPC to Life

Now, let's dive into the server implementation. In server.js, we'll be crafting the logic that handles client requests.

```javascript
// Importing required libraries
const grpc = require("@grpc/grpc-js");
const path = require("path");
const protoLoader = require("@grpc/proto-loader");

// Load the protocol definition
const packageDefinition = protoLoader.loadSync(
  path.resolve(__dirname, "protocol/square.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

// Parse the loaded definition
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Get the package name
const squarePackage = protoDescriptor.square.v1;

/**
 * Handles a streaming operation.
 * @param {object} stream - The streaming object.
 */
const squareStream = (stream) => {
  // Handle incoming data from the client
  let uid;
  stream.on("data", (data) => {
    uid = data.uid;
    console.log(`Received data from Stream ${uid}:`, data.number);
    const square_number = Math.pow(data.number, 2);
    const response = { number: square_number, uid };
    stream.write(response); // Send a response back to the client
  });

  // Handle stream end event
  stream.on("end", () => {
    console.log(`Stream ${uid} ended`);
    stream.end(); // End the stream
  });

  // Handle stream errors
  stream.on("error", (error) => {
    console.error(`Error in Stream ${uid}:`, error);
  });
};

// Create the gRPC server
const server = new grpc.Server();

// Add services to the server
server.addService(squarePackage.SquareService.service, {
  squareStream: squareStream, // Server streaming RPC method
});

// Set server binding information
const HOST = "0.0.0.0"; // Listen on all available network interfaces
const PORT = 50051;

// Bind the server
server.bindAsync(
  `${HOST}:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error) => {
    // Start the server
    if (error) {
      console.error("Error binding server:", error);
      return;
    }
    server.start();
    console.log(`Server started on ${HOST}:${PORT}`);
  }
);
```

Here's a quick rundown:

- We load the protocol buffer definition to make sure the server understands the message formats.
- The `squareStream` function is where the magic happens. It takes in a gRPC stream object, processes the request, and prepares the response.
- The server is created and started, making it ready to receive requests.

Running the server is a breeze:

```console
node server.js
```

Once started, you'll see a reassuring message:

```console
Server started on 0.0.0.0:50051
```

## Client Implementation: Initiating the Unary RPC Call

Next up, let's shift our focus to the client side. In client.js, we'll craft the logic that sends a request to the server and processes the response.

```javascript
const grpc = require("@grpc/grpc-js");
const path = require("path");
const protoLoader = require("@grpc/proto-loader");
const { v4: uuidv4 } = require("uuid");

// Load the protocol definition
const packageDefinition = protoLoader.loadSync(
  path.resolve(__dirname, "protocol/square.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

// Parse the loaded definition
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Get the package name
const squarePackage = protoDescriptor.square.v1;

// Connect the client to the server
const HOST = "localhost";
const PORT = 50051;
const client = new squarePackage.SquareService(
  `${HOST}:${PORT}`,
  grpc.credentials.createInsecure()
);

/**
 * Handle streaming responses from the server.
 * @param {object} data - The response data from the server.
 * @param {string} uid - Unique ID of the stream.
 */
const handleStreamingResponse = async (data, uid) => {
  console.log(`Receiving data (Stream ${uid}):`, data.number);
};

const runStreaming = () => {
  // Generate a unique ID for the stream
  const uid = uuidv4();

  // Create a writable stream for streaming
  const stream = client.squareStream();

  // Handle incoming data from the server
  stream.on("data", (data) => {
    handleStreamingResponse(data, uid);
  });

  // Define an array of numbers to send
  const numbersToSend = [1, 2, 3, 4, 5];

  // Send multiple data points in the streaming request
  numbersToSend.forEach((number) => {
    const streamingRequest = { number, uid };
    stream.write(streamingRequest);
    console.log(`Sending data (Stream ${uid}): data: ${number}`);
  });

  // End the streaming request
  stream.end();

  // Exit once finished
  stream.on("end", () => {
    console.log(`Stream (Stream ${uid}) ended. Exiting...`);
    process.exit();
  });
};

// Start streaming
runStreaming();
```

Here's what's happening:

- We create a gRPC client to connect to the server.
- A request object is prepared, specifying the numbers for which we want to calculate the square.
- The `runStreaming ` function initiates the bidirectional stream RPC call to the server, passing the request object.

Executing the client is as simple as:

```console
node client.js
```

Upon execution, you'll receive the eagerly awaited response:

```console
Sending data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): data: 1
Sending data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): data: 2
Sending data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): data: 3
Sending data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): data: 4
Sending data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): data: 5
Receiving data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): 1
Receiving data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): 4
Receiving data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): 9
Receiving data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): 16
Receiving data (Stream 8a08bed3-a7c2-4e80-9f75-92d23715b7dc): 25
```

And there you have it! We've taken a deep dive into the world of bidirectional stream RPC with gRPC in Node.js. This powerful mode enables efficient communication between services, making it a cornerstone in modern distributed systems.
