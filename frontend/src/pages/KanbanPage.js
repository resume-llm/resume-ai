import React, { useEffect, useMemo, useState } from "react";
import { getColumns, getApplications } from "../api/kanban";
import "../styles/Kanban.css";

export default function KanbanPage() {
  const BOARD_ID = 1;
  const [columns, setColumns] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                  <button className="btn btn--ghost" title="Summarize">AI: Summarize</button>
                  <button className="btn btn--ghost" title="Tag">AI: Tags</button>
                  <button className="btn btn--ghost" title="Next Steps">AI: Next</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
