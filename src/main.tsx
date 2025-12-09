import { Buffer } from "buffer";

const globalAny = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
};

if (!globalAny.Buffer) {
  globalAny.Buffer = Buffer;
}

if (!globalAny.global) {
  globalAny.global = globalThis;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
