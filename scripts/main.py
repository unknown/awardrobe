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


def main():
    for id in productIds:
        payload = json.dumps({
            "productId": id
        })
        response = requests.request("GET", endpoint,
                                    headers=headers, data=payload)
        print(f'{response.status_code}: {len(response.json())} entries')


if __name__ == "__main__":
    main()
