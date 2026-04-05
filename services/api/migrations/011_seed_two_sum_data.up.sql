-- Seed starter code for two-sum problem
UPDATE problems SET starter_code = '{
  "cpp": "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};\n\nint main() {\n    // Input parsing handled by judge\n    return 0;\n}",
  "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}",
  "java": "import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
  "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass",
  "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};",
  "go": "package main\n\nfunc twoSum(nums []int, target int) []int {\n    \n}"
}'::jsonb
WHERE slug = 'two-sum';

-- Seed sample test cases for two-sum (inline content, no S3 needed)
INSERT INTO test_cases (problem_id, s3_input_key, s3_output_key, is_sample, display_order, input_content, output_content)
SELECT p.id, '', '', true, 1,
  E'[2,7,11,15]\n9',
  E'[0,1]'
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO test_cases (problem_id, s3_input_key, s3_output_key, is_sample, display_order, input_content, output_content)
SELECT p.id, '', '', true, 2,
  E'[3,2,4]\n6',
  E'[1,2]'
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO test_cases (problem_id, s3_input_key, s3_output_key, is_sample, display_order, input_content, output_content)
SELECT p.id, '', '', true, 3,
  E'[3,3]\n6',
  E'[0,1]'
FROM problems p WHERE p.slug = 'two-sum';
