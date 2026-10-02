import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { PublicPicture } from '@/types/media';

export interface Category {
  id: string;
  nameEs: string;
  nameEn: string;
  /** A glyph name from CATEGORY_ICONS (lib/categoryIcons.ts); null = none. */
  icon: string | null;
}
export interface AdminCategory extends Category {
  active: boolean;
}

export type StockStatus = 'available' | 'limited' | 'out';

export interface Product {
  id: string;
  slug: string;
  categoryId: string | null;
  nameEs: string;
  nameEn: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  priceCents: number;
  unitLabel: string;
  stockStatus: StockStatus;
  maxPerOrder: number | null;
  cover: PublicPicture | null;
}
export interface ProductDetail extends Product {
  pictures: PublicPicture[];
}
export interface AdminProduct extends Omit<Product, 'cover'> {
  active: boolean;
  cover: PublicPicture | null;
}

export interface CreateProductInput {
  nameEs: string;
  nameEn?: string;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  categoryId?: string | null;
  priceCents: number;
  unitLabel: string;
  stockStatus?: StockStatus;
  maxPerOrder?: number | null;
  slug?: string;
}
export type UpdateProductInput = Partial<CreateProductInput>;

export interface CreateCategoryInput {
  nameEs: string;
  nameEn?: string;
  icon?: string | null;
  active?: boolean;
}
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery,
  tagTypes: ['Category', 'AdminCategory', 'Product', 'AdminProduct'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/catalog/categories',
      providesTags: ['Category'],
    }),
    getProducts: builder.query<Product[], { categoryId?: string } | void>({
      query: (args) => ({ url: '/catalog/products', params: args?.categoryId ? { categoryId: args.categoryId } : undefined }),
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: 'Product' as const, id: p.id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductBySlug: builder.query<ProductDetail, string>({
      query: (slug) => `/catalog/products/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'Product', id: slug }],
    }),

    // --- admin -----------------------------------------------------------
    getAdminCategories: builder.query<AdminCategory[], void>({
      query: () => '/catalog/admin/categories',
      providesTags: ['AdminCategory'],
    }),
    createCategory: builder.mutation<AdminCategory, CreateCategoryInput>({
      query: (body) => ({ url: '/catalog/categories', method: 'POST', body }),
      invalidatesTags: ['AdminCategory', 'Category'],
    }),
    updateCategory: builder.mutation<AdminCategory, { id: string } & UpdateCategoryInput>({
      query: ({ id, ...body }) => ({ url: `/catalog/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminCategory', 'Category'],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/catalog/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminCategory', 'Category', { type: 'Product', id: 'LIST' }],
    }),
    reorderCategories: builder.mutation<void, string[]>({
      query: (ids) => ({ url: '/catalog/categories/order', method: 'PUT', body: { ids } }),
      invalidatesTags: ['AdminCategory', 'Category'],
    }),

    getAdminProducts: builder.query<AdminProduct[], { categoryId?: string; active?: boolean } | void>({
      query: (args) => ({ url: '/catalog/admin/products', params: args ?? undefined }),
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: 'AdminProduct' as const, id: p.id })), { type: 'AdminProduct', id: 'LIST' }]
          : [{ type: 'AdminProduct', id: 'LIST' }],
    }),
    getAdminProductById: builder.query<AdminProduct, string>({
      query: (id) => `/catalog/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminProduct', id }],
    }),
    createProduct: builder.mutation<AdminProduct, CreateProductInput>({
      query: (body) => ({ url: '/catalog/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminProduct', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<AdminProduct, { id: string } & UpdateProductInput>({
      query: ({ id, ...body }) => ({ url: `/catalog/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminProduct', id }, { type: 'Product', id: 'LIST' }],
    }),
    activateProduct: builder.mutation<AdminProduct, string>({
      query: (id) => ({ url: `/catalog/products/${id}/activate`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'AdminProduct', id }, { type: 'Product', id: 'LIST' }],
    }),
    deactivateProduct: builder.mutation<AdminProduct, string>({
      query: (id) => ({ url: `/catalog/products/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'AdminProduct', id }, { type: 'Product', id: 'LIST' }],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/catalog/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminProduct', id: 'LIST' }, { type: 'Product', id: 'LIST' }],
    }),
    reorderProducts: builder.mutation<void, string[]>({
      query: (ids) => ({ url: '/catalog/products/order', method: 'PUT', body: { ids } }),
      invalidatesTags: [{ type: 'AdminProduct', id: 'LIST' }, { type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  useGetAdminProductsQuery,
  useGetAdminProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useActivateProductMutation,
  useDeactivateProductMutation,
  useDeleteProductMutation,
  useReorderProductsMutation,
} = catalogApi;
