export type Attachment = {
  id: string;
  type: 'IMAGE' | 'TEXT';
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
};

export type Comment = {
  id: string;
  userName: string;
  email: string;
  homePage: string | null;
  text: string;
  parentId: string | null;
  attachment: Attachment | null;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedComments = {
  data: Comment[];
  meta: PaginatedMeta;
};

export type CommentSortField = 'userName' | 'email' | 'createdAt';
export type CommentSortOrder = 'asc' | 'desc';

export type CommentsQuery = {
  page?: number;
  limit?: number;
  sortField?: CommentSortField;
  sortOrder?: CommentSortOrder;
};

export type CaptchaResponse = {
  id: string;
  image: string;
};

export type PreviewResponse = {
  html: string;
};

export type LoginResponse = {
  accessToken: string;
};

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};
