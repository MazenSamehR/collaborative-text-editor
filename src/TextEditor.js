import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useBeforeUnload, useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 10000;
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
  const { id: documentId } = useParams();

  const saveToDB = () => {
    if (socket == null || quill == null) return;
    console.log("Document saved to DB");
    socket.emit("save-document", quill.getContents(),);
  };

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("recive-changes", handler);

    return () => {
      socket.off("recive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // useEffect(() => {
  //   if (socket == null || quill == null) return;

  //   const interval = setInterval(() => {
  //     socket.emit("save-document", quill.getContents());
  //   }, SAVE_INTERVAL_MS);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.on("", () => {
      saveToDB();
    });
  }, []);


  useBeforeUnload(() => {
    saveToDB();
  });

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

  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
