import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { catalogApi } from './catalogApi';
import type { MediaOwnerType, MediaView, PublicPicture } from '@/types/media';

export interface RequestUploadInput {
  ownerType: MediaOwnerType;
  ownerId: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
}
export interface RequestUploadResponse {
  mediaId: string;
  url: string;
  method: 'POST';
  fields: Record<string, string>;
  maxBytes: number;
  expiresInSeconds: number;
}

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery,
  tagTypes: ['Media'],
  endpoints: (builder) => ({
    requestUpload: builder.mutation<RequestUploadResponse, RequestUploadInput>({
      query: (body) => ({ url: '/media/upload-url', method: 'POST', body }),
    }),
    confirmUpload: builder.mutation<MediaView, string>({
      query: (id) => ({ url: `/media/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['Media'],
    }),
    getMediaById: builder.query<MediaView, string>({
      query: (id) => `/media/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Media', id }],
    }),
    getManagedMedia: builder.query<MediaView[], { ownerType: MediaOwnerType; ownerId: string }>({
      query: (params) => ({ url: '/media/manage', params }),
      providesTags: ['Media'],
    }),
    updateMediaAltText: builder.mutation<MediaView, { id: string; altTextEs?: string | null; altTextEn?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/media/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Media'],
    }),
    reorderMedia: builder.mutation<MediaView[], { ownerType: MediaOwnerType; ownerId: string; ids: string[] }>({
      query: (body) => ({ url: '/media/order', method: 'PUT', body }),
      invalidatesTags: ['Media'],
    }),
    // A new cover affects how the product looks in every catalog listing —
    // mediaApi and catalogApi are separate RTK Query slices (own
    // reducerPath), so that cache is poked explicitly rather than through a
    // shared tagTypes list.
    setCoverMedia: builder.mutation<void, { id: string; ownerType: MediaOwnerType; ownerId: string }>({
      query: ({ id, ...body }) => ({ url: `/media/${id}/cover`, method: 'POST', body }),
      invalidatesTags: ['Media'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(catalogApi.util.invalidateTags([{ type: 'Product', id: 'LIST' }]));
      },
    }),
    deleteMedia: builder.mutation<void, string>({
      query: (id) => ({ url: `/media/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Media'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(catalogApi.util.invalidateTags([{ type: 'Product', id: 'LIST' }]));
      },
    }),
    getPublicMedia: builder.query<PublicPicture[], { ownerType: 'product' | 'tenant'; ownerId: string }>({
      query: (params) => ({ url: '/media', params }),
      providesTags: ['Media'],
    }),
  }),
});

export const {
  useRequestUploadMutation,
  useConfirmUploadMutation,
  useGetMediaByIdQuery,
  useGetManagedMediaQuery,
  useUpdateMediaAltTextMutation,
  useReorderMediaMutation,
  useSetCoverMediaMutation,
  useDeleteMediaMutation,
  useGetPublicMediaQuery,
} = mediaApi;
