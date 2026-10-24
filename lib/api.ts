// Client-side API helpers for the Ahad Animates backend
// Always uses credentials: "include" so HttpOnly cookies are passed seamlessly

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  validationErrors?: Record<string, string>;
}

async function getApiErrorMessage(response: Response): Promise<string> {
  const body = await response.text();
  if (body) {
    try {
      const data = JSON.parse(body) as ApiError;
      if (data.message) return data.message;
    } catch {
      return body;
    }
  }
  return response.statusText || "Request failed";
}

export type ProjectStatus = "DRAFT" | "PUBLISHED";

export interface ProjectRecord {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  thumbnailUrl: string;
  projectUrl: string;
  videoUrl: string | null;
  featured: boolean;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectInput = Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">;

export type CmsSection = "tutorials" | "ads-videos" | "blogs";
export type CmsMediaType = "IMAGE" | "VIDEO";

export function getPublicCmsRoute(section: CmsSection, slug?: string): string {
  const route = section === "blogs" ? "blog" : section;
  return slug
    ? `/${route}/${encodeURIComponent(slug)}`
    : `/${route}`;
}

export interface CmsContentRecord {
  id: number;
  contentType: "TUTORIALS" | "ADS_VIDEOS" | "BLOGS";
  title: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  body: string | null;
  videoSource: string | null;
  category: string;
  tags: string[];
  author: string | null;
  publicationDate: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  mediaType: CmsMediaType | null;
  displayOrder: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type CmsContentInput = Omit<
  CmsContentRecord,
  "id" | "contentType" | "createdAt" | "updatedAt"
>;

export interface CmsMediaAsset {
  id: number;
  url: string;
  originalFilename: string;
  contentType: string;
  mediaType: CmsMediaType;
  sizeBytes: number;
  originalSizeBytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

function resolveMediaUrl(asset: CmsMediaAsset): CmsMediaAsset {
  return {
    ...asset,
    url: asset.url.startsWith("/")
      ? new URL(asset.url, API_BASE_URL).toString()
      : asset.url,
  };
}

export interface DailyWorkRecord {
  id: number;
  title: string;
  description: string;
  workDate: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type DailyWorkInput = Omit<
  DailyWorkRecord,
  "id" | "createdAt" | "updatedAt"
>;

export interface DailyWorkPage {
  items: DailyWorkRecord[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  categories: string[];
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  credentials: RequestCredentials = "include"
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    credentials,
  });

  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || (response.status === 401 ? "Invalid email or password" : "Authentication failed");
    throw new Error(errorMsg);
  }

  return data as LoginResponse;
}

export async function apiLogout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("The backend could not end the administrator session.");
  }
}

export async function apiGetMe(): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(response.status === 401 ? "Unauthorized" : "Session check failed");
  }

  return response.json();
}

export function apiGetPublicProjects(): Promise<ProjectRecord[]> {
  return apiRequest<ProjectRecord[]>("/api/public/projects", {}, "omit");
}

export function apiGetPublicProject(slug: string): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>(
    `/api/public/projects/${encodeURIComponent(slug)}`,
    {},
    "omit"
  );
}

export function apiGetPublicDailyWork(filters: {
  category?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
} = {}): Promise<DailyWorkPage> {
  const query = new URLSearchParams();
  if (filters.category) query.set("category", filters.category);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.page !== undefined) query.set("page", String(filters.page));
  if (filters.size !== undefined) query.set("size", String(filters.size));
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<DailyWorkPage>(`/api/public/daily-work${suffix}`, {}, "omit");
}

export function apiGetAdminProjects(filters: {
  category?: string;
  status?: ProjectStatus | "";
} = {}): Promise<ProjectRecord[]> {
  const query = new URLSearchParams();
  if (filters.category) query.set("category", filters.category);
  if (filters.status) query.set("status", filters.status);
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<ProjectRecord[]>(`/api/admin/projects${suffix}`);
}

export function apiGetAdminProject(id: number): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>(`/api/admin/projects/${id}`);
}

export function apiCreateProject(project: ProjectInput): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export function apiUpdateProject(id: number, project: ProjectInput): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>(`/api/admin/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
}

export function apiUpdateProjectStatus(id: number, status: ProjectStatus): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>(`/api/admin/projects/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function apiDeleteProject(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/projects/${id}`, { method: "DELETE" });
}

function cmsPath(section: CmsSection, admin: boolean): string {
  return `/api/${admin ? "admin" : "public"}/cms/${section}`;
}

export function apiGetCmsContent(section: CmsSection): Promise<CmsContentRecord[]> {
  return apiRequest<CmsContentRecord[]>(cmsPath(section, false), {}, "omit");
}

export function apiGetCmsItem(section: CmsSection, slug: string): Promise<CmsContentRecord> {
  return apiRequest<CmsContentRecord>(
    `${cmsPath(section, false)}/${encodeURIComponent(slug)}`,
    {},
    "omit"
  );
}

export function apiGetAdminCmsContent(
  section: CmsSection,
  status?: ProjectStatus | ""
): Promise<CmsContentRecord[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<CmsContentRecord[]>(`${cmsPath(section, true)}${suffix}`);
}

export function apiGetAdminCmsItem(
  section: CmsSection,
  id: number
): Promise<CmsContentRecord> {
  return apiRequest<CmsContentRecord>(`${cmsPath(section, true)}/${id}`);
}

export function apiCreateCmsItem(
  section: CmsSection,
  item: CmsContentInput
): Promise<CmsContentRecord> {
  return apiRequest<CmsContentRecord>(cmsPath(section, true), {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function apiUpdateCmsItem(
  section: CmsSection,
  id: number,
  item: CmsContentInput
): Promise<CmsContentRecord> {
  return apiRequest<CmsContentRecord>(`${cmsPath(section, true)}/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export function apiUpdateCmsStatus(
  section: CmsSection,
  id: number,
  status: ProjectStatus
): Promise<CmsContentRecord> {
  return apiRequest<CmsContentRecord>(`${cmsPath(section, true)}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function apiDeleteCmsItem(section: CmsSection, id: number): Promise<void> {
  return apiRequest<void>(`${cmsPath(section, true)}/${id}`, { method: "DELETE" });
}

export async function apiUploadCmsMedia(file: File): Promise<CmsMediaAsset> {
  const response = await fetch(`${API_BASE_URL}/api/admin/media`, {
    method: "POST",
    credentials: "include",
    body: (() => {
      const formData = new FormData();
      formData.append("file", file);
      return formData;
    })(),
  });
  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    throw new Error(`Upload failed with HTTP ${response.status}: ${message}`);
  }
  return resolveMediaUrl((await response.json()) as CmsMediaAsset);
}

export async function apiGetAdminMediaAssets(): Promise<CmsMediaAsset[]> {
  const assets = await apiRequest<CmsMediaAsset[]>("/api/admin/media");
  return assets.map(resolveMediaUrl);
}

export function apiDeleteCmsMedia(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/media/${id}`, { method: "DELETE" });
}

export async function apiGetAdminMediaFile(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/admin/media/${id}/file`, {
    method: "GET",
    headers: { Accept: "image/jpeg,image/png,image/webp,video/mp4,video/webm" },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Unable to preview media (HTTP ${response.status}).`);
  }
  return response.blob();
}

export function apiGetAdminDailyWork(filters: {
  category?: string;
  status?: ProjectStatus | "";
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
} = {}): Promise<DailyWorkPage> {
  const query = new URLSearchParams();
  if (filters.category) query.set("category", filters.category);
  if (filters.status) query.set("status", filters.status);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.page !== undefined) query.set("page", String(filters.page));
  if (filters.size !== undefined) query.set("size", String(filters.size));
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<DailyWorkPage>(`/api/admin/daily-work${suffix}`);
}

export function apiGetAdminDailyWorkEntry(id: number): Promise<DailyWorkRecord> {
  return apiRequest<DailyWorkRecord>(`/api/admin/daily-work/${id}`);
}

export function apiCreateDailyWork(entry: DailyWorkInput): Promise<DailyWorkRecord> {
  return apiRequest<DailyWorkRecord>("/api/admin/daily-work", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export function apiUpdateDailyWork(
  id: number,
  entry: DailyWorkInput
): Promise<DailyWorkRecord> {
  return apiRequest<DailyWorkRecord>(`/api/admin/daily-work/${id}`, {
    method: "PUT",
    body: JSON.stringify(entry),
  });
}

export function apiUpdateDailyWorkStatus(
  id: number,
  status: ProjectStatus
): Promise<DailyWorkRecord> {
  return apiRequest<DailyWorkRecord>(`/api/admin/daily-work/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function apiDeleteDailyWork(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/daily-work/${id}`, { method: "DELETE" });
}
