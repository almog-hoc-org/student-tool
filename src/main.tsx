import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// כשה-service worker החדש משתלט באמצע סשן (אחרי דיפלוי), הדף הרץ הוא
// עדיין מהגרסה הישנה ומטמון ה-chunks הישן נמחק — רענון מיידי מיישר את
// הדף לגרסה החדשה לפני שטעינת עמוד עצל תישבר.
if ("serviceWorker" in navigator) {
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // ההשתלטות הראשונה (התקנה ראשונית) לא דורשת רענון
    if (hadController) window.location.reload();
    hadController = true;
  });
}

createRoot(document.getElementById("root")!).render(<App />);
