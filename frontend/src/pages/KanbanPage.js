import React, { useEffect, useMemo, useState } from "react";
import { getColumns, getApplications, moveApplication, updateApplication } from "../api/kanban";
import "../styles/Kanban.css";

export default function KanbanPage() {
  const BOARD_ID = 1;
  const [columns, setColumns] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({}); // { [id]: { title, company, description } }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [cols, applications] = await Promise.all([
          getColumns(BOARD_ID),
          getApplications(BOARD_ID),
        ]);
        if (!mounted) return;
        setColumns(cols);
        setApps(applications);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load Kanban data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const byCol = new Map();
    for (const c of columns) byCol.set(c.id, []);
    for (const a of apps) {
      if (!byCol.has(a.column_id)) byCol.set(a.column_id, []);
      byCol.get(a.column_id).push(a);
    }
    return byCol;
  }, [columns, apps]);

  const handleMove = async (cardId, newColumnId) => {
    try {
      // optimistic update
      setApps((prev) => prev.map((a) => (a.id === cardId ? { ...a, column_id: Number(newColumnId) } : a)));
      await moveApplication(cardId, Number(newColumnId));
    } catch (e) {
      setError("Failed to move card");
    }
  };

  const startEdit = (card) => {
    setEditing((prev) => ({
      ...prev,
      [card.id]: {
        title: card.title || "",
        company: card.company || "",
        description: card.description || "",
        status: card.status || "",
        tags: card.tags || [],
        column_id: card.column_id,
        board_id: card.board_id,
      },
    }));
  };

  const cancelEdit = (id) => {
    setEditing((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const saveEdit = async (id) => {
    const payload = editing[id];
    try {
      const updated = await updateApplication(id, payload);
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      cancelEdit(id);
    } catch (e) {
      setError("Failed to update card");
    }
  };

  if (loading) return <div className="kanban__loading">Loading board...</div>;
  if (error) return <div className="kanban__error">{error}</div>;

  return (
    <div className="kanban">
      {columns.map((col) => (
        <div className="kanban__column" key={col.id}>
          <div className="kanban__column-header">
            <h3>{col.name}</h3>
          </div>
          <div className="kanban__cards">
            {(grouped.get(col.id) || []).map((card) => (
              <div className="kanban__card" key={card.id}>
                {editing[card.id] ? (
                  <>
                    <input
                      className="kanban__input"
                      value={editing[card.id].title}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [card.id]: { ...prev[card.id], title: e.target.value } }))}
                      placeholder="Title"
                    />
                    <input
                      className="kanban__input"
                      value={editing[card.id].company}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [card.id]: { ...prev[card.id], company: e.target.value } }))}
                      placeholder="Company"
                    />
                    <textarea
                      className="kanban__textarea"
                      rows={3}
                      value={editing[card.id].description}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [card.id]: { ...prev[card.id], description: e.target.value } }))}
                      placeholder="Description"
                    />
                    <div className="kanban__card-actions">
                      <button className="btn" onClick={() => saveEdit(card.id)}>Save</button>
                      <button className="btn" onClick={() => cancelEdit(card.id)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="kanban__card-title">{card.title}</div>
                    <div className="kanban__card-sub">{card.company}</div>
                    {card.tags?.length ? (
                      <div className="kanban__tags">
                        {card.tags.map((t, i) => (
                          <span className="kanban__tag" key={i}>{t}</span>
                        ))}
                      </div>
                    ) : null}
                    {card.description ? (
                      <p className="kanban__desc">{card.description}</p>
                    ) : null}
                    <div className="kanban__card-actions">
                      <select
                        className="btn"
                        value={card.column_id || ""}
                        onChange={(e) => handleMove(card.id, e.target.value)}
                        title="Move to column"
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button className="btn" onClick={() => startEdit(card)}>Edit</button>
                      <button className="btn btn--ghost" title="Summarize">AI: Summarize</button>
                      <button className="btn btn--ghost" title="Tag">AI: Tags</button>
                      <button className="btn btn--ghost" title="Next Steps">AI: Next</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

