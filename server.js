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
