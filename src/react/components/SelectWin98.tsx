/**
 * Windows 98 style custom select/combobox component
 * Replaces native browser select with a fully styled dropdown
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "./SelectWin98.css";

export interface SelectWin98Props {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; style?: React.CSSProperties }>;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function SelectWin98({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: SelectWin98Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find current option
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && displayRef.current) {
      const rect = displayRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is outside both the container and the options list
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        listRef.current &&
        !listRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (isOpen && listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, selectedIndex]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const nextIndex = Math.min(selectedIndex + 1, options.length - 1);
          if (nextIndex !== selectedIndex) {
            onChange(options[nextIndex].value);
          }
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const prevIndex = Math.max(selectedIndex - 1, 0);
          if (prevIndex !== selectedIndex) {
            onChange(options[prevIndex].value);
          }
        }
      }
    },
    [disabled, isOpen, selectedIndex, options, onChange],
  );

  return (
    <div
      ref={containerRef}
      className={`select-win98 ${className} ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
      role="combobox"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <div ref={displayRef} className="select-win98-display inset-deep" onClick={handleToggle}>
        <span className="select-win98-value" style={selectedOption?.style}>
          {selectedOption?.label || ""}
        </span>
        <div className="select-win98-arrow">
          <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15 0H16V16H15V15H1V16H0V0H1V1H15V0ZM1 1V14H15V1H1Z"
              fill="black"
            />
            <path fillRule="evenodd" clipRule="evenodd" d="M2 2H14V14H2V2Z" fill="#c0c0c0" />
            <path fillRule="evenodd" clipRule="evenodd" d="M8 11L4 7H12L8 11Z" fill="black" />
          </svg>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <ul
            ref={listRef}
            className="select-win98-options"
            role="listbox"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              minWidth: dropdownPosition.width,
            }}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                className={`select-win98-option ${option.value === value ? "selected" : ""}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                style={option.style}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}

export default SelectWin98;
