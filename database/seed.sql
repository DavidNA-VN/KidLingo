CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Demo password for all seeded accounts: Demo@123456
-- Password hashes are generated with PostgreSQL pgcrypto bcrypt-compatible crypt().

INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'teacher@doodle.test',
    crypt('Demo@123456', gen_salt('bf')),
    'Ms. Lan Nguyen',
    'TEACHER',
    NULL
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'teacher2@doodle.test',
    crypt('Demo@123456', gen_salt('bf')),
    'Mr. Minh Tran',
    'TEACHER',
    NULL
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'parent@doodle.test',
    crypt('Demo@123456', gen_salt('bf')),
    'Anh Nam',
    'PARENT',
    NULL
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'parent2@doodle.test',
    crypt('Demo@123456', gen_salt('bf')),
    'Chi Hoa',
    'PARENT',
    NULL
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = now();

INSERT INTO classes (id, teacher_id, name, description, class_code)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    'Grade 3 - Sunflower',
    'Main demo class for doodle vocabulary practice.',
    'SUNFLOWER-3'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    'Grade 2 - Rainbow',
    'Secondary demo class with younger learners.',
    'RAINBOW-2'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '22222222-2222-2222-2222-222222222222',
    'Grade 4 - Ocean',
    'Class owned by another teacher for permission testing.',
    'OCEAN-4'
  )
ON CONFLICT (class_code) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO children (id, parent_id, display_name, birth_year, nickname, avatar_url, profile_note, status, total_stars, total_coins)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '33333333-3333-3333-3333-333333333333',
    'Ben',
    2017,
    'Ben Bear',
    NULL,
    'Thich hoc bang hinh anh, can nhac cham khi doc tu moi.',
    'ACTIVE',
    12,
    40
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '33333333-3333-3333-3333-333333333333',
    'Amy',
    2018,
    'Mimi',
    NULL,
    'Tap trung tot voi worksheet ngan, thich duoc khen bang sao.',
    'ACTIVE',
    6,
    20
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '44444444-4444-4444-4444-444444444444',
    'Tom',
    2016,
    'Tommy',
    NULL,
    'Hay trung ten voi ban khac, can xem phu huynh va nam sinh khi cham bai.',
    'ACTIVE',
    9,
    30
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    '44444444-4444-4444-4444-444444444444',
    'Tom',
    2015,
    'Tom archived',
    NULL,
    'Ho so luu tru de test truong hop trung ten.',
    'ARCHIVED',
    0,
    0
  )
ON CONFLICT (id) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  display_name = EXCLUDED.display_name,
  birth_year = EXCLUDED.birth_year,
  nickname = EXCLUDED.nickname,
  avatar_url = EXCLUDED.avatar_url,
  profile_note = EXCLUDED.profile_note,
  status = EXCLUDED.status,
  total_stars = EXCLUDED.total_stars,
  total_coins = EXCLUDED.total_coins,
  updated_at = now();

INSERT INTO class_children (class_id, child_id, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'ACTIVE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'ACTIVE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'ACTIVE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'ACTIVE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'ACTIVE')
ON CONFLICT (class_id, child_id) DO UPDATE SET
  status = EXCLUDED.status;

INSERT INTO lessons (id, teacher_id, title, description, vocabulary_items)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    '11111111-1111-1111-1111-111111111111',
    'Fruit Words',
    'Practice apple and banana doodles.',
    '[
      {"class_key":"apple","english":"apple","vi":"qua tao","phonetic":"/ap-uhl/"},
      {"class_key":"banana","english":"banana","vi":"qua chuoi","phonetic":"/buh-na-nuh/"}
    ]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '11111111-1111-1111-1111-111111111111',
    'Animal Words',
    'Practice cat, duck and fish doodles.',
    '[
      {"class_key":"cat","english":"cat","vi":"con meo","phonetic":"/kat/"},
      {"class_key":"duck","english":"duck","vi":"con vit","phonetic":"/duhk/"},
      {"class_key":"fish","english":"fish","vi":"con ca","phonetic":"/fish/"}
    ]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '11111111-1111-1111-1111-111111111111',
    'Things Around Us',
    'Practice airplane, car, hand, house and soccer ball.',
    '[
      {"class_key":"airplane","english":"airplane","vi":"may bay","phonetic":"/air-playn/"},
      {"class_key":"car","english":"car","vi":"xe o to","phonetic":"/kar/"},
      {"class_key":"hand","english":"hand","vi":"ban tay","phonetic":"/hand/"},
      {"class_key":"house","english":"house","vi":"ngoi nha","phonetic":"/hows/"},
      {"class_key":"soccer_ball","english":"soccer ball","vi":"qua bong da","phonetic":"/sok-er bawl/"}
    ]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    '22222222-2222-2222-2222-222222222222',
    'Ocean Class Starter',
    'Lesson owned by another teacher for permission testing.',
    '[
      {"class_key":"fish","english":"fish","vi":"con ca","phonetic":"/fish/"}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  vocabulary_items = EXCLUDED.vocabulary_items,
  updated_at = now();

INSERT INTO assignments (id, class_id, lesson_id, title, instructions, due_at, status)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'Draw fruit words',
    'Xem tài liệu trong lesson, vẽ apple hoặc banana, nghe phát âm và đọc lại một lần trước khi nộp.',
    now() + interval '7 days',
    'PUBLISHED'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'Draw animal words',
    'Luyện vẽ một con vật trong bài, sau đó đọc từ tiếng Anh theo mẫu phát âm.',
    now() + interval '10 days',
    'PUBLISHED'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'Draw things around us',
    'Xem video trước, chọn một đồ vật quanh em để luyện nói và nộp kết quả sau khi hoàn thành.',
    now() + interval '14 days',
    'PUBLISHED'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    'Draw ocean word',
    'Hoàn thành bài fish và gửi kết quả để giáo viên kiểm tra.',
    now() + interval '5 days',
    'PUBLISHED'
  )
ON CONFLICT (id) DO UPDATE SET
  class_id = EXCLUDED.class_id,
  lesson_id = EXCLUDED.lesson_id,
  title = EXCLUDED.title,
  instructions = EXCLUDED.instructions,
  due_at = EXCLUDED.due_at,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO submissions (
  id,
  assignment_id,
  child_id,
  target_class,
  predicted_class,
  confidence,
  is_correct,
  top_predictions,
  canvas_image_url,
  speech_transcript,
  speech_passed,
  stars_earned,
  coins_earned,
  created_at
)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'apple',
    'apple',
    0.9412,
    true,
    '[{"class_key":"apple","confidence":0.9412},{"class_key":"banana","confidence":0.0311},{"class_key":"cat","confidence":0.0102}]'::jsonb,
    '/uploads/submissions/ben-apple.png',
    'apple',
    true,
    3,
    10,
    now() - interval '2 days'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'banana',
    'banana',
    0.8844,
    true,
    '[{"class_key":"banana","confidence":0.8844},{"class_key":"apple","confidence":0.0701},{"class_key":"duck","confidence":0.0150}]'::jsonb,
    '/uploads/submissions/amy-banana.png',
    'banana',
    true,
    3,
    10,
    now() - interval '1 day'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'cat',
    'duck',
    0.6120,
    false,
    '[{"class_key":"duck","confidence":0.6120},{"class_key":"cat","confidence":0.2805},{"class_key":"fish","confidence":0.0601}]'::jsonb,
    '/uploads/submissions/ben-cat-miss.png',
    'cat',
    true,
    1,
    3,
    now() - interval '12 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'fish',
    'fish',
    0.9033,
    true,
    '[{"class_key":"fish","confidence":0.9033},{"class_key":"duck","confidence":0.0524},{"class_key":"cat","confidence":0.0140}]'::jsonb,
    '/uploads/submissions/tom-fish.png',
    'fish',
    false,
    2,
    7,
    now() - interval '3 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  assignment_id = EXCLUDED.assignment_id,
  child_id = EXCLUDED.child_id,
  target_class = EXCLUDED.target_class,
  predicted_class = EXCLUDED.predicted_class,
  confidence = EXCLUDED.confidence,
  is_correct = EXCLUDED.is_correct,
  top_predictions = EXCLUDED.top_predictions,
  canvas_image_url = EXCLUDED.canvas_image_url,
  speech_transcript = EXCLUDED.speech_transcript,
  speech_passed = EXCLUDED.speech_passed,
  stars_earned = EXCLUDED.stars_earned,
  coins_earned = EXCLUDED.coins_earned,
  created_at = EXCLUDED.created_at;

INSERT INTO conversations (id, teacher_id, parent_id, class_id, child_id)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
  )
ON CONFLICT (id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  parent_id = EXCLUDED.parent_id,
  class_id = EXCLUDED.class_id,
  child_id = EXCLUDED.child_id,
  updated_at = now();

INSERT INTO messages (id, conversation_id, sender_id, body, read_at, created_at)
VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    '11111111-1111-1111-1111-111111111111',
    'Hello, Ben did well with the fruit lesson today.',
    now() - interval '1 day',
    now() - interval '1 day 1 hour'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    '33333333-3333-3333-3333-333333333333',
    'Thank you teacher, we will practice cat again tonight.',
    NULL,
    now() - interval '23 hours'
  ),
  (
    '99999999-9999-9999-9999-999999999993',
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    '44444444-4444-4444-4444-444444444444',
    'Tom enjoyed drawing fish.',
    NULL,
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  body = EXCLUDED.body,
  read_at = EXCLUDED.read_at,
  created_at = EXCLUDED.created_at;

-- Phase 09 teacher-demo enrichment.
-- These records make dashboard charts, assignment states, submission review and chat richer.

INSERT INTO lessons (id, teacher_id, title, description, vocabulary_items)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    '11111111-1111-1111-1111-111111111111',
    'Reading Worksheet - My House',
    'PDF homework for reading and short answer practice.',
    '[{"class_key":"house","english":"house","vi":"ngoi nha","phonetic":"/hows/"}]'::jsonb
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    '11111111-1111-1111-1111-111111111111',
    'Speaking Practice - Transportation',
    'YouTube speaking practice plus short recording task.',
    '[{"class_key":"airplane","english":"airplane","vi":"may bay","phonetic":"/air-playn/"},{"class_key":"car","english":"car","vi":"xe o to","phonetic":"/kar/"}]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  vocabulary_items = EXCLUDED.vocabulary_items,
  updated_at = now();

INSERT INTO lesson_materials (
  id,
  lesson_id,
  type,
  title,
  description,
  file_url,
  external_url,
  youtube_video_id,
  vocabulary_items,
  sort_order
)
VALUES
  (
    '12121212-1212-1212-1212-121212121211',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'PDF',
    'Fruit worksheet PDF',
    'Bai tap to mau va noi tu apple, banana.',
    '/uploads/materials/fruit-worksheet-demo.pdf',
    NULL,
    NULL,
    NULL,
    1
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'DOODLE_VOCAB',
    'Lesson 1 doodle demo',
    'Demo AI doodle chi gioi han 10 class da train.',
    NULL,
    NULL,
    NULL,
    '[{"class_key":"apple","english":"apple","vi":"qua tao","phonetic":"/ap-uhl/"},{"class_key":"banana","english":"banana","vi":"qua chuoi","phonetic":"/buh-na-nuh/"}]'::jsonb,
    2
  ),
  (
    '12121212-1212-1212-1212-121212121213',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'SPEAKING_PROMPT',
    'Animal speaking prompt',
    'Con hay noi: I can see a cat/duck/fish.',
    NULL,
    NULL,
    NULL,
    NULL,
    1
  ),
  (
    '12121212-1212-1212-1212-121212121214',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'YOUTUBE_VIDEO',
    'Things around us video',
    'Video luyen nghe va lap lai cac tu do vat quen thuoc.',
    NULL,
    'https://www.youtube.com/watch?v=R9intHqlzhc',
    'R9intHqlzhc',
    NULL,
    1
  ),
  (
    '12121212-1212-1212-1212-121212121215',
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    'PDF',
    'My house worksheet',
    'Phieu bai tap doc hieu ngan ve chu de my house.',
    '/uploads/materials/my-house-worksheet-demo.pdf',
    NULL,
    NULL,
    NULL,
    1
  ),
  (
    '12121212-1212-1212-1212-121212121216',
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    'YOUTUBE_VIDEO',
    'Transportation speaking video',
    'Hoc sinh xem video va ghi am 2 cau ngan.',
    NULL,
    'https://www.youtube.com/watch?v=Ut-HbauKzDw',
    'Ut-HbauKzDw',
    NULL,
    1
  ),
  (
    '12121212-1212-1212-1212-121212121217',
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    'NOTE',
    'Teacher note',
    'Phu huynh co the cho tre luyen noi 5 phut moi ngay.',
    NULL,
    NULL,
    NULL,
    NULL,
    2
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_url = EXCLUDED.file_url,
  external_url = EXCLUDED.external_url,
  youtube_video_id = EXCLUDED.youtube_video_id,
  vocabulary_items = EXCLUDED.vocabulary_items,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO assignments (id, class_id, lesson_id, title, instructions, due_at, status)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'Speaking about things around us',
    'Xem video, chon 2 tu va ghi am cau ngan. Giao vien se review speech va confidence.',
    now() - interval '2 days',
    'CLOSED'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc5',
    'Read My House worksheet',
    'Lam PDF My House, phu huynh chup anh bai lam va nop lai tren he thong.',
    now() + interval '4 days',
    'PUBLISHED'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd7',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc6',
    'Transportation speaking review',
    'Xem video tren web, luyen noi airplane/car va nop recording ngan.',
    now() - interval '1 day',
    'CLOSED'
  )
ON CONFLICT (id) DO UPDATE SET
  class_id = EXCLUDED.class_id,
  lesson_id = EXCLUDED.lesson_id,
  title = EXCLUDED.title,
  instructions = EXCLUDED.instructions,
  due_at = EXCLUDED.due_at,
  status = EXCLUDED.status,
  updated_at = now();

UPDATE submissions SET
  teacher_feedback = 'Ben nhan dien tot tu apple. Lan sau co the ve them cuong va la ro hon.',
  reviewed_at = now() - interval '1 day 18 hours',
  reviewed_by = '11111111-1111-1111-1111-111111111111'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';

UPDATE submissions SET
  teacher_feedback = 'Tom ve fish tot nhung phan speech can luyen lai am cuoi.',
  reviewed_at = now() - interval '2 hours',
  reviewed_by = '11111111-1111-1111-1111-111111111111'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4';

INSERT INTO submissions (
  id,
  assignment_id,
  child_id,
  target_class,
  predicted_class,
  confidence,
  is_correct,
  top_predictions,
  canvas_image_url,
  speech_transcript,
  speech_passed,
  stars_earned,
  coins_earned,
  teacher_feedback,
  reviewed_at,
  reviewed_by,
  created_at
)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'car',
    'car',
    0.7720,
    true,
    '[{"class_key":"car","confidence":0.7720},{"class_key":"airplane","confidence":0.1102},{"class_key":"house","confidence":0.0500}]'::jsonb,
    '/uploads/submissions/ben-car.png',
    'car',
    true,
    2,
    8,
    'Dung muc tieu, confidence on. Khuyen khich Ben noi thanh cau: This is a car.',
    now() - interval '1 day',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '2 days 4 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'house',
    'house',
    0.6840,
    true,
    '[{"class_key":"house","confidence":0.6840},{"class_key":"hand","confidence":0.1200},{"class_key":"car","confidence":0.0810}]'::jsonb,
    '/uploads/submissions/amy-house-low-confidence.png',
    'house',
    false,
    1,
    3,
    NULL,
    NULL,
    NULL,
    now() - interval '1 day 5 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'airplane',
    'car',
    0.5530,
    false,
    '[{"class_key":"car","confidence":0.5530},{"class_key":"airplane","confidence":0.3010},{"class_key":"fish","confidence":0.0600}]'::jsonb,
    '/uploads/submissions/tom-airplane-miss.png',
    'airplane',
    true,
    1,
    3,
    NULL,
    NULL,
    NULL,
    now() - interval '18 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8',
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'house',
    'house',
    0.9120,
    true,
    '[{"class_key":"house","confidence":0.9120},{"class_key":"hand","confidence":0.0300},{"class_key":"car","confidence":0.0200}]'::jsonb,
    '/uploads/submissions/amy-house-worksheet.png',
    'this is my house',
    true,
    3,
    10,
    'Amy hoan thanh worksheet ro rang, speech dat.',
    now() - interval '5 hours',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '6 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  assignment_id = EXCLUDED.assignment_id,
  child_id = EXCLUDED.child_id,
  target_class = EXCLUDED.target_class,
  predicted_class = EXCLUDED.predicted_class,
  confidence = EXCLUDED.confidence,
  is_correct = EXCLUDED.is_correct,
  top_predictions = EXCLUDED.top_predictions,
  canvas_image_url = EXCLUDED.canvas_image_url,
  speech_transcript = EXCLUDED.speech_transcript,
  speech_passed = EXCLUDED.speech_passed,
  stars_earned = EXCLUDED.stars_earned,
  coins_earned = EXCLUDED.coins_earned,
  teacher_feedback = EXCLUDED.teacher_feedback,
  reviewed_at = EXCLUDED.reviewed_at,
  reviewed_by = EXCLUDED.reviewed_by,
  created_at = EXCLUDED.created_at;

INSERT INTO conversations (id, teacher_id, parent_id, class_id, child_id)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff4',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
  )
ON CONFLICT (id) DO UPDATE SET
  teacher_id = EXCLUDED.teacher_id,
  parent_id = EXCLUDED.parent_id,
  class_id = EXCLUDED.class_id,
  child_id = EXCLUDED.child_id,
  updated_at = now();

INSERT INTO messages (id, conversation_id, sender_id, body, read_at, created_at)
VALUES
  (
    '99999999-9999-9999-9999-999999999994',
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    '11111111-1111-1111-1111-111111111111',
    'Co da xem bai cua Tom. Phan ve tot, minh luyen lai speech trong 5 phut moi ngay nhe.',
    NULL,
    now() - interval '90 minutes'
  ),
  (
    '99999999-9999-9999-9999-999999999995',
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    '11111111-1111-1111-1111-111111111111',
    'Amy da hoan thanh worksheet My House rat gon gang. Anh Nam co the cho be doc lai 2 cau trong PDF.',
    NULL,
    now() - interval '5 hours'
  ),
  (
    '99999999-9999-9999-9999-999999999996',
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    '33333333-3333-3333-3333-333333333333',
    'Vang, toi se cho Amy doc lai truoc gio ngu.',
    NULL,
    now() - interval '4 hours'
  ),
  (
    '99999999-9999-9999-9999-999999999997',
    'ffffffff-ffff-ffff-ffff-fffffffffff4',
    '22222222-2222-2222-2222-222222222222',
    'Ocean class message for teacher2 permission isolation.',
    NULL,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  body = EXCLUDED.body,
  read_at = EXCLUDED.read_at,
  created_at = EXCLUDED.created_at;

INSERT INTO conversations (id, conversation_type, teacher_id, parent_id, class_id, child_id)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff5',
    'CLASS_GROUP',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  conversation_type = EXCLUDED.conversation_type,
  teacher_id = EXCLUDED.teacher_id,
  parent_id = EXCLUDED.parent_id,
  class_id = EXCLUDED.class_id,
  child_id = EXCLUDED.child_id,
  updated_at = now();

INSERT INTO messages (id, conversation_id, sender_id, body, read_at, created_at)
VALUES
  (
    '99999999-9999-9999-9999-999999999998',
    'ffffffff-ffff-ffff-ffff-fffffffffff5',
    '11111111-1111-1111-1111-111111111111',
    'Thong bao chung: lop Sunflower se nop phieu tra loi PDF truoc thu Sau.',
    NULL,
    now() - interval '30 minutes'
  )
ON CONFLICT (id) DO UPDATE SET
  conversation_id = EXCLUDED.conversation_id,
  sender_id = EXCLUDED.sender_id,
  body = EXCLUDED.body,
  read_at = EXCLUDED.read_at,
  created_at = EXCLUDED.created_at;

-- Phase 14-17 teacher redesign demo data.
-- Keep lessons class-scoped, PDF assignments file-backed, and doodle submissions out of grading analytics.

UPDATE lessons SET class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
WHERE id IN (
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  'cccccccc-cccc-cccc-cccc-ccccccccccc2',
  'cccccccc-cccc-cccc-cccc-ccccccccccc3',
  'cccccccc-cccc-cccc-cccc-ccccccccccc6'
);

UPDATE lessons SET class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc5';

UPDATE lessons SET class_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc4';

UPDATE assignments SET
  assignment_type = 'PDF_ASSIGNMENT',
  worksheet_file_url = CASE id
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd1' THEN '/uploads/assignments/fruit-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd2' THEN '/uploads/assignments/animal-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd3' THEN '/uploads/assignments/things-around-us-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd4' THEN '/uploads/assignments/ocean-word-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd5' THEN '/uploads/assignments/things-speaking-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd6' THEN '/uploads/assignments/my-house-worksheet.pdf'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd7' THEN '/uploads/assignments/transportation-speaking-worksheet.pdf'
    ELSE worksheet_file_url
  END,
  answer_template_url = CASE id
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd1' THEN '/uploads/assignments/fruit-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd2' THEN '/uploads/assignments/animal-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd3' THEN '/uploads/assignments/things-around-us-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd4' THEN '/uploads/assignments/ocean-word-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd5' THEN '/uploads/assignments/things-speaking-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd6' THEN '/uploads/assignments/my-house-answer-template.docx'
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd7' THEN '/uploads/assignments/transportation-speaking-answer-template.docx'
    ELSE answer_template_url
  END,
  max_score = CASE id
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd5' THEN 5.00
    WHEN 'dddddddd-dddd-dddd-dddd-ddddddddddd7' THEN 5.00
    ELSE 10.00
  END
WHERE id IN (
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  'dddddddd-dddd-dddd-dddd-ddddddddddd3',
  'dddddddd-dddd-dddd-dddd-ddddddddddd4',
  'dddddddd-dddd-dddd-dddd-ddddddddddd5',
  'dddddddd-dddd-dddd-dddd-ddddddddddd6',
  'dddddddd-dddd-dddd-dddd-ddddddddddd7'
);

UPDATE submissions SET
  submission_type = 'DOODLE_ATTEMPT',
  answer_file_url = NULL,
  submitted_at = COALESCE(submitted_at, created_at),
  graded_at = NULL,
  graded_by = NULL,
  score = NULL,
  max_score = NULL,
  grading_status = 'NOT_REQUIRED',
  returned_at = NULL
WHERE id IN (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8'
);

INSERT INTO submissions (
  id,
  assignment_id,
  child_id,
  submission_type,
  answer_file_url,
  is_correct,
  speech_passed,
  stars_earned,
  coins_earned,
  submitted_at,
  graded_at,
  graded_by,
  score,
  max_score,
  grading_status,
  returned_at,
  teacher_feedback,
  reviewed_at,
  reviewed_by,
  created_at
)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9',
    'dddddddd-dddd-dddd-dddd-ddddddddddd6',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'PDF_ANSWER',
    '/uploads/submissions/amy-my-house-answer.docx',
    false,
    false,
    0,
    0,
    now() - interval '6 hours',
    now() - interval '5 hours',
    '11111111-1111-1111-1111-111111111111',
    8.50,
    10.00,
    'RETURNED',
    now() - interval '4 hours',
    'Amy lam bai My House ro rang, can viet cau tra loi dai hon o cau 3.',
    now() - interval '5 hours',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '6 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'PDF_ANSWER',
    '/uploads/submissions/ben-fruit-answer.docx',
    false,
    false,
    0,
    0,
    now() - interval '1 day',
    now() - interval '12 hours',
    '11111111-1111-1111-1111-111111111111',
    7.50,
    10.00,
    'GRADED',
    NULL,
    'Ben noi dung dung, can trinh bay sach hon truoc khi tra bai.',
    now() - interval '12 hours',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '1 day'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'PDF_ANSWER',
    '/uploads/submissions/tom-animal-answer.docx',
    false,
    false,
    0,
    0,
    now() - interval '2 hours',
    NULL,
    NULL,
    NULL,
    10.00,
    'SUBMITTED',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '2 hours'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee12',
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'PDF_ANSWER',
    '/uploads/submissions/ben-things-speaking-answer.docx',
    false,
    false,
    0,
    0,
    now() - interval '1 day',
    NULL,
    NULL,
    NULL,
    5.00,
    'SUBMITTED',
    NULL,
    NULL,
    NULL,
    NULL,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO UPDATE SET
  assignment_id = EXCLUDED.assignment_id,
  child_id = EXCLUDED.child_id,
  submission_type = EXCLUDED.submission_type,
  answer_file_url = EXCLUDED.answer_file_url,
  is_correct = EXCLUDED.is_correct,
  speech_passed = EXCLUDED.speech_passed,
  stars_earned = EXCLUDED.stars_earned,
  coins_earned = EXCLUDED.coins_earned,
  submitted_at = EXCLUDED.submitted_at,
  graded_at = EXCLUDED.graded_at,
  graded_by = EXCLUDED.graded_by,
  score = EXCLUDED.score,
  max_score = EXCLUDED.max_score,
  grading_status = EXCLUDED.grading_status,
  returned_at = EXCLUDED.returned_at,
  teacher_feedback = EXCLUDED.teacher_feedback,
  reviewed_at = EXCLUDED.reviewed_at,
  reviewed_by = EXCLUDED.reviewed_by,
  created_at = EXCLUDED.created_at;

COMMIT;
