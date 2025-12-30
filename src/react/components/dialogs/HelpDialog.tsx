import React, { useState, useEffect, useRef } from 'react';
import Dialog from './Dialog';
import './HelpDialog.css';

interface HelpTopic {
  name: string;
  local?: string;
  children?: HelpTopic[];
}

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState('help/default.html');
  const [history, setHistory] = useState<string[]>(['help/default.html']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Load help topics from mspaint.hhc
  useEffect(() => {
    if (isOpen) {
      loadHelpContents();
    }
  }, [isOpen]);

  const loadHelpContents = async () => {
    try {
      const response = await fetch('help/mspaint.hhc');
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const parsedTopics = parseHelpContents(doc);
      setTopics(parsedTopics);
    } catch (error) {
      console.error('Failed to load help contents:', error);
    }
  };

  const parseHelpContents = (doc: Document): HelpTopic[] => {
    const parseListItem = (li: Element): HelpTopic | null => {
      const objectElem = li.querySelector(':scope > object');
      if (!objectElem) return null;

      const params = Array.from(objectElem.querySelectorAll('param'));
      const topic: HelpTopic = {
        name: '',
      };

      params.forEach((param) => {
        const name = param.getAttribute('name');
        const value = param.getAttribute('value');
        if (name === 'Name' && value) {
          topic.name = value;
        } else if (name === 'Local' && value) {
          topic.local = value;
        }
      });

      // Check if this item has children
      const childUl = li.querySelector(':scope > ul');
      if (childUl) {
        const childLis = Array.from(childUl.querySelectorAll(':scope > li'));
        topic.children = childLis
          .map((childLi) => parseListItem(childLi))
          .filter((t): t is HelpTopic => t !== null);
      }

      return topic.name ? topic : null;
    };

    const rootUl = doc.querySelector('body > ul');
    if (!rootUl) return [];

    const topLevelLis = Array.from(rootUl.querySelectorAll(':scope > li'));
    return topLevelLis
      .map((li) => parseListItem(li))
      .filter((t): t is HelpTopic => t !== null);
  };

  const navigateToPage = (url: string, addToHistory = true) => {
    setCurrentPage(url);
    if (addToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(url);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPage(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPage(history[newIndex]);
    }
  };

  const toggleFolder = (topicName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(topicName)) {
      newExpanded.delete(topicName);
    } else {
      newExpanded.add(topicName);
    }
    setExpandedFolders(newExpanded);
  };

  const handleTopicClick = (topic: HelpTopic) => {
    if (topic.children) {
      toggleFolder(topic.name);
    }
    if (topic.local) {
      navigateToPage(`help/${topic.local}`);
      setSelectedTopic(topic.name);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(100, Math.min(500, resizeStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const renderTopic = (topic: HelpTopic, level = 0): React.ReactNode => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isExpanded = expandedFolders.has(topic.name);
    const isSelected = selectedTopic === topic.name;

    return (
      <li key={topic.name} className={hasChildren ? 'folder' : 'page'}>
        <div
          className={`topic-item ${isSelected ? 'selected' : ''}`}
          onClick={() => handleTopicClick(topic)}
          style={{ paddingLeft: `${level * 16 + 4}px` }}
        >
          {hasChildren && (
            <span className={`folder-icon ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {topic.name}
        </div>
        {hasChildren && isExpanded && (
          <ul className="topic-children">
            {topic.children!.map((child) => renderTopic(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const dialogContent = (
    <div className="help-dialog-container">
      <div className="help-toolbar">
        <button
          className="help-toolbar-button"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title={sidebarVisible ? 'Hide' : 'Show'}
        >
          <div className="toolbar-icon" style={{ backgroundPosition: sidebarVisible ? '0px 0px' : '-275px 0px' }} />
          <span>{sidebarVisible ? 'Hide' : 'Show'}</span>
        </button>
        <button
          className="help-toolbar-button"
          onClick={goBack}
          disabled={historyIndex <= 0}
          title="Back"
        >
          <div className="toolbar-icon" style={{ backgroundPosition: '-55px 0px' }} />
          <span>Back</span>
        </button>
        <button
          className="help-toolbar-button"
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          title="Forward"
        >
          <div className="toolbar-icon" style={{ backgroundPosition: '-110px 0px' }} />
          <span>Forward</span>
        </button>
        <button className="help-toolbar-button" disabled title="Options">
          <div className="toolbar-icon" style={{ backgroundPosition: '-165px 0px' }} />
          <span>Options</span>
        </button>
        <button
          className="help-toolbar-button"
          onClick={() => navigateToPage('help/online_support.htm')}
          title="Web Help"
        >
          <div className="toolbar-icon" style={{ backgroundPosition: '-220px 0px' }} />
          <span>Web Help</span>
        </button>
      </div>

      <div className="help-main">
        {sidebarVisible && (
          <>
            <div className="help-sidebar" style={{ width: `${sidebarWidth}px` }}>
              <ul className="help-contents">
                <li className="page">
                  <div
                    className={`topic-item ${selectedTopic === '' ? 'selected' : ''}`}
                    onClick={() => {
                      navigateToPage('help/default.html');
                      setSelectedTopic('');
                    }}
                  >
                    Welcome to Help
                  </div>
                </li>
                {topics.map((topic) => renderTopic(topic))}
              </ul>
            </div>
            <div
              className="help-resizer"
              onMouseDown={handleResizeStart}
            />
          </>
        )}
        <div className="help-iframe-container">
          <iframe
            ref={iframeRef}
            src={currentPage}
            className="help-iframe"
            title="Help Content"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Paint Help"
      width={800}
      height={600}
      className="help-dialog"
      resizable={true}
    >
      {dialogContent}
    </Dialog>
  );
};

export default HelpDialog;
