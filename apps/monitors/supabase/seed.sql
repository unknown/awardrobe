insert into 
  stores (name, url)
values
  ('Uniqlo US', 'https://www.uniqlo.com/us/');


insert into
  products (store_id, product_id, name, styles, sizes)
values
  (1, 'E457264-000', 'U Knitted Short-Sleeve Polo Shirt', array ['DARK GRAY','BEIGE','OLIVE'], array ['28inch','29inch','30inch','31inch','32inch','33inch','34inch','35inch']),
  (1, 'E457967-000', 'U Wide-Fit Pleated Chino Pants', array ['DARK GRAY','BROWN','OLIVE'], array ['XXS','XS','S','M','L','XL']),
  (1, 'E453056-000', 'Easy Care Stretch Slim-Fit Long-Sleeve Shirt', array ['WHITE','BLACK','BLUE'], array ['XXS','XS','S','M','L','XL','XXL','3XL']);
