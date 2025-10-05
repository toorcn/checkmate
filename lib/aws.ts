import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { ComprehendClient } from "@aws-sdk/client-comprehend";

/**
 * Centralized AWS clients with shared region from config
 */

if (process.env.APP_REGION) {
  if (!process.env.AWS_REGION) process.env.AWS_REGION = process.env.APP_REGION;
  if (!process.env.AWS_DEFAULT_REGION)
    process.env.AWS_DEFAULT_REGION = process.env.APP_REGION;
}
const region = process.env.APP_REGION;

/**
 * DynamoDB Document client (marshalling on by default)
 */
const ddb = new DynamoDBClient({ region });
/**
 * DynamoDB Document client (marshalling on by default)
 */
export const ddbDoc = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * S3 client
 */
export const s3 = new S3Client({ region });

/**
 * Transcribe client
 */
export const transcribe = new TranscribeClient({ region });

/**
 * Comprehend client for sentiment analysis and NLP
 */
export const comprehend = new ComprehendClient({ region });

// Removed Cognito client; no longer used.
