"""
SQLAlchemy ORM models for the Kanban domain and Resume records.
PostgreSQL is the database backend. Migrations will be managed by Alembic later.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy import Column as SAColumn
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Board(Base):
    __tablename__ = "boards"

    id = SAColumn(Integer, primary_key=True, index=True)
    name = SAColumn(String(255), nullable=False)
    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    columns = relationship("Column", back_populates="board", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="board", cascade="all, delete-orphan")


class Column(Base):
    __tablename__ = "columns"

    id = SAColumn(Integer, primary_key=True, index=True)
    board_id = SAColumn(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    name = SAColumn(String(255), nullable=False)
    position = SAColumn(Integer, nullable=False, default=0)

    board = relationship("Board", back_populates="columns")
    applications = relationship("Application", back_populates="column", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = SAColumn(Integer, primary_key=True, index=True)
    board_id = SAColumn(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    column_id = SAColumn(Integer, ForeignKey("columns.id", ondelete="SET NULL"), nullable=True, index=True)

    title = SAColumn(String(255), nullable=False)
    company = SAColumn(String(255), nullable=True)
    description = SAColumn(Text, nullable=True)
    status = SAColumn(String(50), nullable=True)
    tags = SAColumn(ARRAY(String), nullable=True)

    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = SAColumn(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    board = relationship("Board", back_populates="applications")
    column = relationship("Column", back_populates="applications")
    resumes = relationship("Resume", back_populates="application", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = SAColumn(Integer, primary_key=True, index=True)
    application_id = SAColumn(Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)

    job_description = SAColumn(Text, nullable=True)
    input_profile = SAColumn(Text, nullable=True)
    markdown = SAColumn(Text, nullable=True)
    docx_path = SAColumn(String(1024), nullable=True)

    model = SAColumn(String(100), nullable=True)
    params = SAColumn(JSON, nullable=True)

    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="resumes")
