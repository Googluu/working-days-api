#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WorkingDaysLambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

new WorkingDaysLambdaStack(app, 'WorkingDaysApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  description: 'Working Days API - AWS Lambda with API Gateway',
  tags: {
    Project: 'WorkingDaysAPI',
    Environment: 'production',
    ManagedBy: 'CDK'
  }
});