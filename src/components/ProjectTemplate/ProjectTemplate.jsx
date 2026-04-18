import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "../HeaderBar";
import FooterBar from "../FooterBar";
import "./ProjectTemplate.css";

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function invertColor({ r, g, b }) {
  return { r: 255 - r, g: 255 - g, b: 255 - b };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 100;
  const lightness = 50 + Math.random() * 10;
  return hslToRgb(hue, saturation, lightness);
}

function TemplateMediaItem({ item }) {
  if (!item) return null;

  if (item.type === "image") {
    return (
      <img
        className={`template-media ${item.className || ""}`}
        src={item.src}
        alt={item.alt || ""}
        style={item.style}
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        className={`template-media ${item.className || ""}`}
        src={item.src}
        autoPlay={item.autoPlay ?? true}
        loop={item.loop ?? true}
        muted={item.muted ?? true}
        playsInline
        controls={item.controls ?? false}
        style={item.style}
      />
    );
  }

  if (item.type === "custom") {
    return item.content || null;
  }

  return null;
}

function TemplateMediaRow({ items, gap = 8 }) {
  const rowRef = useRef(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [ratios, setRatios] = useState([]);

  useEffect(() => {
    if (!rowRef.current) return;

    const updateWidth = () => {
      setRowWidth(rowRef.current.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRatios = async () => {
      const loaded = await Promise.all(
        items.map(
          (item) =>
            new Promise((resolve) => {
              if (item.type === "image") {
                const img = new Image();
                img.onload = () =>
                  resolve(
                    img.naturalWidth && img.naturalHeight
                      ? img.naturalWidth / img.naturalHeight
                      : 1
                  );
                img.onerror = () => resolve(1);
                img.src = item.src;
                return;
              }

              if (item.type === "video") {
                const video = document.createElement("video");
                video.onloadedmetadata = () =>
                  resolve(
                    video.videoWidth && video.videoHeight
                      ? video.videoWidth / video.videoHeight
                      : 1
                  );
                video.onerror = () => resolve(1);
                video.src = item.src;
                return;
              }

              resolve(1);
            })
        )
      );

      if (!cancelled) {
        setRatios(loaded);
      }
    };

    loadRatios();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const totalGap = gap * Math.max(items.length - 1, 0);
  const availableWidth = Math.max(rowWidth - totalGap, 0);
  const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const rowHeight = totalRatio > 0 ? availableWidth / totalRatio : 0;

  return (
    <div
      className="template-media-row"
      ref={rowRef}
      style={{ gap: `${gap}px` }}
    >
      {items.map((item, index) => {
        const ratio = ratios[index] || 1;
        const itemWidth = rowHeight * ratio;

        return (
          <div
            key={index}
            className="template-media-row-item"
            style={{
              width: itemWidth ? `${itemWidth}px` : "auto",
            }}
          >
            <TemplateMediaItem item={item} />
          </div>
        );
      })}
    </div>
  );
}

function TemplateMediaStack({ items = [] }) {
  return (
    <div className="template-media-stack">
      {items.map((item, index) => {
        if (item.type === "row") {
          return (
            <TemplateMediaRow
              key={index}
              items={item.items || []}
              gap={item.gap ?? 8}
            />
          );
        }

        return (
          <div key={index} className="template-media-block">
            <TemplateMediaItem item={item} />
          </div>
        );
      })}
    </div>
  );
}

function TemplateSection({ section }) {
  return (
    <section className="template-section">
      {section.title && <h2 className="template-subtitle">{section.title}</h2>}

      {section.paragraphs?.map((paragraph, i) => (
        <p key={i} className="template-text">
          {paragraph}
        </p>
      ))}

      {section.media?.length > 0 && <TemplateMediaStack items={section.media} />}

      {section.custom && (
        <div className="template-custom-block">{section.custom}</div>
      )}
    </section>
  );
}

function TemplateButton({ button, onHoverColor, onHoverReset }) {
  if (button.kind === "file") {
    return (
      <label
        className={`template-button ${button.active ? "is-active" : ""}`}
        onMouseEnter={onHoverColor}
        onMouseLeave={onHoverReset}
        onPointerDown={onHoverColor}
      >
        {button.label}
        <input
          type="file"
          accept={button.accept}
          multiple={button.multiple}
          onChange={button.onChange}
          style={{ display: "none" }}
          {...(button.inputProps || {})}
        />
      </label>
    );
  }

  return (
    <button
      type="button"
      className={`template-button ${button.active ? "is-active" : ""} ${
        button.inactive ? "is-inactive" : ""
      }`}
      onClick={button.onClick}
      onMouseEnter={onHoverColor}
      onMouseLeave={onHoverReset}
      onPointerDown={onHoverColor}
    >
      {button.label}
    </button>
  );
}

function TemplateSelect({ control }) {
  return (
    <select
      className="template-select"
      value={control.value}
      onChange={control.onChange}
    >
      {control.options.map((option, index) => (
        <option key={option.value ?? index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TemplateControlsRow({ controls = [], onHoverColor, onHoverReset }) {
  if (!controls.length) return null;

  return (
    <div className="template-controls-row">
      {controls.map((control, index) => {
        if (control.kind === "select") {
          return <TemplateSelect key={index} control={control} />;
        }

        return (
          <TemplateButton
            key={index}
            button={control}
            onHoverColor={onHoverColor}
            onHoverReset={onHoverReset}
          />
        );
      })}
    </div>
  );
}

function TemplateSlider({ slider, activeSliderRef }) {
  function handleSliderFocus(e) {
    if (activeSliderRef.current && activeSliderRef.current !== e.target) {
      activeSliderRef.current.style.removeProperty("--thumb-color");
      activeSliderRef.current.style.removeProperty("--track-color");
    }

    const thumbColor = getRandomColor();
    const trackColor = invertColor(thumbColor);

    e.target.style.setProperty("--thumb-color", rgbToCss(thumbColor));
    e.target.style.setProperty("--track-color", rgbToCss(trackColor));

    activeSliderRef.current = e.target;
  }

  function handleSliderBlur(e) {
    if (activeSliderRef.current === e.target) {
      e.target.style.removeProperty("--thumb-color");
      e.target.style.removeProperty("--track-color");
      activeSliderRef.current = null;
    }
  }

  const displayValue = slider.formatValue
    ? slider.formatValue(slider.value)
    : slider.value;

  if (slider.type === "visibility-row") {
    return (
      <label className="template-slider-label">
        {slider.label}
        <div className="template-visibility-slider-row">
          <button
            type="button"
            className={`template-visibility-toggle ${
              slider.toggleActive ? "" : "inactive"
            }`}
            onClick={slider.onToggle}
            onMouseEnter={(e) => {
              const thumbColor = getRandomColor();
              e.currentTarget.style.setProperty("--thumb-color", rgbToCss(thumbColor));
              e.currentTarget.style.setProperty("--thumb-text-color", "black");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.removeProperty("--thumb-color");
              e.currentTarget.style.removeProperty("--thumb-text-color");
            }}
            onPointerDown={(e) => {
              const thumbColor = getRandomColor();
              e.currentTarget.style.setProperty("--thumb-color", rgbToCss(thumbColor));
              e.currentTarget.style.setProperty("--thumb-text-color", "black");
            }}
          >
            {slider.toggleLabel}
          </button>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={slider.value}
            onChange={slider.onChange}
            onPointerDown={handleSliderFocus}
            onPointerUp={handleSliderBlur}
            onTouchStart={handleSliderFocus}
            onTouchEnd={handleSliderBlur}
            onBlur={handleSliderBlur}
          />
        </div>
      </label>
    );
  }

  return (
    <label className="template-slider-label">
      {slider.label}
      {slider.showValue ? `: ${displayValue}` : ""}
      <input
        type="range"
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={slider.value}
        onChange={slider.onChange}
        onPointerDown={handleSliderFocus}
        onPointerUp={handleSliderBlur}
        onTouchStart={handleSliderFocus}
        onTouchEnd={handleSliderBlur}
        onBlur={handleSliderBlur}
      />
    </label>
  );
}

export default function ProjectTemplate({
  title,
  intro = [],
  sections = [],
  topControls = null,
  canvasBlock = null,
  bottomControls = null,
  buttons = [],
  sliders = [],
  afterSliders = null,
  progress = null,
  status = [],
  hiddenElements = null,
}) {
  const activeSliderRef = useRef(null);
  const [progressColor, setProgressColor] = useState(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (activeSliderRef.current) {
        activeSliderRef.current.style.removeProperty("--thumb-color");
        activeSliderRef.current.style.removeProperty("--track-color");
        activeSliderRef.current = null;
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, []);

  useEffect(() => {
    if (progress && !progressColor) {
      const c = getRandomColor();
      setProgressColor(rgbToCss(c));
    }
  }, [progress, progressColor]);

  useEffect(() => {
    if (progress?.percent === 0) {
      const c = getRandomColor();
      setProgressColor(rgbToCss(c));
    }
  }, [progress?.percent]);

  function handleButtonHover(e) {
    const thumbColor = getRandomColor();
    e.currentTarget.style.setProperty("--thumb-color", rgbToCss(thumbColor));
    e.currentTarget.style.setProperty("--thumb-text-color", "black");
  }

  function handleButtonLeave(e) {
    e.currentTarget.style.removeProperty("--thumb-color");
    e.currentTarget.style.removeProperty("--thumb-text-color");
  }

  return (
    <div className="template-wrapper">
      <HeaderBar />

      <main className="template-main">
        <article className="template-article">
          <section className="template-intro-section">
            <h1 className="template-title">{title}</h1>

            {intro.map((block, index) => {
              if (block.type === "paragraph") {
                return (
                  <p key={index} className={block.className || "template-text"}>
                    {block.content}
                  </p>
                );
              }

              if (block.type === "media") {
                return (
                  <TemplateMediaStack key={index} items={block.items || []} />
                );
              }

              if (block.type === "custom") {
                return (
                  <div key={index} className="template-custom-block">
                    {block.content}
                  </div>
                );
              }

              return null;
            })}
          </section>

          {sections.map((section, index) => (
            <TemplateSection key={index} section={section} />
          ))}

          {topControls && (
            <TemplateControlsRow
              controls={topControls}
              onHoverColor={handleButtonHover}
              onHoverReset={handleButtonLeave}
            />
          )}

          {canvasBlock && (
            <section className="template-canvas-section">
              {canvasBlock}
            </section>
          )}

          {bottomControls && (
            <TemplateControlsRow
              controls={bottomControls}
              onHoverColor={handleButtonHover}
              onHoverReset={handleButtonLeave}
            />
          )}

          {hiddenElements}

          {buttons.length > 0 && (
            <div className="template-upload-buttons">
              {buttons.map((button, index) => (
                <TemplateButton
                  key={index}
                  button={button}
                  onHoverColor={handleButtonHover}
                  onHoverReset={handleButtonLeave}
                />
              ))}
            </div>
          )}

          {progress && (
            <div className="template-progress-wrap">
              <div className="template-progress-block">
                <div className="template-progress-row">
                  <span className="template-progress-title">
                    {progress.label}
                  </span>
                  <span className="template-progress-label">
                    {progress.valueLabel}
                  </span>
                </div>
                <div className="template-progress-bar">
                  <div
                    className="template-progress-fill"
                    style={{
                      width: `${progress.percent}%`,
                      background:
                        progressColor || progress.color || "var(--thumb-color, #888)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {sliders.length > 0 && (
            <div className="template-slider-stack">
              {sliders.map((slider, index) => (
                <TemplateSlider
                  key={index}
                  slider={slider}
                  activeSliderRef={activeSliderRef}
                />
              ))}
            </div>
          )}

          {afterSliders}

          {status.length > 0 && (
            <div className="template-status-block">
              {status.map((row, index) => (
                <div key={index} className="template-status-row">
                  {row}
                </div>
              ))}
            </div>
          )}
        </article>
      </main>

      <FooterBar />
    </div>
  );
}