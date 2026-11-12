// ── Shared TypeScript types for ZeroThali ────────────────────────────────────

export type FoodCondition = 'edible' | 'unfit';
export type FoodStatus = 'available' | 'claimed' | 'collected' | 'biogas';

export interface Mess {
  id: string;
  name: string;
  created_at: string;
}

export interface FoodLog {
  id: string;
  mess_id: string | null;
  staff_id: string | null;
  food_item: string;
  quantity_kg: number;
  cooked_at: string | null;
  condition: FoodCondition;
  photo_url: string | null;
  status: FoodStatus;
  claim_code: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  collected_at: string | null;
  collection_photo: string | null;
  created_at: string;
}

/** Receiver page needs mess name joined in */
export interface FoodLogWithMess extends FoodLog {
  mess_name: string;
}

export interface BiogasQueueRow {
  id: string;
  mess_id: string | null;
  mess_name: string;
  food_item: string;
  quantity_kg: number;
  created_at: string;
}

export interface AdminKPI {
  total_edible: number;
  kg_edible: number;
  total_unfit: number;
  kg_unfit: number;
  biogas_m3: number;
  lpg_kg_saved: number;
}

export type UserRole = 'staff' | 'receiver' | 'admin' | '';
