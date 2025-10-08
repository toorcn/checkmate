import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { ComprehendClient } from "@aws-sdk/client-comprehend";
import { TranslateClient } from "@aws-sdk/client-translate";

/**
 * Centralized AWS clients with shared region from config
 */

// Use AWS_REGION from environment, fallback to APP_REGION or us-east-1
const region = process.env.AWS_REGION || process.env.APP_REGION || "us-east-1";

if (!process.env.AWS_REGION) process.env.AWS_REGION = region;
if (!process.env.AWS_DEFAULT_REGION) process.env.AWS_DEFAULT_REGION = region;

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

/**
 * Translate client for real-time translation
 */
export const translate = new TranslateClient({ region });

// Removed Cognito client; no longer used.
