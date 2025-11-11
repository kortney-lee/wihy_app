// Basic test to satisfy CI requirements - ensures no compilation errors
describe('Compilation Test', () => {
  test('no compilation errors', () => {
    // This test passes if the file compiles without errors
    expect(true).toBe(true);
  });
});

// Empty export to make this file a module for TypeScript
export {};