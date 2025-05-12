#!/usr/bin/env node

// Test script to verify that literal \n characters in CSV are converted to proper line breaks
// Tests Technical Requirements and Implementation Considerations formatting

import { formatTechnicalRequirements, formatImplementationConsiderations } from '../../scripts/utils/issue-body-formats.js';

function testLiteralNewlineConversion() {
  console.log('Testing literal \\n character conversion...\n');
  
  // Test case 1: Technical Requirements with literal \n
  const techReqInput = "The system must display inventory items\\nEach item must show name and quantity\\nThe display must be responsive";
  const expectedTechReq = `- The system must display inventory items
- Each item must show name and quantity
- The display must be responsive`;
  
  const actualTechReq = formatTechnicalRequirements(techReqInput);
  
  console.log('Test 1: Technical Requirements');
  console.log('Input:', JSON.stringify(techReqInput));
  console.log('Expected output:');
  console.log(expectedTechReq);
  console.log('\nActual output:');
  console.log(actualTechReq);
  console.log('Test 1:', actualTechReq === expectedTechReq ? 'PASS' : 'FAIL');
  
  // Test case 2: Implementation Considerations with literal \n
  const implConsInput = "Consider the data structure\\nThink about performance\\nEnsure compatibility with existing system";
  const expectedImplCons = `- Consider the data structure
- Think about performance
- Ensure compatibility with existing system`;
  
  const actualImplCons = formatImplementationConsiderations(implConsInput);
  
  console.log('\nTest 2: Implementation Considerations');
  console.log('Input:', JSON.stringify(implConsInput));
  console.log('Expected output:');
  console.log(expectedImplCons);
  console.log('\nActual output:');
  console.log(actualImplCons);
  console.log('Test 2:', actualImplCons === expectedImplCons ? 'PASS' : 'FAIL');
  
  // Test case 3: Mixed with headers (colon at end)
  const mixedInput = "System requirements:\\n- Display all items\\n- Sort by category\\nPerformance considerations:\\n- Load efficiently\\n- Cache results";
  const expectedMixed = `- System requirements:
  - Display all items
  - Sort by category
- Performance considerations:
  - Load efficiently
  - Cache results`;
  
  const actualMixed = formatTechnicalRequirements(mixedInput);
  
  console.log('\nTest 3: Mixed with headers');
  console.log('Input:', JSON.stringify(mixedInput));
  console.log('Expected output:');
  console.log(expectedMixed);
  console.log('\nActual output:');
  console.log(actualMixed);
  console.log('Test 3:', actualMixed === expectedMixed ? 'PASS' : 'FAIL');
  
  // Test case 4: Already formatted (no literal \n)
  const preformattedInput = `The system must display items
Each item shows details
The UI is responsive`;
  const expectedPreformatted = `- The system must display items
- Each item shows details
- The UI is responsive`;
  
  const actualPreformatted = formatTechnicalRequirements(preformattedInput);
  
  console.log('\nTest 4: Already formatted (no literal \\n)');
  console.log('Input:', JSON.stringify(preformattedInput));
  console.log('Expected output:');
  console.log(expectedPreformatted);
  console.log('\nActual output:');
  console.log(actualPreformatted);
  console.log('Test 4:', actualPreformatted === expectedPreformatted ? 'PASS' : 'FAIL');
  
  // Summary
  console.log('\n=== Summary ===');
  const allTests = [
    actualTechReq === expectedTechReq,
    actualImplCons === expectedImplCons,
    actualMixed === expectedMixed,
    actualPreformatted === expectedPreformatted
  ];
  
  const passed = allTests.filter(test => test).length;
  const total = allTests.length;
  
  console.log(`Tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✓ All tests passed! Literal \\n conversion is working correctly.');
  } else {
    console.log('✗ Some tests failed. Check the output above.');
  }
  
  return passed === total;
}

// Run the test
const success = testLiteralNewlineConversion();
process.exit(success ? 0 : 1);
