
const API_URL = "https://api.intra.42.fr";

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedToken = "";
let expiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < expiresAt) {
    return cachedToken;
  }

  const clientId = process.env.INTRA42_CLIENT_ID;
  const clientSecret = process.env.INTRA42_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing 42 API credentials");
  }

  const response = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    throw new Error(`42 OAuth error: ${response.status}`);
  }

  const data = await response.json() as TokenResponse;

  cachedToken = data.access_token;
  expiresAt = Date.now() +
    Math.max(0, data.expires_in - 60) * 1000;

  return cachedToken;
}

async function intra42Get<T>(path: string): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`42 API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type Student42 = {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  displayname: string;
  image?: {
    link?: string;
  };
  campus?: Array<{
    id: number;
    name: string;
    country?: string;
  }>;
  cursus_users?: Array<{
    id: number;
    grade: string | null;
    level: number;
    begin_at: string | null;
    end_at: string | null;
    cursus_id: number;
    skills: Array<{
      id: number;
      name: string;
      level: number;
    }>;
    cursus?: {
      name: string;
      slug: string;
    };
  }>;
};

export type Project42 = {
  id: number;
  status: string;
  final_mark: number | null;
  "validated?": boolean | null;
  created_at: string;
  marked_at: string | null;
  cursus_ids: number[];
  project: {
    id: number;
    name: string;
    slug?: string;
  } | null;
};

export async function get42Student(login: string) {
  return intra42Get<Student42>(
    `/v2/users/${encodeURIComponent(login)}`
  );
}

export async function get42StudentProjects(userId: number) {
  const allProjects: Project42[] = [];
  const pageSize = 100;

  for (let page = 1; ; page++) {
    const params = new URLSearchParams({
      "page[size]": String(pageSize),
      "page[number]": String(page)
    });

    const projects = await intra42Get<Project42[]>(
      `/v2/users/${userId}/projects_users?${params}`
    );

    allProjects.push(...projects);

    if (projects.length < pageSize) {
      break;
    }
  }

  return allProjects;
}
