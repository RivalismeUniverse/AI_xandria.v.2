require('dotenv').config();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

async function testBedrock() {
  console.log('🧪 Testing Amazon Bedrock Connection...\n');

  try {
    const client = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION || 'us-east-1'
    });

    console.log('✅ Bedrock client initialized');
    console.log(`📍 Region: ${process.env.BEDROCK_REGION || 'us-east-1'}`);
    console.log(`🤖 Model: anthropic.claude-3-5-sonnet-20241022-v2:0\n`);

    // Test prompt
    const testPrompt = "You are SocraticAI, a philosophical AI. In 50 words, explain why questioning is important.";

    console.log('📤 Sending test prompt...');
    console.log(`Prompt: "${testPrompt}"\n`);

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 200,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: testPrompt
        }]
      })
    });

    const startTime = Date.now();
    const response = await client.send(command);
    const endTime = Date.now();

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const responseText = result.content[0].text;

    console.log('✅ Response received!\n');
    console.log('📝 AI Response:');
    console.log('─'.repeat(60));
    console.log(responseText);
    console.log('─'.repeat(60));
    console.log(`\n⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);
    console.log(`🔥 Stop reason: ${result.stop_reason}`);

    console.log('\n✅ Bedrock test successful!');
    console.log('🎉 AI_XANDRIA backend is ready to use Amazon Bedrock!\n');

  } catch (error) {
    console.error('❌ Bedrock test failed:\n');
    console.error(error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check AWS credentials are set correctly');
    console.log('2. Ensure Bedrock model access is enabled in AWS Console');
    console.log('3. Verify BEDROCK_REGION environment variable');
    console.log('4. Check IAM permissions for bedrock:InvokeModel\n');
    process.exit(1);
  }
}

testBedrock();
