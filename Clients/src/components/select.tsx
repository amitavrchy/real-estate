"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

export function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: Option[];
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", at: 0 });
  const [value, setValue] = useState(options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [active, setActive] = useState(0);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnFocusOut = (event: FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOnFocusOut);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOnFocusOut);
    };
  }, [open]);

  useEffect(() => {
    const option = document.getElementById(`${id}-option-${active}`);
    const list = menu.current;
    if (!open || !option || !list) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (
      option.offsetTop + option.offsetHeight >
      list.scrollTop + list.clientHeight
    )
      list.scrollTop =
        option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [active, id, open]);

  function showMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setAbove(
        below < Math.min(options.length * 42 + 14, 270) && rect.top > below,
      );
    }
    setOpen(true);
  }

  function choose(index: number) {
    setValue(options[index].value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : !open
              ? selected
              : (active +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  options.length) %
                options.length;
      setActive(next);
      showMenu();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else {
        setActive(selected);
        showMenu();
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      const text =
        (now - search.current.at < 700 ? search.current.text : "") +
        event.key.toLowerCase();
      search.current = { text, at: now };
      const next = options.findIndex((option) =>
        option.label.toLowerCase().startsWith(text),
      );
      if (next >= 0) {
        event.preventDefault();
        setActive(next);
        showMenu();
      }
    }
  }

  return (
    <div
      ref={root}
      className={`select-control ${open ? "is-open" : ""} ${above ? "opens-above" : ""}`}
    >
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        className="select-trigger"
        onClick={() => {
          setActive(selected);
          if (open) setOpen(false);
          else showMenu();
        }}
        onKeyDown={onKeyDown}
      >
        <span>{options[selected]?.label}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menu}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="select-options"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`select-option ${index === active ? "is-active" : ""}`}
              onPointerMove={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={16} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
