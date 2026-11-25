const { webcrypto } = require("node:crypto");

// Mock oficial de AsyncStorage para evitar dependencias nativas en Jest
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock ligero para iconos Lucide (evita carga asíncrona de fuentes en tests)
jest.mock("@react-native-vector-icons/lucide", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Lucide: ({ name, ...props }) =>
      React.createElement(Text, { ...props, accessible: false }, name),
  };
});

// Mock determinístico de expo-crypto sobre Node WebCrypto para authLocal
jest.mock("expo-crypto", () => {
  const { webcrypto: nodeCrypto } = require("node:crypto");
  return {
    CryptoDigestAlgorithm: { SHA256: "SHA-256" },
    randomUUID: () => nodeCrypto.randomUUID(),
    digestStringAsync: async (_alg, input) => {
      const digest = await nodeCrypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(input)
      );
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    },
  };
});

// Garantiza WebCrypto (PBKDF2 / SHA-256 / randomUUID) en Jest
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
