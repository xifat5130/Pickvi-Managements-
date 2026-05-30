/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 'pending' | 'on-hold' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  variation_id?: number;
  variation_name?: string;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  city: string;
}

export interface SteadfastDetails {
  consignment_id?: string;
  is_sent: boolean;
  delivery_status?: string;
  recipient_phone?: string;
  cod_amount?: number;
  tracking_url?: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  date_created: string;
  date_modified: string;
  total: number;
  billing: BillingAddress;
  line_items: OrderItem[];
  customer_note?: string;
  _is_moderator_order?: string; // 'yes' | 'no'
  _moderator_username?: string;
  _moderator_name?: string;
  steadfast?: SteadfastDetails;
  fraud_history?: {
    total_parcels: number;
    successful_deliveries: number;
    cancelled_deliveries: number;
    last_status?: string;
    is_sandbox?: boolean;
    sandbox_reason?: string;
    used_account?: string;
  };
}

export interface Product {
  id: number;
  name: string;
  price: number;
  sku: string;
  stock_quantity: number;
  image?: string;
  variations?: {
    id: number;
    name: string;
    price: number;
    stock_quantity: number;
  }[];
}

export interface OrderNote {
  id: number;
  order_id: number;
  author: string;
  content: string;
  date_created: string;
}

export type UserRole = 'admin' | 'moderator';

export interface User {
  username: string;
  role: UserRole;
  fullName: string;
  dateCreated?: string;
}

export interface DashboardStats {
  total_sales: number;
  order_count: number;
  pending_approval: number;
  processing_count: number;
  completed_count: number;
  cancelled_count: number;
  revenue_by_status: { [key: string]: number };
  recent_activity: string[];
}
