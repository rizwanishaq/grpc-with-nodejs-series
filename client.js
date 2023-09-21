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
