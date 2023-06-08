create policy "Enable read access for all users"
on "public"."prices"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."products"
as permissive
for select
to public
using (true);


create policy "Enable read access for all users"
on "public"."stores"
as permissive
for select
to public
using (true);



