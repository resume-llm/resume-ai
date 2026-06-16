import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getBoards, getColumns, createApplication, createResume } from "../api/kanban";
import "../styles/Resume.css";
import "../styles/Kanban.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const ZERO_WIDTH = /[​‌‍⁠﻿­]/;

function detectHiddenContent(text) {
  const warnings = [];
  if (ZERO_WIDTH.test(text))
    warnings.push("Job description contains hidden zero-width characters — possible ATS trap.");
  if (/[ \t]{15,}/.test(text))
    warnings.push("Job description contains unusual whitespace sequences that may hide text.");
  return warnings;
}

function inferTitle(jd) {
  const first = jd.split("\n").find((l) => l.trim());
  if (!first) return "New Application";
  return first.trim().slice(0, 80);
}

export default function ResumePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);

  // Save-to-Kanban state
  const [appTitle, setAppTitle] = useState("");
  const [appCompany, setAppCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setGenerated("");
    setWarnings(detectHiddenContent(jobDescription));
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/resume/generate`, {
        resumeText: profile,
        jobDescription,
      });
      const md = data.markdown || "";
      setGenerated(md);
      setAppTitle(inferTitle(jobDescription));
    } catch {
      setError("Generation failed. Check that the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToKanban = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const boards = await getBoards();
      if (!boards.length) throw new Error("No boards found");
      const boardId = boards[0].id;
      const cols = await getColumns(boardId);
      const defaultColId = cols[0]?.id ?? null;

      const app = await createApplication(boardId, {
        title: appTitle || inferTitle(jobDescription),
        company: appCompany,
        description: jobDescription,
        status: "Applied",
        tags: [],
        column_id: defaultColId,
      });

      await createResume({
        applicationId: app.id,
        jobDescription,
        inputProfile: profile,
        markdown: generated,
      });

      navigate("/kanban");
    } catch (e) {
      setSaveError("Could not save to Kanban. Check that the API is running.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="resume-page-header">
        <h2 className="resume-page-title">Resume Generator</h2>
        <span className="resume-page-sub">
          Paste your profile and a job description to generate a tailored resume
        </span>
      </div>

      <div className="resume-layout">
        {(loading || saving) && (
          <div className="progress">
            <div className="progress__bar" />
          </div>
        )}

        <div className="resume-columns">
          {/* ── Left: inputs ── */}
          <div className="resume-form-pane">
            <div className="resume-field">
              <label className="resume-label">Your profile</label>
              <textarea
                className="resume-textarea"
                rows={9}
                placeholder="Paste your current resume or a summary of your experience…"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
              />
            </div>

            <div className="resume-field">
              <label className="resume-label">Job description</label>
              <textarea
                className="resume-textarea"
                rows={9}
                placeholder="Paste the job description here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <button
              className="btn resume-generate-btn"
              onClick={generate}
              disabled={loading || saving || !jobDescription.trim()}
            >
              {loading ? "Generating…" : "Generate Resume"}
            </button>

            {error && <p className="resume-error">{error}</p>}

            {/* ── Save to Kanban ── */}
            {generated && (
              <div className="resume-save-card">
                <p className="resume-save-label">Save to Kanban to edit and export</p>
                <div className="resume-save-row">
                  <input
                    className="resume-save-input"
                    placeholder="Role / title"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                  />
                  <input
                    className="resume-save-input"
                    placeholder="Company (optional)"
                    value={appCompany}
                    onChange={(e) => setAppCompany(e.target.value)}
                  />
                </div>
                <button
                  className="btn resume-generate-btn"
                  onClick={saveToKanban}
                  disabled={saving || loading}
                >
                  {saving ? "Saving…" : "Save to Kanban →"}
                </button>
                {saveError && <p className="resume-error">{saveError}</p>}
              </div>
            )}
          </div>

          {/* ── Right: preview ── */}
          <div className="resume-preview-pane">
            <span className="resume-label">Preview</span>
            <div className="resume-preview-box">
              {generated ? (
                <div className="resume__preview-body markdown-body">
                  <ReactMarkdown>{generated}</ReactMarkdown>
                </div>
              ) : (
                <span className="resume-preview-empty">
                  Your generated resume will appear here.
                </span>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="kanban__ats-warnings">
                <strong>⚠ ATS warnings</strong>
                <ul>
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
