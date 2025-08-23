const fetch = require('node-fetch');

// Test the timetable API with different user roles
async function testTimetableAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // Test with student login
  console.log("Testing student login...");
  const studentLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier: 'student1',
      password: 'student123'
    })
  });
  
  if (studentLogin.ok) {
    const loginResult = await studentLogin.json();
    console.log("Student login successful:", loginResult.success);
    
    // Get the cookie from response
    const cookies = studentLogin.headers.get('set-cookie');
    console.log("Cookies:", cookies);
    
    // Test timetable API
    const timetableResponse = await fetch(`${baseUrl}/api/timetables/user`, {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    if (timetableResponse.ok) {
      const timetables = await timetableResponse.json();
      console.log("Timetables for student:", timetables.length);
    } else {
      console.log("Timetable API failed:", timetableResponse.status, await timetableResponse.text());
    }
  } else {
    console.log("Student login failed:", studentLogin.status);
  }
}

testTimetableAPI().catch(console.error);
