// importing grpc related stuff
const grpc = require("grpc");
const path = require("path");
const protoLoader = require("@grpc/proto-loader");

// package definition
const packageDefinition = protoLoader.loadSync(
  path.resolve(__dirname, "protocol/square.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    default: true,
    oneofs: true,
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Get the package name
const squarePackage = protoDescriptor.square.v1;

// calculate the square of the number
const square = (call, callback) => {
  const number = call.request.number;
  const square_number = Math.pow(number, 2);
  response = { number: square_number };
  error = null;
  callback(error, response);
};

// Creating the Server
const server = new grpc.Server();
// Adding services to the server
server.addService(squarePackage.SquareService.service, {
  square: square,
});

// Binding the server
const HOST = "localhost";
const PORT = 90052;
server.bind(`${HOST}:${PORT}`, grpc.ServerCredentials.createInsecure());

// starting the grpc server
server.start();
console.log(`Server started on ${HOST}:${PORT}`);
