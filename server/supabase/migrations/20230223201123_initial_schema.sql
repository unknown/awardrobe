create table "public"."prices" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "store_id" uuid not null,
    "style" text not null,
    "size" text not null,
    "price_in_cents" integer not null,
    "stock" integer,
    "in_stock" boolean not null
);


alter table "public"."prices" enable row level security;

create table "public"."stores" (
    "created_at" timestamp with time zone default now(),
    "name" text not null,
    "url" text,
    "id" uuid not null default uuid_generate_v4()
);


alter table "public"."stores" enable row level security;

CREATE UNIQUE INDEX prices_pkey ON public.prices USING btree (id);

CREATE UNIQUE INDEX stores_pkey ON public.stores USING btree (id);

alter table "public"."prices" add constraint "prices_pkey" PRIMARY KEY using index "prices_pkey";

alter table "public"."stores" add constraint "stores_pkey" PRIMARY KEY using index "stores_pkey";

alter table "public"."prices" add constraint "prices_store_id_fkey" FOREIGN KEY (store_id) REFERENCES stores(id) not valid;

alter table "public"."prices" validate constraint "prices_store_id_fkey";


