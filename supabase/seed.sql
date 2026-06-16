insert into public.owners (id, name, phone, email, address)
values
  ('00000000-0000-0000-0000-000000000101', 'Marcela Rojas', '+56911111111', 'marcela@example.com', 'Los Aromos 123'),
  ('00000000-0000-0000-0000-000000000102', 'Felipe Andrade', '+56922222222', 'felipe@example.com', 'Av. Italia 456'),
  ('00000000-0000-0000-0000-000000000103', 'Camila Soto', '+56933333333', null, 'Pasaje Las Flores 789'),
  ('00000000-0000-0000-0000-000000000104', 'Rodrigo Pérez', '+56944444444', 'rodrigo@example.com', null),
  ('00000000-0000-0000-0000-000000000105', 'Daniela Muñoz', '+56955555555', null, 'Santa Isabel 321')
on conflict (id) do nothing;

insert into public.pets (
  id,
  owner_id,
  name,
  species,
  breed,
  birth_date,
  estimated_age_value,
  estimated_age_unit,
  is_sterilized
)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Simona', 'Gato', 'Doméstico pelo corto', '2021-03-10', null, null, true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Bruno', 'Perro', 'Poodle', '2019-08-22', null, null, false),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', 'Lola', 'Perro', 'Mestiza', null, 7, 'years', true),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', 'Max', 'Perro', 'Labrador', '2018-11-04', null, null, false),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000105', 'Nina', 'Gato', null, null, 3, 'years', true)
on conflict (id) do nothing;

insert into public.visits (id, pet_id, visit_date, reason, observations)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '2026-05-23',
    'Vacuna',
    'Aplicada vacuna triple felina. Tutor consulta cuándo corresponde la próxima vacuna.'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    '2026-05-24',
    'Peluquería',
    'Corte sanitario y retiro de nudos. Piel sin lesiones visibles al terminar.'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000203',
    '2026-05-25',
    'Consulta',
    'Tutor nota verruga pequeña en costado derecho. Se indica observar tamaño y color.'
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000204',
    '2026-05-26',
    'Dolor',
    'Cojera intermitente posterior a paseo largo. Dolor leve a palpación de cadera.'
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000205',
    '2026-05-27',
    'Control',
    'Control general. Peso estable, apetito normal, se recomienda control dental.'
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    '00000000-0000-0000-0000-000000000201',
    '2026-06-10',
    'Consulta vacuna',
    'Revisión de carnet: última vacuna registrada el 23 mayo 2026.'
  )
on conflict (id) do nothing;
