import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**"]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off" 
    }
  }
];
