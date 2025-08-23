import React from "react";

export default function KanbanPage() {
  return (
    <div>
      <h1>Kanban (WIP)</h1>
      <p>
        The unified Kanban board will appear here. We will port the exact styles from the
        standalone app and wire CRUD + AI actions to the FastAPI backend.
      </p>
      <ul>
        <li>List columns and applications from <code>/kanban/boards/1</code></li>
        <li>Drag and drop between columns</li>
        <li>AI actions: summarize board, tag application, next steps</li>
      </ul>
    </div>
  );
}
