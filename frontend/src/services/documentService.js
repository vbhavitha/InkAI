const API_BASE_URL = "http://127.0.0.1:8000";

/*
 * =========================================================
 * CREATE DOCUMENT
 * =========================================================
 */

export async function createDocument(documentData) {
  const response = await fetch(
    `${API_BASE_URL}/api/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to create document.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


/*
 * =========================================================
 * GET DOCUMENT
 * =========================================================
 */

export async function getDocument(documentId) {
  if (!documentId) {
    throw new Error("Document ID is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`
  );

  if (!response.ok) {
    let errorMessage = "Failed to fetch document.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


/*
 * =========================================================
 * UPDATE DOCUMENT
 * =========================================================
 */

export async function updateDocument(
  documentId,
  documentData
) {
  if (!documentId) {
    throw new Error("Document ID is required.");
  }

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
    let errorMessage = "Failed to update document.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


/*
 * =========================================================
 * DELETE DOCUMENT
 * =========================================================
 */

export async function deleteDocument(documentId) {
  if (!documentId) {
    throw new Error("Document ID is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to delete document.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}