import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-2" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Users";

export async function createUser(user) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId: user.userId,
      email: user.email,
      publicKey: user.publicKey,
      challenge: user.challenge || null,
      refreshToken: user.refreshToken || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  try {
    const response = await dynamo.send(command);
    return response;
  } catch (error) {
    console.error("error creating user");
    return null;
  }
}

export async function getUser(email) {
  //this needs to use GetCommand with email as pk in dynamo
  const command = new QueryCommand({
    TableName: "Users",
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email,
    },
  });

  try {
    const { Items } = await dynamo.send(command);
    //using GetCommand should eliminate the need for .at(0)
    return Items.length ? Items.at(0) : null;
  } catch (error) {
    console.error("error getting user");
  }
}

export async function updateUser(userId, updates) {
  if (!userId || !updates || Object.keys(updates).length === 0) {
    return { success: false, error: "invalid input" };
  }

  const updateExpressions = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  for (const key in updates) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = updates[key];
    expressionAttributeNames[`#${key}`] = key;
  }

  const params = {
    TableName: "Users",
    Key: { userId },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: "ALL_NEW",
  };

  const command = new UpdateCommand(params);
  try {
    const result = await dynamo.send(command);
    return { success: true, updatedUser: result.Attributes };
  } catch (error) {
    console.error("error updating user");
    return { success: false, error };
  }
}
