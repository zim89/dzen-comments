export type CommentResponse = {
  id: string;
  userName: string;
  email: string;
  homePage: string | null;
  text: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  replies: CommentResponse[];
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedCommentsResponse = {
  data: CommentResponse[];
  meta: PaginatedMeta;
};

export type PreviewCommentResponse = {
  html: string;
};
