# Levi's US

## getProducts

| Method | Endpoint                                                                                                                                                | Description                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| GET    | https://www.levi.com/mule/lma/v1/leviUSSite/categories/levi_clothing_men/products?currentPage=0&pageSize=8&fields=FULL&enableGrouping=true&lang=en_US   | Get a list of men's clothing   |
| GET    | https://www.levi.com/mule/lma/v1/leviUSSite/categories/levi_clothing_women/products?currentPage=0&pageSize=8&fields=FULL&enableGrouping=true&lang=en_US | Get a list of women's clothing |
| GET    | https://www.levi.com/mule/lma/v1/leviUSSite/categories/levi_clothing_kids/products?currentPage=0&pageSize=8&fields=FULL&enableGrouping=true&lang=en_US  | Get a list of kids' clothing   |

## getProductCode

| Method | Endpoint                                                                                               | Description                   |
| ------ | ------------------------------------------------------------------------------------------------------ | ----------------------------- |
| GET    | https://www.levi.com/US/en_US/clothing/men/jeans/taper/502-taper-fit-levis-flex-mens-jeans/p/295071112 | Get product id from final tag |

## getProductDetails

| Method | Endpoint                                                                                         | Description         |
| ------ | ------------------------------------------------------------------------------------------------ | ------------------- |
| GET    | https://www.levi.com/mule/lma/v1/leviUSSite/products/295071301?fields=FULL&lang=en_US            | Get product details |
| GET    | https://www.levi.com/mule/lma/v1/leviUSSite/products/295071301/swatchdata?fields=FULL&lang=en_US | Get variants        |
