import json

category_list = {}

with open("categories.json") as json_data:
    d = json.load(json_data)
    #print(d)

    for item in d:
      if item["parents"] in ["restaurants", "food"]:
        print item