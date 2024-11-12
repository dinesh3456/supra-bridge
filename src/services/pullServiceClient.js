const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

class PullServiceClient {
  constructor(address = "testnet-dora-2.supra.com:443") {
    try {
      const PROTO_PATH = path.join(__dirname, "../protos/client.proto");
      console.log("Loading proto file from:", PROTO_PATH);

      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [__dirname],
      });

      const pullProto =
        grpc.loadPackageDefinition(packageDefinition).pull_service;

      // Create channel options
      const options = {
        "grpc.max_receive_message_length": 2147483647,
        "grpc.max_send_message_length": 2147483647,
        "grpc.max_metadata_size": 16777216,
        "grpc.keepalive_time_ms": 120000,
        "grpc.keepalive_timeout_ms": 20000,
        "grpc.keepalive_permit_without_calls": 1,
        "grpc.http2.min_time_between_pings_ms": 120000,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.enable_retries": 1,
        "grpc.service_config": JSON.stringify({
          methodConfig: [
            {
              name: [{ service: "PullService" }],
              retryPolicy: {
                maxAttempts: 5,
                initialBackoff: "1s",
                maxBackoff: "10s",
                backoffMultiplier: 2,
                retryableStatusCodes: ["UNAVAILABLE", "INTERNAL"],
              },
            },
          ],
        }),
      };

      // Create SSL credentials with proper verification
      const channelCreds = grpc.credentials.createSsl();

      console.log("Connecting to Supra Oracle at:", address);
      this.client = new pullProto.PullService(address, channelCreds, options);
    } catch (error) {
      console.error("Error initializing PullServiceClient:", error);
      throw error;
    }
  }

  getProof(request, callback) {
    try {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);

      const metadata = new grpc.Metadata();
      metadata.set("User-Agent", "grpc-node/1.24.x");

      console.log("Sending proof request:", JSON.stringify(request, null, 2));

      this.client.waitForReady(deadline, (error) => {
        if (error) {
          console.error("Failed to connect to Supra Oracle:", error);
          callback(error);
          return;
        }

        this.client.getProof(
          request,
          metadata,
          { deadline },
          (error, response) => {
            if (error) {
              console.error("Error in getProof:", error);
              callback(error);
              return;
            }

            console.log("Received response:", {
              hasResponse: !!response,
              hasEvm: response && !!response.evm,
              proofBytesLength: response?.evm?.proof_bytes?.length,
            });

            callback(null, response);
          }
        );
      });
    } catch (error) {
      console.error("Unexpected error in getProof:", error);
      callback(error);
    }
  }
}

module.exports = PullServiceClient;
