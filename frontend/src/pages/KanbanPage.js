import React, { useEffect, useMemo, useState } from "react";
import { getColumns, getApplications, moveApplication, updateApplication, aiSummarizeBoard, aiTagApplication, aiNextSteps } from "../api/kanban";
import "../styles/Kanban.css";

export default function KanbanPage() {
  const BOARD_ID = 1;
  const [columns, setColumns] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({}); // { [id]: { title, company, description } }
  const [selected, setSelected] = useState(null); // card for modal
  const [ai, setAi] = useState({ loading: false, summary: "", tags: [], steps: [] });

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

  const openDetails = (card) => {
    setSelected(card);
    setAi({ loading: false, summary: "", tags: [], steps: [] });
  };
  const closeDetails = () => {
    setSelected(null);
    setAi({ loading: false, summary: "", tags: [], steps: [] });
  };

  const runSummarize = async () => {
    try {
      setAi((s) => ({ ...s, loading: true, summary: "" }));
      const { summary } = await aiSummarizeBoard(BOARD_ID);
      setAi((s) => ({ ...s, loading: false, summary }));
    } catch (e) {
      setAi((s) => ({ ...s, loading: false }));
      setError("AI summarize failed");
    }
  };
  const runTag = async () => {
    if (!selected) return;
    try {
      setAi((s) => ({ ...s, loading: true }));
      const { tags } = await aiTagApplication(selected.id, 5);
      setAi((s) => ({ ...s, loading: false, tags }));
      // also update the card with tags
      const updated = await updateApplication(selected.id, { ...selected, tags });
      setApps((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      setSelected(updated);
    } catch (e) {
      setAi((s) => ({ ...s, loading: false }));
      setError("AI tag failed");
    }
  };
  const runNextSteps = async () => {
    if (!selected) return;
    try {
      setAi((s) => ({ ...s, loading: true }));
      const { steps } = await aiNextSteps(selected.id);
      setAi((s) => ({ ...s, loading: false, steps }));
    } catch (e) {
      setAi((s) => ({ ...s, loading: false }));
      setError("AI next steps failed");
    }
  };

  const saveSelected = async () => {
    if (!selected) return;
    try {
      const payload = {
        title: selected.title || "",
        company: selected.company || "",
        description: selected.description || "",
        status: selected.status || "",
        tags: selected.tags || [],
        column_id: selected.column_id,
      };
      const updated = await updateApplication(selected.id, payload);
      setApps((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      setSelected(updated);
    } catch (e) {
      setError("Failed to save details");
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
                      <button className="btn" onClick={() => openDetails(card)}>Details</button>
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

      {selected && (
        <div className="modal__backdrop" onClick={closeDetails}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Application #{selected.id}</h3>
              <button className="btn" onClick={closeDetails}>Close</button>
            </div>
            <div className="modal__body">
              <div className="kanban__input-group">
                <label>Title</label>
                <input className="kanban__input" value={selected.title || ""} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
              </div>
              <div className="kanban__input-group">
                <label>Company</label>
                <input className="kanban__input" value={selected.company || ""} onChange={(e) => setSelected({ ...selected, company: e.target.value })} />
              </div>
              <div className="kanban__input-group">
                <label>Description</label>
                <textarea className="kanban__textarea" rows={5} value={selected.description || ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
              </div>
              <div className="kanban__input-group">
                <label>Column</label>
                <select className="kanban__input" value={selected.column_id || ""} onChange={(e) => setSelected({ ...selected, column_id: Number(e.target.value) })}>
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="kanban__input-group">
                <label>Tags</label>
                <div className="kanban__tags">
                  {(selected.tags || []).map((t, i) => (<span key={i} className="kanban__tag">{t}</span>))}
                </div>
              </div>
              <div className="kanban__card-actions">
                <button className="btn" onClick={() => saveSelected()}>Save</button>
                <button className="btn" onClick={runTag} disabled={ai.loading}>AI: Tags</button>
                <button className="btn" onClick={runNextSteps} disabled={ai.loading}>AI: Next Steps</button>
                <button className="btn" onClick={runSummarize} disabled={ai.loading}>AI: Summarize Board</button>
              </div>
              {ai.loading && <div className="kanban__loading">AI working...</div>}
              {ai.tags.length > 0 && (
                <div>
                  <h4>Suggested Tags</h4>
                  <div className="kanban__tags">
                    {ai.tags.map((t, i) => (<span key={i} className="kanban__tag">{t}</span>))}
                  </div>
                </div>
              )}
              {ai.steps.length > 0 && (
                <div>
                  <h4>Next Steps</h4>
                  <ol>
                    {ai.steps.map((s, i) => (<li key={i}>{s}</li>))}
                  </ol>
                </div>
              )}
              {ai.summary && (
                <div>
                  <h4>Board Summary</h4>
                  <p>{ai.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

