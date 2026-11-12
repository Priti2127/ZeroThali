// ============================================================
// ZeroThali TypeScript Type Definitions
// ============================================================

export type UserRole = 'student' | 'manager' | 'receiver' | 'admin';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type ConfirmationStatus = 'confirmed' | 'skipped' | 'unconfirmed';
export type LeftoverStatus = 'available' | 'sold_out' | 'expired';
export type OrderStatus = 'pending' | 'paid' | 'collected' | 'expired' | 'cancelled';
export type FeedbackTag = 'too_salty' | 'too_much_quantity' | 'cold' | 'undercooked' | 'bland' | 'perfect';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  hostel_name?: string;
  room_number?: string;
  is_registered: boolean;
  weekly_order_count: number;
  last_order_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  name: string;
  category?: string;
  avg_wastage_kg: number;
  avg_rating: number;
  times_served: number;
  created_at: string;
}

export interface MenuDish {
  dish: string;
  quantity_kg: number;
}

export interface Meal {
  id: string;
  date: string;
  type: MealType;
  cutoff_time: string;
  is_cutoff_locked: boolean;
  menu?: MenuDish[];
  cooked_kg?: number;
  leftover_kg?: number;
  actual_registered_count: number;
  actual_unregistered_count: number;
  predicted_walkins?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Confirmation {
  id: string;
  user_id: string;
  meal_id: string;
  status: ConfirmationStatus;
  updated_at: string;
}

export interface Walkin {
  id: string;
  meal_id: string;
  count: number;
  logged_by?: string;
  logged_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  meal_id: string;
  rating: number;
  tags?: FeedbackTag[];
  comment?: string;
  created_at: string;
  user?: {
    full_name: string;
  };
}

export interface Leftover {
  id: string;
  meal_id: string;
  quantity_plates: number;
  available_plates: number;
  price_per_plate: number;
  status: LeftoverStatus;
  alert_sent_at?: string;
  created_at: string;
  expires_at?: string;
  meal?: Meal;
}

export interface Order {
  id: string;
  leftover_id: string;
  receiver_id: string;
  quantity: number;
  total_price: number;
  pickup_code: string;
  status: OrderStatus;
  payment_id?: string;
  paid_at?: string;
  collected_at?: string;
  expires_at: string;
  created_at: string;
  leftover?: Leftover;
}

export interface Alert {
  id: string;
  leftover_id?: string;
  receiver_ids?: string[];
  message: string;
  sent_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  created_at: string;
}

// Dashboard stats interfaces
export interface ManagerStats {
  today_confirmed: number;
  today_skipped: number;
  today_unconfirmed: number;
  predicted_walkins: number;
  total_expected: number;
  recent_wastage_kg: number;
  recent_feedback_avg: number;
  leftover_revenue: number;
}

export interface AdminStats {
  total_users: number;
  total_students: number;
  total_receivers: number;
  total_meals_served: number;
  total_wastage_kg: number;
  wastage_trend: number;
  meals_saved: number;
  avg_rating: number;
}

export interface WastageComparison {
  current_meal: string;
  current_wastage: number;
  previous_wastage: number;
  change_percent: number;
  trend: 'up' | 'down' | 'same';
}

export interface DishRanking {
  dish_name: string;
  avg_wastage_kg: number;
  avg_rating: number;
  times_served: number;
}

export interface Insight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrderResponse {
  success: boolean;
  order_id?: string;
  pickup_code?: string;
  expires_at?: string;
  total_price?: number;
  error?: string;
}

// Chart data types
export interface WastageChartData {
  date: string;
  wastage_kg: number;
  meal_type: string;
}

export interface RatingChartData {
  meal_date: string;
  rating: number;
  meal_type: string;
}

export interface WalkinPrediction {
  meal_type: MealType;
  weekday: string;
  avg_walkins: number;
  low_estimate: number;
  high_estimate: number;
}
