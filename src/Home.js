import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

const Home = () => {
  const [documentId, setDocumentId] = useState("");
  const navigate = useNavigate();

  const handleJoinDocument = (event) => {
    event.preventDefault();
    const trimmedId = documentId.trim();
    if (!trimmedId) return;
    navigate(`/document/${trimmedId}`);
  };

  const handleCreateDocument = () => {
    const newDocumentId = uuidV4();
    navigate(`/document/${newDocumentId}`);
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <h1>Collaborative Text Editor</h1>
        <p className="landing-subtitle">
          Join an existing document by entering its ID or start a new one in
          seconds.
        </p>
        <form onSubmit={handleJoinDocument} className="landing-form">
          <label htmlFor="document-id">Document ID</label>
          <div className="landing-input-row">
            <input
              id="document-id"
              type="text"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="Enter document ID"
              autoComplete="off"
            />
            <button type="submit" disabled={!documentId.trim()}>
              Join
            </button>
          </div>
        </form>
        <div className="landing-divider">
          <span>or</span>
        </div>
        <button className="landing-create-btn" onClick={handleCreateDocument}>
          Create a new document
        </button>
      </div>
    </div>
  );
};

export default Home;
