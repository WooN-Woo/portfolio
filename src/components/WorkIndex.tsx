"use client";

import { useState } from "react";
import { useGorunur } from "@/components/Reveal";
import { gecikme } from "@/lib/anim";
import { varlik } from "@/lib/varlik";
import type { Project } from "@/content/site";

export function WorkIndex({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="work-list">
      {projects.map((project, sira) => (
        <ProjeSatiri
          key={project.slug}
          project={project}
          sira={sira}
          acik={open === project.slug}
          onAcKapa={() => setOpen(open === project.slug ? null : project.slug)}
        />
      ))}
    </ul>
  );
}

function ProjeSatiri({
  project,
  sira,
  acik,
  onAcKapa,
}: {
  project: Project;
  sira: number;
  acik: boolean;
  onAcKapa: () => void;
}) {
  const { ref, gorunur } = useGorunur<HTMLLIElement>();
  const panelId = `is-${project.slug}`;
  const headId = `bas-${project.slug}`;

  return (
    <li
      ref={ref}
      className="work-item reveal"
      data-shown={gorunur}
      style={gecikme(sira * 90)}
    >
      <button
        type="button"
        id={headId}
        className="work-head"
        aria-expanded={acik}
        aria-controls={panelId}
        onClick={onAcKapa}
      >
        <span className="work-year">{project.year}</span>
        <span className="work-heading">
          <span className="work-title">{project.title}</span>
          <span className="work-summary">{project.summary}</span>
        </span>
        <span className="work-sign" aria-hidden="true">
          +
        </span>
      </button>

      <div
        className="work-panel"
        data-open={acik}
        id={panelId}
        role="region"
        aria-labelledby={headId}
        inert={!acik}
      >
        <div className="work-panel-inner">
          {project.images?.length ? (
            <div className="work-gorseller">
              {project.images.map((gorsel) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={gorsel}
                  className="work-gorsel"
                  src={varlik(gorsel)}
                  alt={`${project.title} ekran görüntüsü`}
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}

          <div className="work-detail">
            <div className="work-text">
              {project.detail.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            <div className="work-meta">
              <div className="work-meta-row">
                <span className="label">Rol</span>
                <span className="work-meta-value">{project.role}</span>
              </div>

              <div className="work-meta-row">
                <span className="label">Kullanılan</span>
                <div className="work-tags">
                  {project.stack.map((item) => (
                    <span key={item} className="work-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {project.status ? (
                <div className="work-meta-row">
                  <span className="label">Durum</span>
                  <span className="work-status">{project.status}</span>
                </div>
              ) : null}

              {project.links?.length ? (
                <div className="work-meta-row">
                  <span className="label">Bağlantı</span>
                  <div>
                    {project.links.map((link) => (
                      <a
                        key={link.href}
                        className="work-link"
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
