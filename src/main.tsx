import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { bootCourses } from "./store/boot";
import "./styles/index.css";
import "highlight.js/styles/github-dark.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

void bootCourses();

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
