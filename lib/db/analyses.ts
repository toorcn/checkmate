import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "../aws";
import { config } from "../config";

export interface Analysis {
  id: string;
  creatorId: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  title?: string;
  transcription?: string;
  result?: any;
}

const table = config.DDB_TABLE_ANALYSES;

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  if (!table) throw new Error("DDB_TABLE_ANALYSES not configured");
  const { Item } = await ddbDoc.send(
    new GetCommand({ TableName: table, Key: { id } })
  );
  return (Item as Analysis) || null;
}

export async function putAnalysis(analysis: Analysis): Promise<void> {
  if (!table) throw new Error("DDB_TABLE_ANALYSES not configured");
  await ddbDoc.send(
    new PutCommand({ TableName: table, Item: analysis })
  );
}

export async function listAnalysesByCreator(
  creatorId: string,
  limit = 20
): Promise<Analysis[]> {
  if (!table) throw new Error("DDB_TABLE_ANALYSES not configured");
  // Requires a GSI on creatorId + createdAt (or a PK on creatorId)
  const indexName = "creatorId-createdAt-index";
  const { Items } = await ddbDoc.send(
    new QueryCommand({
      TableName: table,
      IndexName: indexName,
      KeyConditionExpression: "creatorId = :c",
      ExpressionAttributeValues: { ":c": creatorId },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (Items as Analysis[]) || [];
}

