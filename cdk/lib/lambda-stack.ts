import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class WorkingDaysLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CloudWatch Log Group (para evitar warning de logRetention deprecated)
    const logGroup = new logs.LogGroup(this, 'WorkingDaysLambdaLogGroup', {
      logGroupName: '/aws/lambda/working-days-api',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // IAM Role for Lambda execution
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    const workingDaysLambda = new NodejsFunction(this, 'WorkingDaysFunction', {
      functionName: 'working-days-api',
      description: 'API para cálculo de fechas hábiles en Colombia - esbuild',
      runtime: lambda.Runtime.NODEJS_18_X,
      
      // Apunta al archivo del handler
      entry: path.join(__dirname, '../lambda/handler.ts'),
      handler: 'handler',
      
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        NODE_ENV: 'production',
        TZ: 'America/Bogota',
        HOLIDAYS_URL: 'https://content.capta.co/Recruitment/WorkingDays.json'
      },
      logGroup: logGroup,
      
      // Configuración de bundling con esbuild
      bundling: {
        minify: false, // Para debugging
        sourceMap: true,
        target: 'es2020',
        keepNames: true,
        externalModules: [
          // Excluir módulos nativos de AWS Lambda si hay conflictos
          'aws-sdk'
        ],
        nodeModules: [
          // Incluir explícitamente las dependencias necesarias
          '@vendia/serverless-express',
          '@nestjs/swagger',
          '@nestjs/core',
          '@nestjs/common',
          '@nestjs/platform-express',
          'moment-timezone',
          'axios',
          'class-validator',
          'class-transformer',
          'reflect-metadata',
          '@nestjs/swagger'
        ],
        commandHooks: {
          beforeInstall: (inputDir: string, outputDir: string): string[] => {
            return [
              `echo "📦 Preparing install in ${outputDir}"`,
            ];
          },
          beforeBundling: (inputDir: string, outputDir: string): string[] => {
            return [
              `echo "🔍 Pre-bundling: ${inputDir} -> ${outputDir}"`,
            ];
          },
          afterBundling: (inputDir: string, outputDir: string): string[] => {
            return [
              `echo "✅ Post-bundling complete"`,
              `ls -la ${outputDir}`,
            ];
          },
        },
      }
    });

    // CloudWatch Logs permissions
    workingDaysLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream', 
        'logs:PutLogEvents'
      ],
      resources: [logGroup.logGroupArn + ':*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'WorkingDaysApi', {
      restApiName: 'Working Days API',
      description: 'API para cálculo de fechas hábiles en Colombia - AWS Lambda + CDK',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type', 
          'X-Amz-Date', 
          'Authorization', 
          'X-Api-Key', 
          'X-Amz-Security-Token',
          'X-Amz-User-Agent'
        ],
      },
      deployOptions: {
        stageName: 'prod',
        description: 'Production deployment',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200
      }
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(workingDaysLambda, {
      requestTemplates: { 
        'application/json': '{ "statusCode": "200" }' 
      },
      proxy: true,
      allowTestInvoke: true
    });

    // API Gateway routes
    const apiResource = api.root.addResource('api');
    const workingDaysResource = apiResource.addResource('working-days');
    
    // GET /api/working-days
    workingDaysResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: false,
      requestParameters: {
        'method.request.querystring.days': false,
        'method.request.querystring.hours': false,
        'method.request.querystring.date': false,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL
          }
        }
      ]
    });

    // Root endpoint for health check
    api.root.addMethod('GET', lambdaIntegration);

    // Swagger/OpenAPI documentation endpoint
    const docsResource = api.root.addResource('docs');
    docsResource.addMethod('GET', lambdaIntegration);

    // Usage Plan para rate limiting opcional
    const usagePlan = new apigateway.UsagePlan(this, 'WorkingDaysUsagePlan', {
      name: 'working-days-usage-plan',
      description: 'Usage plan for Working Days API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH
      }
    });

    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: '🌐 Working Days API Base URL',
      exportName: 'WorkingDaysApiEndpoint'
    });

    new cdk.CfnOutput(this, 'WorkingDaysEndpoint', {
      value: `${api.url}api/working-days`,
      description: '🔗 Working Days Calculation Endpoint', 
      exportName: 'WorkingDaysCalculationEndpoint'
    });

    new cdk.CfnOutput(this, 'SwaggerDocs', {
      value: `${api.url}docs`,
      description: '📚 Swagger Documentation URL',
      exportName: 'SwaggerDocsEndpoint'
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: workingDaysLambda.functionName,
      description: '⚡ Lambda Function Name',
      exportName: 'LambdaFunctionName'
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: workingDaysLambda.functionArn,
      description: '🔗 Lambda Function ARN',
      exportName: 'LambdaFunctionArn'
    });

    new cdk.CfnOutput(this, 'CloudWatchLogs', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroup.logGroupName)}`,
      description: '📊 CloudWatch Logs URL',
      exportName: 'CloudWatchLogsUrl'
    });
  }
}