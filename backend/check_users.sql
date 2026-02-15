-- Check if users table has any data
SELECT COUNT(*) as user_count FROM users;

-- If you have users, check their current roles
SELECT id, name, email, role FROM users LIMIT 10;
