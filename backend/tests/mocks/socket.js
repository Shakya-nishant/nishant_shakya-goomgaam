const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockIo = { to: mockTo, emit: mockEmit };
module.exports = { mockIo, mockEmit, mockTo };