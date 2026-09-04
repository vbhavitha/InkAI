const API_BASE_URL = "http://127.0.0.1:8000";

export async function saveDocument(documentData) {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    throw new Error("Failed to save document");
  }

  return response.json();
}

export async function updateDocument(documentId, documentData) {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update document");
  }

  return response.json();
}

export async function getDocument(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  return response.json();
}