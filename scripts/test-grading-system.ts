import { calculateGrade, GRADE_BANDS, getAllGradeBands } from "../src/lib/grading";

console.log("🧪 Testing Simple Grading System (A, B, C, S, F)\n");
console.log("=" .repeat(60));
console.log("📊 GRADE BANDS:");
console.log("=" .repeat(60));

const bands = getAllGradeBands();
bands.forEach(band => {
  console.log(`${band.grade} → ${band.minPercent}-${band.maxPercent}% → ${band.description}`);
});

console.log("\n" + "=" .repeat(60));
console.log("🧮 GRADE CALCULATION TESTS:");
console.log("=" .repeat(60) + "\n");

const testCases = [
  { percentage: 100, expected: "A" },
  { percentage: 95, expected: "A" },
  { percentage: 85, expected: "A" },
  { percentage: 75, expected: "A" },
  { percentage: 74.99, expected: "B" },
  { percentage: 70, expected: "B" },
  { percentage: 65, expected: "B" },
  { percentage: 64.99, expected: "C" },
  { percentage: 60, expected: "C" },
  { percentage: 55, expected: "C" },
  { percentage: 50, expected: "C" },
  { percentage: 49.99, expected: "S" },
  { percentage: 45, expected: "S" },
  { percentage: 40, expected: "S" },
  { percentage: 35, expected: "S" },
  { percentage: 34.99, expected: "F" },
  { percentage: 30, expected: "F" },
  { percentage: 20, expected: "F" },
  { percentage: 10, expected: "F" },
  { percentage: 0, expected: "F" },
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const result = calculateGrade(test.percentage);
  const status = result === test.expected ? "✅" : "❌";
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(
    `${status} ${test.percentage.toString().padEnd(6)}% → Grade ${result} ${
      result !== test.expected ? `(Expected: ${test.expected})` : ""
    }`
  );
});

console.log("\n" + "=" .repeat(60));
console.log("📋 TEST RESULTS:");
console.log("=" .repeat(60));
console.log(`✅ Passed: ${passed}/${testCases.length}`);
console.log(`❌ Failed: ${failed}/${testCases.length}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log("\n🎉 All tests passed! Grading system is working correctly!");
  console.log("\n📊 Simple Grading System Active:");
  console.log("   A → 75-100% (Excellent)");
  console.log("   B → 65-74%  (Very Good)");
  console.log("   C → 50-64%  (Credit)");
  console.log("   S → 35-49%  (Simple Pass)");
  console.log("   F → 0-34%   (Fail)");
} else {
  console.log("\n❌ Some tests failed! Please check the grading logic.");
}

console.log("\n✅ Grading system ready for use!");
