import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
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

export default function ResumePage() {
  const [profile, setProfile] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setWarnings(detectHiddenContent(jobDescription));
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/resume/generate`, {
        resumeText: profile,
        jobDescription,
      });
      setGenerated(data.markdown || "");
    } catch {
      setError("Generation failed. Check that the backend is running and try again.");
    } finally {
      setLoading(false);
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
        {loading && (
          <div className="progress">
            <div className="progress__bar" />
          </div>
        )}

        <div className="resume-columns">
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
              disabled={loading || !jobDescription.trim()}
            >
              {loading ? "Generating…" : "Generate Resume"}
            </button>

            {error && <p className="resume-error">{error}</p>}
          </div>

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
