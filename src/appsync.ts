const appsyncUrl = import.meta.env.VITE_APPSYNC_URL;

if (!appsyncUrl) {
  throw new Error(
    "Missing VITE_APPSYNC_URL environment variable. Check your .env.local file."
  );
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function appsyncRequest<T>(
  idToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("GraphQL query cannot be empty.");
  }

  const res = await fetch(appsyncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: idToken,
    },
    body: JSON.stringify({ query: normalizedQuery, variables }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `AppSync request failed (${res.status} ${res.statusText}): ${
        errorBody || "no response body"
      }`
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }

  if (!json.data) {
    throw new Error("GraphQL response did not include data.");
  }

  return json.data;
}
