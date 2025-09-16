export type Stop = {
  id: string; // uuid
  address: string; // "21 Rue Haute"
  city: string; // "Pleudihen"
  phone?: string; // "+33..." or "07..."
  time?: string; // normalized "HH:MM"
  notes?: string; // "coupé; couteau; fourchette"
};

export type OrderMode = 'manual' | 'time';

