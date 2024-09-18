"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
// Initialize DynamoDB client
const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({ region: 'ap-south-1' });
// DynamoDB Table Name
const tableName = process.env.TABLE_NAME;
module.exports.handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    const putRequests = [];
    // Process each Kinesis record
    for (const record of event.Records) {
        // Decode base64 Kinesis data
        const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
        const data = JSON.parse(payload);
        console.log('Data: ', data);
        // Prepare the PutRequest for DynamoDB
        putRequests.push({
            PutRequest: {
                Item: {
                    user_id: { S: data.user_id }, // Use { S: value } for strings
                    timestamp: { N: data.timestamp.toString() }, // Use { N: value } for numbers
                    first_name: { S: data.first_name },
                    last_name: { S: data.last_name },
                    note_id: { S: data.note_id },
                    email: { S: data.email },
                    website: { S: data.website },
                    expires: { N: data.expires.toString() },
                    description: { S: data.description },
                },
            },
        });
    }
    // Batch write to DynamoDB (25 items max per batch)
    const batches = [];
    while (putRequests.length > 0) {
        batches.push(putRequests.splice(0, 25)); // DynamoDB batch write max is 25 items
    }
    for (const batch of batches) {
        const params = {
            RequestItems: {
                [tableName]: batch,
            },
        };
        try {
            const command = new client_dynamodb_1.BatchWriteItemCommand(params);
            const response = yield dynamoDBClient.send(command);
            console.log('Batch write response:', response);
        }
        catch (error) {
            console.error('Error writing to DynamoDB:', error);
        }
    }
});
