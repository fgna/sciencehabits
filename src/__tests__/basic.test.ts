// Basic test to verify Jest setup
export {};

describe('Basic Jest Setup', () => {
  test('should run basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should have access to DOM', () => {
    const div = document.createElement('div');
    expect(div).toBeDefined();
    expect(div.tagName).toBe('DIV');
  });

  test('should have localStorage mock', () => {
    expect(localStorage).toBeDefined();
    expect(localStorage.setItem).toBeDefined();
  });
});