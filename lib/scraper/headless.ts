import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const topicArn = process.env.HEADLESS_SNS_TOPIC_ARN;
const region = process.env.AWS_REGION || 'us-east-1';

const snsClient = topicArn ? new SNSClient({ region }) : null;

interface HeadlessPayload {
  projectId: string;
  sourceId: string;
  url: string;
  reason: string;
}

export async function scheduleHeadlessSnapshot(payload: HeadlessPayload) {
  if (!snsClient || !topicArn) return;
  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(payload)
      })
    );
    console.log(`[headless] scheduled fallback for ${payload.url} (${payload.reason})`);
  } catch (error) {
    console.warn('[headless] failed to publish fallback request', error);
  }
}
