// eslint-config-next 16 ships flat configs directly, so no FlatCompat wrapper is needed
import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...coreWebVitals,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
