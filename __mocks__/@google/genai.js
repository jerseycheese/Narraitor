// __mocks__/@google/genai.js

module.exports = {
  GoogleGenAI: jest.fn().mockImplementation((config) => {
    return {
      models: {
        generateContent: jest.fn()
      }
    };
  })
};
