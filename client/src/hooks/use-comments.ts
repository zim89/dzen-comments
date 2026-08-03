import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchCaptcha, fetchComments } from '@/api/comments';

function socketUrl(): string {
  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase) {
    return apiBase.replace(/\/$/, '');
  }
  return window.location.origin;
}

export const COMMENTS_QUERY_KEY = ['comments'] as const;

const WS_EVENT_COMMENT_CREATED = 'comment:created';
const WS_EVENT_COMMENT_REPLY = 'comment:reply';

export function invalidateComments(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEY });
}

export function useCommentsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(socketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    const invalidate = () => {
      void invalidateComments(queryClient);
    };

    socket.on(WS_EVENT_COMMENT_CREATED, () => {
      invalidate();
    });

    socket.on(WS_EVENT_COMMENT_REPLY, () => {
      invalidate();
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}

export function useCommentsQuery(params: {
  page: number;
  limit: number;
  sortField: string;
  sortOrder: string;
}) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, params],
    queryFn: () =>
      fetchComments({
        page: params.page,
        limit: params.limit,
        sortField: params.sortField as 'userName' | 'email' | 'createdAt',
        sortOrder: params.sortOrder as 'asc' | 'desc',
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCaptchaQuery(enabled = true) {
  return useQuery({
    queryKey: ['captcha'],
    queryFn: fetchCaptcha,
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}
