#!/usr/bin/env python3

from multiprocessing import Pool
import requests
import json

endpoint = "http://localhost:3001/uniqlo-us/"
headers = {
    "Content-Type": "application/json"
}
productIds = [
    "E457264-000",  # U Knitted Short-Sleeve Polo Shirt
    "E457967-000",  # U Wide-Fit Pleated Chino Pants
    "E453056-000",  # Easy Care Stretch Slim-Fit Long-Sleeve Shirt
]


def get_product_data(product_id):
    payload = json.dumps({
        "productId": product_id
    })
    requests.request("GET", endpoint, headers=headers, data=payload)


def main():
    with Pool(processes=4) as p:
        p.map(get_product_data, productIds)


if __name__ == "__main__":
    main()
