const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing API manually...\n');

  // Test 1: Health check
  try {
    console.log('1. Health Check:');
    const health = await axios.get(`${baseURL}/`);
    console.log('✅ Status:', health.status, 'Data:', health.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Sin parámetros (debe fallar)
  try {
    console.log('\n2. No parameters (should fail):');
    const noParams = await axios.get(`${baseURL}/api/working-days`);
    console.log('✅ Status:', noParams.status, 'Data:', noParams.data);
  } catch (error) {
    console.log('✅ Expected error:', error.response?.status, error.response?.data);
  }

  // Test 3: Con hours
  try {
    console.log('\n3. With hours parameter:');
    const withHours = await axios.get(`${baseURL}/api/working-days?hours=1`);
    console.log('✅ Status:', withHours.status, 'Data:', withHours.data);
  } catch (error) {
    console.log('❌ With hours failed:', error.response?.status, error.response?.data);
  }

  // Test 4: Caso específico
  try {
    console.log('\n4. Specific case (Friday 5PM + 1 hour):');
    const specificCase = await axios.get(`${baseURL}/api/working-days?hours=1&date=2025-01-03T22:00:00.000Z`);
    console.log('✅ Status:', specificCase.status, 'Data:', specificCase.data);
  } catch (error) {
    console.log('❌ Specific case failed:', error.response?.status, error.response?.data);
  }

  console.log('\n🏁 Manual testing completed');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;