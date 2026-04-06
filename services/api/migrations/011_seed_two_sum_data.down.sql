DELETE FROM test_cases WHERE problem_id = (SELECT id FROM problems WHERE slug = 'two-sum');
UPDATE problems SET starter_code = '{}' WHERE slug = 'two-sum';
