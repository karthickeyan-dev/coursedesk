import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import { App } from "./App";
import { bootCourses } from "./store/boot";
import "./styles/styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

void bootCourses();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
