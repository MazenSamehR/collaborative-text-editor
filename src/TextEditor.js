import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useBeforeUnload, useParams } from "react-router-dom";

const SAVE_DEBOUNCE_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const TextEditor = () => {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [saveState, setSaveState] = useState("loading");
  const [lastSavedAt, setLastSavedAt] = useState();
  const [docName, setDocName] = useState("Untitled document");
  const { id: documentId } = useParams();
  const saveTimeoutRef = useRef();

  const flushSave = useCallback(
    (options = {}) => {
      const { immediate = false } = options;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = undefined;
      }
      if (socket == null || quill == null) return;

      const executeSave = () => {
        const contents = quill.getContents();
        socket.timeout(3000).emit("save-document", contents, (error) => {
          if (error) {
            setSaveState("error");
            console.error("Failed to save document", error);
            return;
          }
          setSaveState("saved");
          setLastSavedAt(Date.now());
        });
      };

      if (immediate) {
        setSaveState("saving");
        executeSave();
        return;
      }

      setSaveState("saving");
      saveTimeoutRef.current = setTimeout(executeSave, SAVE_DEBOUNCE_MS);
    },
    [socket, quill]
  );

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", ({ data, name }) => {
      if (data && typeof data === "object" && Array.isArray(data.ops)) {
        quill.setContents(data);
      } else if (typeof data === "string") {
        quill.setText(data);
      } else {
        quill.setText("");
      }
      setDocName(name || "Untitled document");
      quill.enable();
      setSaveState("saved");
      setLastSavedAt(Date.now());
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
      flushSave();
    };

    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket, quill, flushSave]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null) return;
    const handler = (newName) => {
      setDocName(newName);
    };
    socket.on("document-renamed", handler);
    return () => socket.off("document-renamed", handler);
  }, [socket]);

  const handleRename = (e) => {
    const newName = e.target.value;
    setDocName(newName);
    if (socket) socket.emit("rename-document", newName);
  };

  const statusText = useMemo(() => {
    switch (saveState) {
      case "loading":
        return "Loading";
      case "saving":
        return "Saving…";
      case "saved":
        if (!lastSavedAt) return "Saved";
        return `Saved at ${new Date(lastSavedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      case "error":
        return "Save failed";
      default:
        return "Ready";
    }
  }, [saveState, lastSavedAt]);

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.enable(false);
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return (
    <div className="editor-shell">
      <header className="editor-header">
        <div className="editor-header-title">
          <input
            type="text"
            value={docName}
            onChange={handleRename}
            className="editor-doc-title"
          />
          <span className="editor-doc-id">Document ID: {documentId}</span>
        </div>
        <div className={`editor-status-pill status-${saveState}`}>
          <span className="editor-status-dot" />
          <span>{statusText}</span>
        </div>
      </header>
      <div className="container" ref={wrapperRef}></div>
    </div>
  );
};

export default TextEditor;
