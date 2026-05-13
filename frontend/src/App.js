import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ResumePage from "./pages/ResumePage";
import KanbanPage from "./pages/KanbanPage";
import "./styles/ResumeForm.css";

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/resume" replace />} />
                <Route path="/resume" element={<ResumePage />} />
                <Route path="/kanban" element={<KanbanPage />} />
                <Route path="*" element={<Navigate to="/resume" replace />} />
            </Routes>
        </>
    );
}

export default App;