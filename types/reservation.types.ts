export type Reservation = {
  id: string;
  item_id: string;
  display_name: string | null;
  is_anonymous: boolean;
  reserver_email: string | null;
  created_at: string;
};
