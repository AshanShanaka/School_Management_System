// Debug script to test Clerk user creation
const { clerkClient } = require("@clerk/nextjs/server");

async function testClerkUserCreation() {
  try {
    console.log('Testing Clerk user creation...');
    
    // Test with one of the failing emails
    const testUser = await clerkClient.users.createUser({
      emailAddress: ['nimalperera@gmail.com'],
      username: 'nimalperera',
      password: 'testpass123',
      firstName: 'Nimal',
      lastName: 'Perera',
      publicMetadata: { role: 'student' },
    });
    
    console.log('Success:', testUser.id);
  } catch (error) {
    console.error('Error details:', {
      type: typeof error,
      constructor: error?.constructor?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
      errors: error?.errors,
      full: error
    });
  }
}

testClerkUserCreation();
