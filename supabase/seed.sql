insert into public.categories (name, slug, display_order)
values
  ('Nail Technician', 'nail-technician', 10),
  ('Hair Stylist', 'hair-stylist', 20),
  ('Braider', 'braider', 30),
  ('Barber', 'barber', 40),
  ('Makeup Artist', 'makeup-artist', 50),
  ('Lash Technician', 'lash-technician', 60),
  ('Esthetician', 'esthetician', 70)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    is_active = true;
