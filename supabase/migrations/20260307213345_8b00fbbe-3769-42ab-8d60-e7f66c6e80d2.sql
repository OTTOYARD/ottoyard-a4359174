INSERT INTO public.user_roles (user_id, role)
VALUES ('82c8e991-de59-440b-8cd1-e42e805021fd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;